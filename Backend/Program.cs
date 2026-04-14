using FluentValidation;
using HotelManagement.Data;
using HotelManagement.DTOs.Booking;
using HotelManagement.Enums;
using HotelManagement.Mappings;
using HotelManagement.Middleware;
using HotelManagement.Models;
using HotelManagement.Repositories.Implementations;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Implementations;
using HotelManagement.Services.Interfaces;
using HotelManagement.Validators.Booking;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Data;

var builder = WebApplication.CreateBuilder(args);
var runtimeInstanceId = Guid.NewGuid().ToString("N");

// ════════════════════════════════════════════════════════════════════════════
// SERILOG
// ════════════════════════════════════════════════════════════════════════════
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/hotel-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// ════════════════════════════════════════════════════════════════════════════
// DATABASE — MySQL + Entity Framework Core
// ════════════════════════════════════════════════════════════════════════════
var connectionString = builder.Configuration.GetConnectionString("HotelDb");
builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString),
        mySqlOptions => mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null)));

// ════════════════════════════════════════════════════════════════════════════
// REPOSITORIES
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IBookingRepository, BookingRepository>();

// ════════════════════════════════════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddScoped<IHotelService, HotelService>();
builder.Services.AddScoped<IRoomTypeService, RoomTypeService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// ════════════════════════════════════════════════════════════════════════════
// FLUENT VALIDATION — tự động scan toàn bộ assembly
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddValidatorsFromAssemblyContaining<CreateBookingValidator>();

// Đăng ký riêng lẻ để inject vào Service constructor
builder.Services.AddScoped<IValidator<CreateBookingDto>, CreateBookingValidator>();
builder.Services.AddScoped<IValidator<CheckInDto>, CheckInValidator>();
builder.Services.AddScoped<IValidator<CheckOutDto>, CheckOutValidator>();
builder.Services.AddScoped<IValidator<CancelBookingDto>, CancelBookingValidator>();
builder.Services.AddScoped<IValidator<BookingFilterDto>, BookingFilterValidator>();

// ════════════════════════════════════════════════════════════════════════════
// AUTO MAPPER
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ════════════════════════════════════════════════════════════════════════════
// JWT AUTHENTICATION
// ════════════════════════════════════════════════════════════════════════════
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is missing.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero   // không cho phép token hết hạn chậm
    };

    // Hỗ trợ SignalR — đọc token từ query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                context.Token = accessToken;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10 MB
});

// ════════════════════════════════════════════════════════════════════════════
// CORS — cho phép Angular dev server
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? new[] { "http://localhost:4200" })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // cần cho SignalR
    });
});

// ════════════════════════════════════════════════════════════════════════════
// SIGNALR
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddSignalR();

// ════════════════════════════════════════════════════════════════════════════
// CONTROLLERS + JSON
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Tránh lỗi circular reference
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ════════════════════════════════════════════════════════════════════════════
// SWAGGER
// ════════════════════════════════════════════════════════════════════════════
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Hotel Management API",
        Version = "v1",
        Description = "API cho hệ thống quản lý và bán phòng khách sạn"
    });

    // Cho phép nhập JWT trong Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập 'Bearer {token}'"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    // Đọc XML comments để hiển thị mô tả trong Swagger
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// ════════════════════════════════════════════════════════════════════════════
// BUILD APP
// ════════════════════════════════════════════════════════════════════════════
var app = builder.Build();

var uploadsRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads");
Directory.CreateDirectory(uploadsRoot);

// ── Global Exception Handler (phải đặt ĐẦUST pipeline) ───────────────────
app.UseGlobalExceptionHandler();

// ── Swagger (chỉ trong Development) ──────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hotel Management API v1");
        c.RoutePrefix = string.Empty;  // Swagger ở root URL
    });
}

app.UseHttpsRedirection();
app.UseSerilogRequestLogging();   // log mỗi HTTP request
app.UseStaticFiles();

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Trả về runtime id của backend để frontend phát hiện server restart.
app.MapGet("/api/session/runtime-id", () => Results.Ok(new { runtimeId = runtimeInstanceId }))
    .AllowAnonymous();

// ── SignalR Hubs ──────────────────────────────────────────────────────────
app.MapHub<HotelManagement.Hubs.RoomHub>("/hubs/room");

// ── DB bootstrap ───────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbBootstrap");

    async Task<bool> ColumnExistsAsync(string tableName, string columnName)
    {
        var connection = db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
            await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = @"SELECT COUNT(*)
                               FROM INFORMATION_SCHEMA.COLUMNS
                               WHERE TABLE_SCHEMA = DATABASE()
                                 AND TABLE_NAME = @tableName
                                 AND COLUMN_NAME = @columnName";

        var tableParam = command.CreateParameter();
        tableParam.ParameterName = "@tableName";
        tableParam.Value = tableName;
        command.Parameters.Add(tableParam);

        var columnParam = command.CreateParameter();
        columnParam.ParameterName = "@columnName";
        columnParam.Value = columnName;
        command.Parameters.Add(columnParam);

        return Convert.ToInt32(await command.ExecuteScalarAsync()) > 0;
    }

    async Task EnsureSeedDataAsync()
    {
        const string adminUsername = "admin";
        const string adminEmail = "admin@hotel.com";
        const string adminPassword = "admin@123";

        var adminUser = await db.Users
            .FirstOrDefaultAsync(u => u.Email == adminEmail || u.Username == adminUsername);

        if (adminUser == null)
        {
            adminUser = new User
            {
                Username = adminUsername,
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, workFactor: 12),
                FullName = "Administrator",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await db.Users.AddAsync(adminUser);
            await db.SaveChangesAsync();
        }
        else
        {
            adminUser.Username = adminUsername;
            adminUser.Email = adminEmail;
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword, workFactor: 12);
            adminUser.Role = UserRole.Admin;
            adminUser.IsActive = true;
            adminUser.UpdatedAt = DateTime.UtcNow;

            db.Users.Update(adminUser);
            await db.SaveChangesAsync();
        }

        var hotel = await db.Hotels.FirstOrDefaultAsync();
        if (hotel == null)
        {
            hotel = new Hotel
            {
                Name = "Antigravity Hotel",
                Address = "1 Nguyen Hue, Quan 1, TP.HCM",
                Phone = "0900000000",
                Email = "contact@antigravityhotel.com",
                Description = "Khach san trung tam voi dich vu tieu chuan 4 sao.",
                StarRating = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await db.Hotels.AddAsync(hotel);
            await db.SaveChangesAsync();
        }

        if (!await db.RoomTypes.AnyAsync(rt => rt.HotelId == hotel.HotelId))
        {
            var deluxe = new RoomType
            {
                HotelId = hotel.HotelId,
                Name = "Deluxe",
                Description = "Phong Deluxe huu nghi, day du tien nghi.",
                MaxOccupancy = 2,
                BasePrice = 900000,
                AreaSqm = 28,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var suite = new RoomType
            {
                HotelId = hotel.HotelId,
                Name = "Suite",
                Description = "Phong Suite rong rai, phu hop gia dinh nho.",
                MaxOccupancy = 4,
                BasePrice = 1500000,
                AreaSqm = 40,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await db.RoomTypes.AddRangeAsync(deluxe, suite);
            await db.SaveChangesAsync();
        }

        var roomTypes = await db.RoomTypes.Where(rt => rt.HotelId == hotel.HotelId).ToListAsync();
        var deluxeType = roomTypes.First(rt => rt.Name == "Deluxe");
        var suiteType = roomTypes.First(rt => rt.Name == "Suite");

        if (!await db.Rooms.AnyAsync(r => r.HotelId == hotel.HotelId))
        {
            var rooms = new List<Room>
            {
                new() { HotelId = hotel.HotelId, RoomTypeId = deluxeType.RoomTypeId, RoomNumber = "D101", Floor = 1, Status = RoomStatus.Available, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { HotelId = hotel.HotelId, RoomTypeId = deluxeType.RoomTypeId, RoomNumber = "D102", Floor = 1, Status = RoomStatus.Available, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { HotelId = hotel.HotelId, RoomTypeId = deluxeType.RoomTypeId, RoomNumber = "D201", Floor = 2, Status = RoomStatus.Dirty, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { HotelId = hotel.HotelId, RoomTypeId = suiteType.RoomTypeId, RoomNumber = "S301", Floor = 3, Status = RoomStatus.Available, IsActive = true, CreatedAt = DateTime.UtcNow },
                new() { HotelId = hotel.HotelId, RoomTypeId = suiteType.RoomTypeId, RoomNumber = "S302", Floor = 3, Status = RoomStatus.Occupied, IsActive = true, CreatedAt = DateTime.UtcNow }
            };

            await db.Rooms.AddRangeAsync(rooms);
            await db.SaveChangesAsync();
        }

        if (!await db.RatePlans.AnyAsync())
        {
            await db.RatePlans.AddRangeAsync(
                new RatePlan
                {
                    RoomTypeId = deluxeType.RoomTypeId,
                    Name = "Gia linh hoat Deluxe",
                    Description = "Khong kem bua sang, linh hoat ngay dat.",
                    PricePerNight = 920000,
                    MealPlan = MealPlan.RoomOnly,
                    IsRefundable = true,
                    CancellationPolicy = "Huy truoc 24 gio",
                    MinStayNights = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new RatePlan
                {
                    RoomTypeId = suiteType.RoomTypeId,
                    Name = "Gia Suite bao gom an sang",
                    Description = "Bao gom bua sang cho toi da 4 khach.",
                    PricePerNight = 1600000,
                    MealPlan = MealPlan.BreakfastIncluded,
                    IsRefundable = true,
                    CancellationPolicy = "Huy truoc 48 gio",
                    MinStayNights = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });

            await db.SaveChangesAsync();
        }

        if (!await db.Promotions.AnyAsync())
        {
            await db.Promotions.AddAsync(new Promotion
            {
                Code = "WELCOME10",
                Name = "Uu dai khach moi",
                Description = "Giam 10% cho don dat dau tien.",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 10,
                MinBookingAmount = 500000,
                StartDate = DateTime.UtcNow.Date,
                EndDate = DateTime.UtcNow.Date.AddMonths(2),
                UsageLimit = 100,
                UsedCount = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }

        if (!await db.Guests.AnyAsync())
        {
            await db.Guests.AddAsync(new Guest
            {
                FullName = "Nguyen Van A",
                Email = "guest1@example.com",
                Phone = "0912345678",
                IdNumber = "079000123456",
                IdType = IdType.CCCD,
                Nationality = "Vietnam",
                Address = "TP.HCM",
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }
    }

    // Auto migrate chỉ bật trong Development.
    if (app.Environment.IsDevelopment())
    {
        await db.Database.MigrateAsync();
    }

    var hasLegacySchemaMismatch =
        !await ColumnExistsAsync("hotels", "hotel_id") ||
        !await ColumnExistsAsync("room_types", "room_type_id") ||
        !await ColumnExistsAsync("guests", "guest_id") ||
        !await ColumnExistsAsync("invoices", "invoice_id") ||
        !await ColumnExistsAsync("payments", "payment_id") ||
        !await ColumnExistsAsync("bookings", "booking_id") ||
        !await ColumnExistsAsync("rooms", "room_id") ||
        !await ColumnExistsAsync("rateplans", "rate_plan_id") ||
        !await ColumnExistsAsync("promotions", "promotion_id");

    if (hasLegacySchemaMismatch)
    {
        logger.LogWarning("Legacy schema mismatch detected. Recreating database and seeding fresh data.");
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }

    // Backfill tối thiểu cho DB cũ thiếu cột users.
    var conn = db.Database.GetDbConnection();
    if (conn.State != ConnectionState.Open)
        await conn.OpenAsync();

    async Task EnsureUserColumnAsync(string columnName)
    {
        await using var check = conn.CreateCommand();
        check.CommandText = @"SELECT COUNT(*)
                             FROM INFORMATION_SCHEMA.COLUMNS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = 'users'
                               AND COLUMN_NAME = @columnName";

        var param = check.CreateParameter();
        param.ParameterName = "@columnName";
        param.Value = columnName;
        check.Parameters.Add(param);

        var exists = Convert.ToInt32(await check.ExecuteScalarAsync()) > 0;
        if (!exists)
        {
            var sql = columnName switch
            {
                "full_name" => "ALTER TABLE users ADD COLUMN full_name VARCHAR(150) NULL",
                "phone" => "ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL",
                "updated_at" => "ALTER TABLE users ADD COLUMN updated_at DATETIME(6) NULL",
                "created_at" => "ALTER TABLE users ADD COLUMN created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)",
                "is_active" => "ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1",
                _ => throw new InvalidOperationException($"Unsupported users column bootstrap: {columnName}")
            };

            await db.Database.ExecuteSqlRawAsync(sql);
        }
    }

    await EnsureUserColumnAsync("full_name");
    await EnsureUserColumnAsync("phone");
    await EnsureUserColumnAsync("updated_at");
    await EnsureUserColumnAsync("created_at");
    await EnsureUserColumnAsync("is_active");

    async Task EnsureRoomColumnAsync(string columnName)
    {
        await using var check = conn.CreateCommand();
        check.CommandText = @"SELECT COUNT(*)
                             FROM INFORMATION_SCHEMA.COLUMNS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = 'rooms'
                               AND COLUMN_NAME = @columnName";

        var param = check.CreateParameter();
        param.ParameterName = "@columnName";
        param.Value = columnName;
        check.Parameters.Add(param);

        var exists = Convert.ToInt32(await check.ExecuteScalarAsync()) > 0;
        if (!exists)
        {
            var sql = columnName switch
            {
                "thumbnail_url" => "ALTER TABLE rooms ADD COLUMN thumbnail_url VARCHAR(500) NULL",
                _ => throw new InvalidOperationException($"Unsupported rooms column bootstrap: {columnName}")
            };

            await db.Database.ExecuteSqlRawAsync(sql);
        }
    }

    await EnsureRoomColumnAsync("thumbnail_url");

    // Đồng bộ kiểu cột role để lưu enum dưới dạng string nhất quán với EF conversion.
    await db.Database.ExecuteSqlRawAsync("ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL");

    await EnsureSeedDataAsync();
}

app.Run();

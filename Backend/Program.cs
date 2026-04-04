using FluentValidation;
using HotelManagement.Data;
using HotelManagement.DTOs.Booking;
using HotelManagement.Mappings;
using HotelManagement.Middleware;
using HotelManagement.Repositories.Implementations;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Implementations;
using HotelManagement.Services.Interfaces;
using HotelManagement.Validators.Booking;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

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

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ── SignalR Hubs ──────────────────────────────────────────────────────────
app.MapHub<HotelManagement.Hubs.RoomHub>("/hubs/room");

// ── DB bootstrap ───────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

    // Auto migrate chỉ bật trong Development.
    if (app.Environment.IsDevelopment())
    {
        await db.Database.MigrateAsync();
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

    // Đồng bộ kiểu cột role để lưu enum dưới dạng string nhất quán với EF conversion.
    await db.Database.ExecuteSqlRawAsync("ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL");
}

app.Run();

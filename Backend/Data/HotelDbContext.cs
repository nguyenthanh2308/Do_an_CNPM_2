using HotelManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Data
{
    public class HotelDbContext : DbContext
    {
        public HotelDbContext(DbContextOptions<HotelDbContext> options) : base(options) { }

        // ===================== DbSet =====================

        public DbSet<User> Users { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Hotel> Hotels { get; set; }
        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<RoomType> RoomTypes { get; set; }
        public DbSet<RoomTypeAmenity> RoomTypeAmenities { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<RatePlan> RatePlans { get; set; }
        public DbSet<Guest> Guests { get; set; }
        public DbSet<Promotion> Promotions { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingRoom> BookingRooms { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<HousekeepingTask> HousekeepingTasks { get; set; }

        // ===================== Fluent API =====================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── RoomTypeAmenity: Composite Primary Key (Many-to-Many) ──────────────
            modelBuilder.Entity<RoomTypeAmenity>(entity =>
            {
                entity.HasKey(rta => new { rta.RoomTypeId, rta.AmenityId });

                entity.HasOne(rta => rta.RoomType)
                      .WithMany(rt => rt.RoomTypeAmenities)
                      .HasForeignKey(rta => rta.RoomTypeId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(rta => rta.Amenity)
                      .WithMany(a => a.RoomTypeAmenities)
                      .HasForeignKey(rta => rta.AmenityId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── RoomType ─────────────────────────────────────────────────────────
            modelBuilder.Entity<RoomType>(entity =>
            {
                entity.HasOne(rt => rt.Hotel)
                      .WithMany(h => h.RoomTypes)
                      .HasForeignKey(rt => rt.HotelId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Room ─────────────────────────────────────────────────────────────
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasOne(r => r.Hotel)
                      .WithMany(h => h.Rooms)
                      .HasForeignKey(r => r.HotelId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.RoomType)
                      .WithMany(rt => rt.Rooms)
                      .HasForeignKey(r => r.RoomTypeId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Unique: mỗi số phòng chỉ xuất hiện một lần trong một khách sạn
                entity.HasIndex(r => new { r.HotelId, r.RoomNumber }).IsUnique();
            });

            // ── RatePlan ─────────────────────────────────────────────────────────
            modelBuilder.Entity<RatePlan>(entity =>
            {
                entity.HasOne(rp => rp.RoomType)
                      .WithMany(rt => rt.RatePlans)
                      .HasForeignKey(rp => rp.RoomTypeId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Guest ─────────────────────────────────────────────────────────────
            modelBuilder.Entity<Guest>(entity =>
            {
                entity.HasOne(g => g.User)
                      .WithMany()
                      .HasForeignKey(g => g.UserId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);
            });

            // ── Booking ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasOne(b => b.Guest)
                      .WithMany(g => g.Bookings)
                      .HasForeignKey(b => b.GuestId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.RatePlan)
                      .WithMany(rp => rp.Bookings)
                      .HasForeignKey(b => b.RatePlanId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Promotion)
                      .WithMany(p => p.Bookings)
                      .HasForeignKey(b => b.PromotionId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasOne(b => b.CreatedByUser)
                      .WithMany(u => u.CreatedBookings)
                      .HasForeignKey(b => b.CreatedByUserId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);
            });

            // ── BookingRoom ───────────────────────────────────────────────────────
            modelBuilder.Entity<BookingRoom>(entity =>
            {
                entity.HasOne(br => br.Booking)
                      .WithMany(b => b.BookingRooms)
                      .HasForeignKey(br => br.BookingId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(br => br.Room)
                      .WithMany(r => r.BookingRooms)
                      .HasForeignKey(br => br.RoomId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Invoice ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasOne(i => i.Booking)
                      .WithMany(b => b.Invoices)
                      .HasForeignKey(i => i.BookingId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(i => i.InvoiceNumber).IsUnique();
            });

            // ── Payment ───────────────────────────────────────────────────────────
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasOne(p => p.Invoice)
                      .WithMany(i => i.Payments)
                      .HasForeignKey(p => p.InvoiceId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── RefreshToken ──────────────────────────────────────────────────────
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasOne(rt => rt.User)
                      .WithMany(u => u.RefreshTokens)
                      .HasForeignKey(rt => rt.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ── HousekeepingTask ──────────────────────────────────────────────────
            modelBuilder.Entity<HousekeepingTask>(entity =>
            {
                entity.HasOne(ht => ht.Room)
                      .WithMany(r => r.HousekeepingTasks)
                      .HasForeignKey(ht => ht.RoomId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Tránh multiple cascade paths: dùng Restrict thay vì Cascade
                entity.HasOne(ht => ht.AssignedToUser)
                      .WithMany(u => u.AssignedTasks)
                      .HasForeignKey(ht => ht.AssignedToUserId)
                      .OnDelete(DeleteBehavior.SetNull)
                      .IsRequired(false);

                entity.HasOne(ht => ht.CreatedByUser)
                      .WithMany(u => u.CreatedTasks)
                      .HasForeignKey(ht => ht.CreatedByUserId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ── Enum Conversions (lưu dạng string trong DB) ──────────────────────
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Room>()
                .Property(r => r.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Booking>()
                .Property(b => b.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Invoice>()
                .Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Payment>()
                .Property(p => p.PaymentMethod)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<Promotion>()
                .Property(p => p.DiscountType)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<RatePlan>()
                .Property(rp => rp.MealPlan)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<HousekeepingTask>()
                .Property(ht => ht.TaskType)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<HousekeepingTask>()
                .Property(ht => ht.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            modelBuilder.Entity<HousekeepingTask>()
                .Property(ht => ht.Priority)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Guest>()
                .Property(g => g.IdType)
                .HasConversion<string>()
                .HasMaxLength(20);

            // ── Unique Constraints ────────────────────────────────────────────────
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Promotion>()
                .HasIndex(p => p.Code)
                .IsUnique();
        }
    }
}

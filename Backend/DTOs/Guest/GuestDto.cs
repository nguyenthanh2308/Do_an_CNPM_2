using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Guest
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class GuestDto
    {
        public long GuestId { get; set; }
        public long? UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? IdNumber { get; set; }
        public string IdType { get; set; } = null!;
        public string? Nationality { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalBookings { get; set; } // computed
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateGuestDto
    {
        [Required] [MaxLength(150)] public string FullName { get; set; } = null!;
        [EmailAddress] [MaxLength(200)] public string? Email { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [MaxLength(50)] public string? IdNumber { get; set; }
        public string IdType { get; set; } = "CCCD";
        [MaxLength(100)] public string? Nationality { get; set; }
        public DateTime? DateOfBirth { get; set; }
        [MaxLength(500)] public string? Address { get; set; }
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateGuestDto
    {
        [MaxLength(150)] public string? FullName { get; set; }
        [EmailAddress] public string? Email { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [MaxLength(50)] public string? IdNumber { get; set; }
        public string? IdType { get; set; }
        [MaxLength(100)] public string? Nationality { get; set; }
        public DateTime? DateOfBirth { get; set; }
        [MaxLength(500)] public string? Address { get; set; }
    }
}

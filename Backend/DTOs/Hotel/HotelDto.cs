using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Hotel
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class HotelDto
    {
        public long HotelId { get; set; }
        public string Name { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Description { get; set; }
        public int StarRating { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool IsActive { get; set; }
        public int TotalRooms { get; set; }      // tổng số phòng (computed)
        public int AvailableRooms { get; set; }   // số phòng trống (computed)
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateHotelDto
    {
        [Required] [MaxLength(200)] public string Name { get; set; } = null!;
        [MaxLength(500)] public string? Address { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [EmailAddress] [MaxLength(200)] public string? Email { get; set; }
        public string? Description { get; set; }
        [Range(1, 5)] public int StarRating { get; set; } = 3;
        public string? ThumbnailUrl { get; set; }
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateHotelDto
    {
        [MaxLength(200)] public string? Name { get; set; }
        [MaxLength(500)] public string? Address { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [EmailAddress] public string? Email { get; set; }
        public string? Description { get; set; }
        [Range(1, 5)] public int? StarRating { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}

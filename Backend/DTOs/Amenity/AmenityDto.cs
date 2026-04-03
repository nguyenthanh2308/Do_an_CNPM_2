using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Amenity
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class AmenityDto
    {
        public long AmenityId { get; set; }
        public string Name { get; set; } = null!;
        public string? Icon { get; set; }
        public string? Description { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateAmenityDto
    {
        [Required] [MaxLength(150)] public string Name { get; set; } = null!;
        [MaxLength(100)] public string? Icon { get; set; }
        [MaxLength(255)] public string? Description { get; set; }
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateAmenityDto
    {
        [MaxLength(150)] public string? Name { get; set; }
        [MaxLength(100)] public string? Icon { get; set; }
        [MaxLength(255)] public string? Description { get; set; }
    }
}

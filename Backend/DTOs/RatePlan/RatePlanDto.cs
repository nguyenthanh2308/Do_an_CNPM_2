using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.RatePlan
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class RatePlanDto
    {
        public long RatePlanId { get; set; }
        public long RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal PricePerNight { get; set; }
        public string MealPlan { get; set; } = null!;
        public bool IsRefundable { get; set; }
        public string? CancellationPolicy { get; set; }
        public int MinStayNights { get; set; }
        public bool IsActive { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateRatePlanDto
    {
        [Required] public long RoomTypeId { get; set; }
        [Required] [MaxLength(150)] public string Name { get; set; } = null!;
        public string? Description { get; set; }
        [Required] [Range(0, double.MaxValue)] public decimal PricePerNight { get; set; }
        public string MealPlan { get; set; } = "RoomOnly";
        public bool IsRefundable { get; set; } = true;
        [MaxLength(500)] public string? CancellationPolicy { get; set; }
        [Range(1, 365)] public int MinStayNights { get; set; } = 1;
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateRatePlanDto
    {
        [MaxLength(150)] public string? Name { get; set; }
        public string? Description { get; set; }
        [Range(0, double.MaxValue)] public decimal? PricePerNight { get; set; }
        public string? MealPlan { get; set; }
        public bool? IsRefundable { get; set; }
        public string? CancellationPolicy { get; set; }
        [Range(1, 365)] public int? MinStayNights { get; set; }
        public bool? IsActive { get; set; }
    }
}

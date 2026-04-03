using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Promotion
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class PromotionDto
    {
        public long PromotionId { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string DiscountType { get; set; } = null!;   // Percentage | Fixed
        public decimal DiscountValue { get; set; }
        public decimal MinBookingAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsExpired => DateTime.UtcNow > EndDate;
        public bool IsFullyUsed => UsageLimit > 0 && UsedCount >= UsageLimit;
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreatePromotionDto
    {
        [Required] [MaxLength(50)] public string Code { get; set; } = null!;
        [Required] [MaxLength(200)] public string Name { get; set; } = null!;
        public string? Description { get; set; }
        [Required] public string DiscountType { get; set; } = "Percentage";
        [Required] [Range(0, double.MaxValue)] public decimal DiscountValue { get; set; }
        [Range(0, double.MaxValue)] public decimal MinBookingAmount { get; set; } = 0;
        [Range(0, double.MaxValue)] public decimal? MaxDiscountAmount { get; set; }
        [Required] public DateTime StartDate { get; set; }
        [Required] public DateTime EndDate { get; set; }
        [Range(0, int.MaxValue)] public int UsageLimit { get; set; } = 0;
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdatePromotionDto
    {
        [MaxLength(200)] public string? Name { get; set; }
        public string? Description { get; set; }
        [Range(0, double.MaxValue)] public decimal? DiscountValue { get; set; }
        [Range(0, double.MaxValue)] public decimal? MinBookingAmount { get; set; }
        [Range(0, double.MaxValue)] public decimal? MaxDiscountAmount { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        [Range(0, int.MaxValue)] public int? UsageLimit { get; set; }
        public bool? IsActive { get; set; }
    }

    // ── Validate Voucher Request/Response ─────────────────────────────────────
    public class ValidateVoucherRequestDto
    {
        [Required] public string Code { get; set; } = null!;
        [Required] [Range(0, double.MaxValue)] public decimal BookingAmount { get; set; }
    }

    public class ValidateVoucherResponseDto
    {
        public bool IsValid { get; set; }
        public string? Message { get; set; }
        public long? PromotionId { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
    }
}

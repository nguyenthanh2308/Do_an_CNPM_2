using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Payment
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class PaymentDto
    {
        public long PaymentId { get; set; }
        public long InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = null!;
        public string GuestName { get; set; } = null!;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public DateTime PaymentDate { get; set; }
        public string? TransactionId { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreatePaymentDto
    {
        [Required] public long InvoiceId { get; set; }
        [Required] [Range(1, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
        public decimal Amount { get; set; }
        [Required] public string PaymentMethod { get; set; } = "Cash";
        [MaxLength(255)] public string? TransactionId { get; set; }
        public string? Notes { get; set; }
    }

    // ── Update status DTO ─────────────────────────────────────────────────────
    public class UpdatePaymentStatusDto
    {
        [Required] public string Status { get; set; } = null!;  // Completed | Failed | Refunded
        [MaxLength(255)] public string? TransactionId { get; set; }
        public string? Notes { get; set; }
    }
}

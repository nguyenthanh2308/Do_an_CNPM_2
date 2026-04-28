using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Invoice
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class InvoiceDto
    {
        public long InvoiceId { get; set; }
        public long BookingId { get; set; }
        public string InvoiceNumber { get; set; } = null!;
        public string GuestName { get; set; } = null!;
        public string RoomNumbers { get; set; } = null!;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NightCount { get; set; }
        public DateTime IssuedAt { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public List<PaymentSummaryDto> Payments { get; set; } = new();
        public decimal PaidAmount { get; set; }       // tổng đã thanh toán
        public decimal RemainingAmount { get; set; }  // còn lại
    }

    // ── Payment nested summary ────────────────────────────────────────────────
    public class PaymentSummaryDto
    {
        public long PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public DateTime PaymentDate { get; set; }
        public string Status { get; set; } = null!;
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateInvoiceDto
    {
        [Required] public long BookingId { get; set; }
        public decimal TaxAmount { get; set; } = 0;
        public string? Notes { get; set; }
    }

    // ── Update Status DTO ─────────────────────────────────────────────────────
    public class UpdateInvoiceStatusDto
    {
        [Required] public string Status { get; set; } = null!; // Pending | Paid | Cancelled
    }
}

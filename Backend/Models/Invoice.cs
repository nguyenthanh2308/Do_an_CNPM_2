using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("invoices")]
    public class Invoice
    {
        [Key]
        [Column("invoice_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long InvoiceId { get; set; }

        [Required]
        [Column("booking_id")]
        public long BookingId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("invoice_number")]
        public string InvoiceNumber { get; set; } = null!;

        [Column("issued_at")]
        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        [Column("subtotal", TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column("tax_amount", TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; } = 0;

        [Column("discount_amount", TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column("total_amount", TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [Column("status")]
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("BookingId")]
        public Booking Booking { get; set; } = null!;

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}

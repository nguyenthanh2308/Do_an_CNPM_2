using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("payment_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long PaymentId { get; set; }

        [Required]
        [Column("invoice_id")]
        public long InvoiceId { get; set; }

        [Required]
        [Column("amount", TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column("payment_method")]
        public PaymentMethod PaymentMethod { get; set; }

        [Column("payment_date")]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [MaxLength(255)]
        [Column("transaction_id")]
        public string? TransactionId { get; set; }

        [Required]
        [Column("status")]
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("InvoiceId")]
        public Invoice Invoice { get; set; } = null!;
    }
}

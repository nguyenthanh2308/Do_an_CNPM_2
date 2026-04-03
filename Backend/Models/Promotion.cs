using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("promotions")]
    public class Promotion
    {
        [Key]
        [Column("promotion_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long PromotionId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("code")]
        public string Code { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("discount_type")]
        public DiscountType DiscountType { get; set; }

        [Required]
        [Column("discount_value", TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; }

        [Column("min_booking_amount", TypeName = "decimal(18,2)")]
        public decimal MinBookingAmount { get; set; } = 0;

        [Column("max_discount_amount", TypeName = "decimal(18,2)")]
        public decimal? MaxDiscountAmount { get; set; }

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("usage_limit")]
        public int UsageLimit { get; set; } = 0; // 0 = unlimited

        [Column("used_count")]
        public int UsedCount { get; set; } = 0;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}

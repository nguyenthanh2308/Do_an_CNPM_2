using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("bookings")]
    public class Booking
    {
        [Key]
        [Column("booking_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long BookingId { get; set; }

        [Required]
        [Column("guest_id")]
        public long GuestId { get; set; }

        [Required]
        [Column("rate_plan_id")]
        public long RatePlanId { get; set; }

        [Column("promotion_id")]
        public long? PromotionId { get; set; }

        /// <summary>
        /// Nhân viên lễ tân tạo booking (null nếu khách tự đặt online)
        /// </summary>
        [Column("created_by_user_id")]
        public long? CreatedByUserId { get; set; }

        [Required]
        [Column("check_in_date")]
        public DateTime CheckInDate { get; set; }

        [Required]
        [Column("check_out_date")]
        public DateTime CheckOutDate { get; set; }

        [Column("actual_check_in")]
        public DateTime? ActualCheckIn { get; set; }

        [Column("actual_check_out")]
        public DateTime? ActualCheckOut { get; set; }

        [Column("num_guests")]
        public int NumGuests { get; set; } = 1;

        [Required]
        [Column("status")]
        public BookingStatus Status { get; set; } = BookingStatus.Pending;

        [Column("total_amount", TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Column("discount_amount", TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column("final_amount", TypeName = "decimal(18,2)")]
        public decimal FinalAmount { get; set; }

        [MaxLength(20)]
        [Column("booking_source")]
        public string BookingSource { get; set; } = "Online"; // Online | WalkIn | Phone

        [Column("special_requests")]
        public string? SpecialRequests { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("GuestId")]
        public Guest Guest { get; set; } = null!;

        [ForeignKey("RatePlanId")]
        public RatePlan RatePlan { get; set; } = null!;

        [ForeignKey("PromotionId")]
        public Promotion? Promotion { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User? CreatedByUser { get; set; }

        public ICollection<BookingRoom> BookingRooms { get; set; } = new List<BookingRoom>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}

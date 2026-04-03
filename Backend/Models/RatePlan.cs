using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("rateplans")]
    public class RatePlan
    {
        [Key]
        [Column("rate_plan_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long RatePlanId { get; set; }

        [Required]
        [Column("room_type_id")]
        public long RoomTypeId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("description")]
        public string? Description { get; set; }

        [Required]
        [Column("price_per_night", TypeName = "decimal(18,2)")]
        public decimal PricePerNight { get; set; }

        [Column("meal_plan")]
        public MealPlan MealPlan { get; set; } = MealPlan.RoomOnly;

        [Column("is_refundable")]
        public bool IsRefundable { get; set; } = true;

        [MaxLength(500)]
        [Column("cancellation_policy")]
        public string? CancellationPolicy { get; set; }

        [Column("min_stay_nights")]
        public int MinStayNights { get; set; } = 1;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("RoomTypeId")]
        public RoomType RoomType { get; set; } = null!;

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}

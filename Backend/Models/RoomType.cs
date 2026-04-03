using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("room_types")]
    public class RoomType
    {
        [Key]
        [Column("room_type_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long RoomTypeId { get; set; }

        [Required]
        [Column("hotel_id")]
        public long HotelId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("description")]
        public string? Description { get; set; }

        [Column("max_occupancy")]
        public int MaxOccupancy { get; set; } = 2;

        [Required]
        [Column("base_price", TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        [MaxLength(500)]
        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("area_sqm")]
        public float? AreaSqm { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("HotelId")]
        public Hotel Hotel { get; set; } = null!;

        public ICollection<Room> Rooms { get; set; } = new List<Room>();
        public ICollection<RatePlan> RatePlans { get; set; } = new List<RatePlan>();
        public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
    }
}

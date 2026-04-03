using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("hotels")]
    public class Hotel
    {
        [Key]
        [Column("hotel_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long HotelId { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [MaxLength(500)]
        [Column("address")]
        public string? Address { get; set; }

        [MaxLength(20)]
        [Column("phone")]
        public string? Phone { get; set; }

        [MaxLength(200)]
        [Column("email")]
        public string? Email { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("star_rating")]
        public int StarRating { get; set; } = 3;

        [MaxLength(500)]
        [Column("thumbnail_url")]
        public string? ThumbnailUrl { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<RoomType> RoomTypes { get; set; } = new List<RoomType>();
        public ICollection<Room> Rooms { get; set; } = new List<Room>();
    }
}

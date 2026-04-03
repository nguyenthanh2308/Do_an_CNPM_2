using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("rooms")]
    public class Room
    {
        [Key]
        [Column("room_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long RoomId { get; set; }

        [Required]
        [Column("hotel_id")]
        public long HotelId { get; set; }

        [Required]
        [Column("room_type_id")]
        public long RoomTypeId { get; set; }

        [Required]
        [MaxLength(20)]
        [Column("room_number")]
        public string RoomNumber { get; set; } = null!;

        [Column("floor")]
        public int Floor { get; set; } = 1;

        [Required]
        [Column("status")]
        public RoomStatus Status { get; set; } = RoomStatus.Available;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("HotelId")]
        public Hotel Hotel { get; set; } = null!;

        [ForeignKey("RoomTypeId")]
        public RoomType RoomType { get; set; } = null!;

        public ICollection<BookingRoom> BookingRooms { get; set; } = new List<BookingRoom>();
        public ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = new List<HousekeepingTask>();
    }
}

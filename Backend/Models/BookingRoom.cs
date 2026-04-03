using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    /// <summary>
    /// Bảng trung gian Many-to-Many giữa Booking và Room.
    /// Một booking có thể bao gồm nhiều phòng.
    /// </summary>
    [Table("booking_rooms")]
    public class BookingRoom
    {
        [Key]
        [Column("booking_room_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long BookingRoomId { get; set; }

        [Required]
        [Column("booking_id")]
        public long BookingId { get; set; }

        [Required]
        [Column("room_id")]
        public long RoomId { get; set; }

        [Column("check_in_date")]
        public DateTime CheckInDate { get; set; }

        [Column("check_out_date")]
        public DateTime CheckOutDate { get; set; }

        [Column("price_per_night", TypeName = "decimal(18,2)")]
        public decimal PricePerNight { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        // Navigation Properties
        [ForeignKey("BookingId")]
        public Booking Booking { get; set; } = null!;

        [ForeignKey("RoomId")]
        public Room Room { get; set; } = null!;
    }
}

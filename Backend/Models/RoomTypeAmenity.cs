using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    /// <summary>
    /// Bảng trung gian Many-to-Many giữa RoomType và Amenity
    /// </summary>
    [Table("room_type_amenities")]
    public class RoomTypeAmenity
    {
        [Column("room_type_id")]
        public long RoomTypeId { get; set; }

        [Column("amenity_id")]
        public long AmenityId { get; set; }

        // Navigation Properties
        [ForeignKey("RoomTypeId")]
        public RoomType RoomType { get; set; } = null!;

        [ForeignKey("AmenityId")]
        public Amenity Amenity { get; set; } = null!;
    }
}

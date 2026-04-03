using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("amenities")]
    public class Amenity
    {
        [Key]
        [Column("amenity_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long AmenityId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("name")]
        public string Name { get; set; } = null!;

        [MaxLength(100)]
        [Column("icon")]
        public string? Icon { get; set; }

        [MaxLength(255)]
        [Column("description")]
        public string? Description { get; set; }

        // Navigation Properties
        public ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();
    }
}

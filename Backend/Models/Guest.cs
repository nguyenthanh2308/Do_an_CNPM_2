using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("guests")]
    public class Guest
    {
        [Key]
        [Column("guest_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long GuestId { get; set; }

        /// <summary>
        /// Liên kết với tài khoản User nếu khách tự đặt phòng online (nullable)
        /// </summary>
        [Column("user_id")]
        public long? UserId { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [MaxLength(200)]
        [Column("email")]
        public string? Email { get; set; }

        [MaxLength(20)]
        [Column("phone")]
        public string? Phone { get; set; }

        [MaxLength(50)]
        [Column("id_number")]
        public string? IdNumber { get; set; }

        [Column("id_type")]
        public IdType IdType { get; set; } = IdType.CCCD;

        [MaxLength(100)]
        [Column("nationality")]
        public string? Nationality { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [MaxLength(500)]
        [Column("address")]
        public string? Address { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}

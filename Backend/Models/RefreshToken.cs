using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("refreshtokens")]
    public class RefreshToken
    {
        [Required]
        [Column("userId")]
        public long UserId { get; set; }

        [Key]
        [Required]
        [MaxLength(512)]
        [Column("token")]
        public string Token { get; set; } = null!;

        [Column("expiresAt")]
        public DateTime ExpiresAt { get; set; }

        [NotMapped]
        public bool IsRevoked { get; set; } = false;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        [NotMapped]
        public string? CreatedByIp { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}

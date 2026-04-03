using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("refreshtokens")]
    public class RefreshToken
    {
        [Key]
        [Column("id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        [Required]
        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [MaxLength(512)]
        [Column("token")]
        public string Token { get; set; } = null!;

        [Column("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [Column("is_revoked")]
        public bool IsRevoked { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        [Column("created_by_ip")]
        public string? CreatedByIp { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}

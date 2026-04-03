using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.User
{
    // ── Response DTO (KHÔNG có PasswordHash) ─────────────────────────────────
    public class UserDto
    {
        public long UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateUserDto
    {
        [Required] [MaxLength(100)] public string Username { get; set; } = null!;
        [Required] [EmailAddress] public string Email { get; set; } = null!;
        [Required] [MinLength(6)] public string Password { get; set; } = null!;
        [MaxLength(150)] public string? FullName { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        [Required] public string Role { get; set; } = "Receptionist";
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateUserDto
    {
        [MaxLength(150)] public string? FullName { get; set; }
        [MaxLength(20)] public string? Phone { get; set; }
        public bool? IsActive { get; set; }
        public string? Role { get; set; }
    }

    // ── Change Password DTO ───────────────────────────────────────────────────
    public class ChangePasswordDto
    {
        [Required] public string OldPassword { get; set; } = null!;
        [Required] [MinLength(6)] public string NewPassword { get; set; } = null!;
        [Required] [Compare("NewPassword")] public string ConfirmPassword { get; set; } = null!;
    }
}

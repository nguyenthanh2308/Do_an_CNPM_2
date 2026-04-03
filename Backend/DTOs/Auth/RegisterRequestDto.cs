using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = "Username không được để trống")]
        [MaxLength(100)]
        public string Username { get; set; } = null!;

        [Required(ErrorMessage = "Email không được để trống")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Mật khẩu không được để trống")]
        [MinLength(6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Xác nhận mật khẩu không được để trống")]
        [Compare("Password", ErrorMessage = "Mật khẩu xác nhận không khớp")]
        public string ConfirmPassword { get; set; } = null!;

        [MaxLength(150)]
        public string? FullName { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        /// <summary>Admin, Manager, Receptionist, Housekeeping</summary>
        [Required]
        public string Role { get; set; } = "Receptionist";
    }

    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = null!;
    }
}

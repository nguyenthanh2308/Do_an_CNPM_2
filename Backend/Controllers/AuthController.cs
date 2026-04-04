using HotelManagement.DTOs.Auth;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.User;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Auth Controller — đăng nhập, đăng ký, refresh token, đăng xuất
    /// </summary>
    public class AuthController : BaseController
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Đăng nhập hệ thống — trả về AccessToken + RefreshToken
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 401)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            _logger.LogInformation("POST /api/auth/login — Email: {Email}", dto.Email);
            var result = await _authService.LoginAsync(dto);
            return Success(result, "Đăng nhập thành công.");
        }

        /// <summary>
        /// Đăng ký tài khoản mới (dùng cho Admin tạo nhân viên)
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
        {
            _logger.LogInformation("POST /api/auth/register — Username: {Username}", dto.Username);
            var user = await _authService.RegisterAsync(dto);
            return Created(user, $"Tài khoản '{user.Username}' đã được tạo thành công.");
        }

        /// <summary>
        /// Làm mới AccessToken bằng RefreshToken
        /// </summary>
        [HttpPost("refresh")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 401)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDto dto)
        {
            _logger.LogInformation("POST /api/auth/refresh");
            var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
            return Success(result, "Token đã được làm mới.");
        }

        /// <summary>
        /// Đăng xuất — thu hồi RefreshToken hiện tại
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            _logger.LogInformation("POST /api/auth/logout — UserId: {UserId}", GetCurrentUserId());
            await _authService.LogoutAsync(dto.RefreshToken);
            return Success<object>(null!, "Đăng xuất thành công.");
        }

        /// <summary>
        /// Lấy thông tin của người dùng đang đăng nhập (từ JWT)
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<UserInfoDto>), 200)]
        [ProducesResponseType(401)]
        public IActionResult GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            var role = GetCurrentUserRole();
            var email = User.Claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" 
                                                     || c.Type == "email")?.Value;
            var username = User.Claims.FirstOrDefault(c => c.Type == "username")?.Value;

            if (userId == null) return Fail("Unauthorized", 401);

            var userInfo = new UserInfoDto
            {
                UserId = userId.Value,
                Username = username ?? string.Empty,
                Email = email ?? string.Empty,
                FullName = User.Claims.FirstOrDefault(c => c.Type == "fullname")?.Value ?? string.Empty,
                Role = role ?? string.Empty
            };

            return Success(userInfo);
        }
    }
}

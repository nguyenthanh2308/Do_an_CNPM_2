using HotelManagement.DTOs.Auth;

namespace HotelManagement.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto dto);
        Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(string refreshToken);
        Task<DTOs.User.UserDto> RegisterAsync(DTOs.Auth.RegisterRequestDto dto);
    }
}

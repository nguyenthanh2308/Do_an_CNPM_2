using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Auth;
using HotelManagement.DTOs.User;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace HotelManagement.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;

        // JWT settings
        private string SecretKey => _config["JwtSettings:SecretKey"]!;
        private string Issuer => _config["JwtSettings:Issuer"]!;
        private string Audience => _config["JwtSettings:Audience"]!;
        private int AccessExpiryMinutes => int.Parse(_config["JwtSettings:AccessTokenExpiryMinutes"] ?? "60");
        private int RefreshExpiryDays => int.Parse(_config["JwtSettings:RefreshTokenExpiryDays"] ?? "30");

        public AuthService(HotelDbContext context, IMapper mapper,
            IConfiguration config, ILogger<AuthService> logger)
        {
            _context = context;
            _mapper = mapper;
            _config = config;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // ĐĂNG KÝ
        // ════════════════════════════════════════════════════════════════════
        public async Task<UserDto> RegisterAsync(RegisterRequestDto dto)
        {
            // Kiểm tra email/username trùng
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw AppException.Conflict("Email đã được sử dụng.");

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                throw AppException.Conflict("Username đã tồn tại.");

            // Parse role
            if (!Enum.TryParse<UserRole>(dto.Role, true, out var role))
                throw new AppException($"Role '{dto.Role}' không hợp lệ.");

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCryptHashPassword(dto.Password),
                FullName = dto.FullName,
                Phone = dto.Phone,
                Role = role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User '{Username}' registered with role '{Role}'.", user.Username, user.Role);
            return _mapper.Map<UserDto>(user);
        }

        // ════════════════════════════════════════════════════════════════════
        // ĐĂNG NHẬP
        // ════════════════════════════════════════════════════════════════════
        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive)
                ?? throw AppException.NotFound("Email hoặc mật khẩu không đúng.");

            if (!BCryptVerifyPassword(dto.Password, user.PasswordHash))
                throw new AppException("Email hoặc mật khẩu không đúng.", 401);

            // Tạo token mới
            var accessToken = GenerateAccessToken(user);
            var refreshToken = await CreateRefreshTokenAsync(user.UserId);

            await _context.SaveChangesAsync();

            _logger.LogInformation("User '{Username}' logged in.", user.Username);

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(AccessExpiryMinutes),
                User = _mapper.Map<UserInfoDto>(user)
            };
        }

        // ════════════════════════════════════════════════════════════════════
        // REFRESH TOKEN
        // ════════════════════════════════════════════════════════════════════
        public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken)
                ?? throw new AppException("Refresh token không hợp lệ.", 401);

            if (tokenEntity.ExpiresAt < DateTime.UtcNow)
                throw new AppException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.", 401);

            var user = tokenEntity.User;
            if (!user.IsActive)
                throw new AppException("Tài khoản đã bị vô hiệu hóa.", 403);

            // Tạo token mới
            var newAccessToken = GenerateAccessToken(user);
            var newRefreshToken = await CreateRefreshTokenAsync(user.UserId);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Token refreshed for user '{Username}'.", user.Username);

            return new LoginResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken.Token,
                ExpiresAt = DateTime.UtcNow.AddMinutes(AccessExpiryMinutes),
                User = _mapper.Map<UserInfoDto>(user)
            };
        }

        // ════════════════════════════════════════════════════════════════════
        // ĐĂNG XUẤT
        // ════════════════════════════════════════════════════════════════════
        public async Task LogoutAsync(string refreshToken)
        {
            var tokenEntity = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (tokenEntity != null)
            {
                _context.RefreshTokens.Remove(tokenEntity);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("RefreshToken revoked during logout.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ════════════════════════════════════════════════════════════════════

        private string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("userId", user.UserId.ToString()),
                new Claim("username", user.Username),
                new Claim("role", user.Role.ToString()),
                new Claim(ClaimTypes.Role, user.Role.ToString())   // dùng cho [Authorize(Roles=...)]
            };

            var token = new JwtSecurityToken(
                issuer: Issuer,
                audience: Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(AccessExpiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<RefreshToken> CreateRefreshTokenAsync(long userId)
        {
            var token = new RefreshToken
            {
                UserId = userId,
                Token = GenerateSecureToken(),
                ExpiresAt = DateTime.UtcNow.AddDays(RefreshExpiryDays),
                CreatedAt = DateTime.UtcNow
            };

            await _context.RefreshTokens.AddAsync(token);
            return token;
        }

        private static string GenerateSecureToken()
        {
            var bytes = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes);
        }

        private static string BCryptHashPassword(string password)
            => BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

        private static bool BCryptVerifyPassword(string password, string hash)
            => BCrypt.Net.BCrypt.Verify(password, hash);
    }
}

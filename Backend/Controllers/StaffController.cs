using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.ComponentModel.DataAnnotations;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Staff Controller — Admin quản lý danh sách nhân viên, đổi role, đặt lại mật khẩu
    /// </summary>
    [Authorize(Roles = "Admin")]
    public class StaffController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly ILogger<StaffController> _logger;

        public StaffController(HotelDbContext context, ILogger<StaffController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>Lấy danh sách tất cả tài khoản nhân viên (loại trừ Guest)</summary>
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? role, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var query = _context.Users
                .Where(u => u.Role != UserRole.Guest)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var roleEnum))
                query = query.Where(u => u.Role == roleEnum);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower().Trim();
                query = query.Where(u => u.Username.ToLower().Contains(s)
                    || (u.FullName != null && u.FullName.ToLower().Contains(s))
                    || u.Email.ToLower().Contains(s));
            }

            var total = await query.CountAsync();
            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new StaffDto
                {
                    UserId = u.UserId,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone,
                    Role = u.Role.ToString(),
                    IsActive = u.IsActive,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            _logger.LogInformation("GET /api/staff — {Count} records", total);
            return Success(new PagedResult<StaffDto>
            {
                Data = users, Page = page, PageSize = pageSize, TotalCount = total
            });
        }

        /// <summary>Cập nhật Role của nhân viên</summary>
        [HttpPut("{id:long}/role")]
        public async Task<IActionResult> UpdateRole(long id, [FromBody] UpdateStaffRoleDto dto)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw AppException.NotFound($"Tài khoản #{id} không tồn tại.");

            if (user.Role == UserRole.Guest)
                throw new AppException("Không thể thay đổi role của tài khoản Guest.");

            if (!Enum.TryParse<UserRole>(dto.Role, true, out var newRole) || newRole == UserRole.Guest)
                throw new AppException($"Role '{dto.Role}' không hợp lệ. Giá trị hợp lệ: Admin, Manager, Receptionist, Housekeeping.");

            var old = user.Role;
            user.Role = newRole;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff #{Id} role changed: {Old} → {New}", id, old, newRole);
            return Success(new { userId = id, role = newRole.ToString() }, $"Đã cập nhật chức vụ → {newRole}.");
        }

        /// <summary>Đặt lại mật khẩu cho nhân viên</summary>
        [HttpPut("{id:long}/password")]
        public async Task<IActionResult> ResetPassword(long id, [FromBody] ResetPasswordDto dto)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw AppException.NotFound($"Tài khoản #{id} không tồn tại.");

            if (dto.NewPassword.Length < 6)
                throw new AppException("Mật khẩu mới phải có ít nhất 6 ký tự.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff #{Id} password reset by Admin", id);
            return Success<object>(null!, "Đã đặt lại mật khẩu thành công.");
        }

        /// <summary>Bật/tắt tài khoản nhân viên</summary>
        [HttpPut("{id:long}/toggle-active")]
        public async Task<IActionResult> ToggleActive(long id)
        {
            var user = await _context.Users.FindAsync(id)
                ?? throw AppException.NotFound($"Tài khoản #{id} không tồn tại.");

            if (user.UserId == GetCurrentUserId())
                throw new AppException("Không thể vô hiệu hóa tài khoản của chính mình.");

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var action = user.IsActive ? "kích hoạt" : "vô hiệu hóa";
            return Success(new { userId = id, isActive = user.IsActive }, $"Đã {action} tài khoản.");
        }
    }

    // ── DTOs ────────────────────────────────────────────────────────────────────
    public class StaffDto
    {
        public long UserId { get; set; }
        public string Username { get; set; } = null!;
        public string? FullName { get; set; }
        public string Email { get; set; } = null!;
        public string? Phone { get; set; }
        public string Role { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateStaffRoleDto
    {
        [Required] public string Role { get; set; } = null!;
    }

    public class ResetPasswordDto
    {
        [Required] [MinLength(6)] public string NewPassword { get; set; } = null!;
    }
}

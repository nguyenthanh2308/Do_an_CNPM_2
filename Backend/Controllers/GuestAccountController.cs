using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Guest;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Hồ sơ khách đăng nhập (role Guest) — tách khỏi CRM /api/guests (staff only).
    /// </summary>
    [ApiController]
    [Route("api/guest-account")]
    [Authorize(Roles = "Guest")]
    public class GuestAccountController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public GuestAccountController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet("profile")]
        [ProducesResponseType(typeof(ApiResponse<GuestDto>), 200)]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId() ?? throw new AppException("Chưa đăng nhập.", 401);
            var guest = await EnsureGuestProfileAsync(userId);
            var mapped = _mapper.Map<GuestDto>(guest);
            return Success(mapped);
        }

        [HttpPut("profile")]
        [ProducesResponseType(typeof(ApiResponse<GuestDto>), 200)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateGuestDto dto)
        {
            var userId = GetCurrentUserId() ?? throw new AppException("Chưa đăng nhập.", 401);
            var guest = await EnsureGuestProfileAsync(userId);

            if (!string.IsNullOrWhiteSpace(dto.IdNumber) && dto.IdNumber != guest.IdNumber)
            {
                var exists = await _context.Guests.AnyAsync(g => g.IdNumber == dto.IdNumber && g.GuestId != guest.GuestId);
                if (exists)
                    throw AppException.Conflict($"Số giấy tờ '{dto.IdNumber}' đang được dùng bởi tài khoản khác.");
            }

            if (dto.FullName != null) guest.FullName = dto.FullName;
            if (dto.Email != null) guest.Email = dto.Email;
            if (dto.Phone != null) guest.Phone = dto.Phone;
            if (dto.IdNumber != null) guest.IdNumber = dto.IdNumber;

            if (!string.IsNullOrWhiteSpace(dto.IdType) && Enum.TryParse<IdType>(dto.IdType, true, out var idTypeParsed))
                guest.IdType = idTypeParsed;

            if (dto.Nationality != null) guest.Nationality = dto.Nationality;
            if (dto.DateOfBirth.HasValue) guest.DateOfBirth = dto.DateOfBirth;
            if (dto.Address != null) guest.Address = dto.Address;

            guest.UpdatedAt = DateTime.UtcNow;
            _context.Guests.Update(guest);
            await _context.SaveChangesAsync();

            var reloaded = await _context.Guests
                .Include(g => g.Bookings)
                .FirstAsync(g => g.GuestId == guest.GuestId);

            return Success(_mapper.Map<GuestDto>(reloaded), "Cập nhật hồ sơ thành công.");
        }

        private async Task<Guest> EnsureGuestProfileAsync(long userId)
        {
            var guest = await _context.Guests
                .Include(g => g.Bookings)
                .FirstOrDefaultAsync(g => g.UserId == userId);

            if (guest != null)
                return guest;

            var user = await _context.Users.FindAsync(userId)
                       ?? throw AppException.NotFound("Không tìm thấy tài khoản.");

            guest = new Guest
            {
                UserId = user.UserId,
                FullName = user.FullName ?? user.Username,
                Email = user.Email,
                Phone = user.Phone,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Guests.AddAsync(guest);
            await _context.SaveChangesAsync();

            return await _context.Guests
                .Include(g => g.Bookings)
                .FirstAsync(g => g.GuestId == guest.GuestId);
        }
    }
}

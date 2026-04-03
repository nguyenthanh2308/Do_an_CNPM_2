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
    /// Guests Controller — Quản lý hồ sơ khách hàng (CRM)
    /// </summary>
    [Authorize(Roles = "Admin,Manager,Receptionist")]
    public class GuestsController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public GuestsController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // ════════════════════════════════════════════════════════════════════
        // GET ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Danh sách khách hàng kèm bộ lọc tìm kiếm và phân trang
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<GuestDto>>), 200)]
        public async Task<IActionResult> GetPaged(
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Guests
                .Include(g => g.Bookings) // Dùng để tính TotalBookings
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var lowerSearch = search.ToLower().Trim();
                query = query.Where(g => 
                    g.FullName.ToLower().Contains(lowerSearch) ||
                    (g.Phone != null && g.Phone.Contains(lowerSearch)) ||
                    (g.IdNumber != null && g.IdNumber.Contains(lowerSearch)) ||
                    (g.Email != null && g.Email.ToLower().Contains(lowerSearch)));
            }

            var totalCount = await query.CountAsync();

            var guests = await query
                .OrderByDescending(g => g.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Success(new PagedResult<GuestDto>
            {
                Data = _mapper.Map<List<GuestDto>>(guests),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        /// <summary>
        /// Xem chi tiết thông tin một khách hàng
        /// </summary>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<GuestDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(long id)
        {
            var guest = await _context.Guests
                .Include(g => g.Bookings)
                .FirstOrDefaultAsync(g => g.GuestId == id)
                ?? throw AppException.NotFound($"Guest #{id}");

            return Success(_mapper.Map<GuestDto>(guest));
        }

        // ════════════════════════════════════════════════════════════════════
        // POST ENDPOINTS (TẠO MỚI)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Thêm mới một hồ sơ khách hàng
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<GuestDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Create([FromBody] CreateGuestDto dto)
        {
            // Kiểm tra trùng lặp thông tin định danh (CCCD/Passport)
            if (!string.IsNullOrWhiteSpace(dto.IdNumber))
            {
                var exists = await _context.Guests.AnyAsync(g => g.IdNumber == dto.IdNumber);
                if (exists)
                    throw AppException.Conflict($"Khách hàng với giấy tờ '{dto.IdNumber}' đã tồn tại trong hệ thống.");
            }

            if (!Enum.TryParse<IdType>(dto.IdType, true, out var idTypeParsed))
            {
                idTypeParsed = IdType.CCCD;
            }

            var guest = new Guest
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Phone = dto.Phone,
                IdNumber = dto.IdNumber,
                IdType = idTypeParsed,
                Nationality = dto.Nationality,
                DateOfBirth = dto.DateOfBirth,
                Address = dto.Address,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Guests.AddAsync(guest);
            await _context.SaveChangesAsync();

            return Created(_mapper.Map<GuestDto>(guest), $"Tạo hồ sơ khách hàng '{guest.FullName}' thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PUT ENDPOINTS (CẬP NHẬT)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Chỉnh sửa thông tin hồ sơ khách hàng
        /// </summary>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<GuestDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateGuestDto dto)
        {
            var guest = await _context.Guests.FindAsync(id)
                ?? throw AppException.NotFound($"Guest #{id}");

            // Nếu update số CMND/CCCD, kiểm tra trùng lặp với người khác
            if (!string.IsNullOrWhiteSpace(dto.IdNumber) && dto.IdNumber != guest.IdNumber)
            {
                var exists = await _context.Guests.AnyAsync(g => g.IdNumber == dto.IdNumber && g.GuestId != id);
                if (exists)
                    throw AppException.Conflict($"Số ID '{dto.IdNumber}' đang được sử dụng bởi khách hàng khác.");
            }

            if (dto.FullName != null) guest.FullName = dto.FullName;
            if (dto.Email != null) guest.Email = dto.Email;
            if (dto.Phone != null) guest.Phone = dto.Phone;
            if (dto.IdNumber != null) guest.IdNumber = dto.IdNumber;
            
            if (!string.IsNullOrWhiteSpace(dto.IdType))
            {
                if (Enum.TryParse<IdType>(dto.IdType, true, out var idTypeParsed))
                    guest.IdType = idTypeParsed;
            }

            if (dto.Nationality != null) guest.Nationality = dto.Nationality;
            if (dto.DateOfBirth.HasValue) guest.DateOfBirth = dto.DateOfBirth;
            if (dto.Address != null) guest.Address = dto.Address;

            _context.Guests.Update(guest);
            await _context.SaveChangesAsync();

            // Load lại đầy đủ (bao gồm Bookings count)
            var returnGuest = await _context.Guests
                .Include(g => g.Bookings)
                .FirstOrDefaultAsync(g => g.GuestId == id);

            return Success(_mapper.Map<GuestDto>(returnGuest), $"Cập nhật hồ sơ khách '{guest.FullName}' thành công.");
        }

        // Ghi chú: CRM khách sạn thường không cho phép hard delete dữ liệu Khách hàng để phục vụ thống kê lịch sử.
        // Chỉ có tính năng Gộp Hồ Sơ (Merge Profiles) hoặc Vô hiệu hóa ở các bản nâng cấp sau.
    }
}

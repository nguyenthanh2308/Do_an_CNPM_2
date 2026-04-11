using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Room;
using HotelManagement.DTOs.RoomType;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Rooms Controller — quản lý phòng và loại phòng
    /// </summary>
    [Authorize]
    public class RoomsController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<RoomsController> _logger;

        public RoomsController(HotelDbContext context, IMapper mapper, ILogger<RoomsController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // ROOMS — CRUD
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Lấy danh sách tất cả phòng</summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoomDto>>), 200)]
        public async Task<IActionResult> GetAll(
            [FromQuery] long? hotelId,
            [FromQuery] long? roomTypeId,
            [FromQuery] string? status)
        {
            var query = _context.Rooms
                .Include(r => r.Hotel)
                .Include(r => r.RoomType)
                .Where(r => r.IsActive)
                .AsQueryable();

            if (hotelId.HasValue) query = query.Where(r => r.HotelId == hotelId.Value);
            if (roomTypeId.HasValue) query = query.Where(r => r.RoomTypeId == roomTypeId.Value);
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<RoomStatus>(status, true, out var roomStatus))
                query = query.Where(r => r.Status == roomStatus);

            var rooms = await query.OrderBy(r => r.Floor).ThenBy(r => r.RoomNumber).ToListAsync();
            return Success(_mapper.Map<IEnumerable<RoomDto>>(rooms));
        }

        /// <summary>Lấy chi tiết phòng theo ID</summary>
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<RoomDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(long id)
        {
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .Include(r => r.RoomType)
                    .ThenInclude(rt => rt.RoomTypeAmenities)
                        .ThenInclude(rta => rta.Amenity)
                .FirstOrDefaultAsync(r => r.RoomId == id && r.IsActive)
                ?? throw AppException.NotFound($"Room #{id}");

            return Success(_mapper.Map<RoomDto>(room));
        }

        /// <summary>Lấy RatePlans của một phòng (qua RoomType)</summary>
        [HttpGet("{id:long}/rateplans")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DTOs.RatePlan.RatePlanDto>>), 200)]
        public async Task<IActionResult> GetRatePlans(long id)
        {
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                    .ThenInclude(rt => rt.RatePlans)
                .FirstOrDefaultAsync(r => r.RoomId == id && r.IsActive)
                ?? throw AppException.NotFound($"Room #{id}");

            var ratePlans = room.RoomType.RatePlans.Where(rp => rp.IsActive);
            return Success(_mapper.Map<IEnumerable<DTOs.RatePlan.RatePlanDto>>(ratePlans));
        }

        /// <summary>Tạo phòng mới — Manager only</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RoomDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Create([FromBody] CreateRoomDto dto)
        {
            // Kiểm tra RoomNumber trùng trong cùng Hotel
            var exists = await _context.Rooms
                .AnyAsync(r => r.HotelId == dto.HotelId && r.RoomNumber == dto.RoomNumber && r.IsActive);
            if (exists)
                throw AppException.Conflict($"Phòng '{dto.RoomNumber}' đã tồn tại trong khách sạn này.");

            // Kiểm tra RoomType thuộc Hotel
            var roomType = await _context.RoomTypes
                .FirstOrDefaultAsync(rt => rt.RoomTypeId == dto.RoomTypeId && rt.HotelId == dto.HotelId)
                ?? throw new AppException($"Loại phòng #{dto.RoomTypeId} không thuộc khách sạn #{dto.HotelId}.");

            var room = _mapper.Map<Room>(dto);
            await _context.Rooms.AddAsync(room);
            await _context.SaveChangesAsync();

            var created = await _context.Rooms
                .Include(r => r.Hotel).Include(r => r.RoomType)
                .FirstAsync(r => r.RoomId == room.RoomId);

            _logger.LogInformation("Room '{RoomNumber}' created in Hotel #{HotelId}.", dto.RoomNumber, dto.HotelId);
            return Created(_mapper.Map<RoomDto>(created), $"Phòng '{dto.RoomNumber}' đã được tạo.");
        }

        /// <summary>Cập nhật thông tin phòng — Manager only</summary>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RoomDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateRoomDto dto)
        {
            var room = await _context.Rooms.FindAsync(id)
                       ?? throw AppException.NotFound($"Room #{id}");

            _mapper.Map(dto, room);
            room.UpdatedAt = DateTime.UtcNow;
            _context.Rooms.Update(room);
            await _context.SaveChangesAsync();

            var updated = await _context.Rooms
                .Include(r => r.Hotel).Include(r => r.RoomType)
                .FirstAsync(r => r.RoomId == id);

            return Success(_mapper.Map<RoomDto>(updated), "Cập nhật phòng thành công.");
        }

        /// <summary>
        /// Cập nhật trạng thái phòng — Housekeeping và Manager
        /// </summary>
        [HttpPut("{id:long}/status")]
        [Authorize(Roles = "Admin,Manager,Receptionist,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<RoomDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateRoomStatusDto dto)
        {
            if (!Enum.TryParse<RoomStatus>(dto.Status, true, out var newStatus))
                return Fail($"Trạng thái '{dto.Status}' không hợp lệ. Chấp nhận: Available, Occupied, Dirty, Maintenance, OutOfService.");

            var room = await _context.Rooms.Include(r => r.Hotel).Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.RoomId == id)
                ?? throw AppException.NotFound($"Room #{id}");

            var oldStatus = room.Status;
            room.Status = newStatus;
            room.Notes = dto.Notes ?? room.Notes;
            room.UpdatedAt = DateTime.UtcNow;

            _context.Rooms.Update(room);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Room #{Id} status changed: {Old} → {New} by User #{UserId}",
                id, oldStatus, newStatus, GetCurrentUserId());

            return Success(_mapper.Map<RoomDto>(room),
                $"Trạng thái phòng {room.RoomNumber} đã cập nhật: {oldStatus} → {newStatus}.");
        }

        /// <summary>Xóa mềm phòng (IsActive = false) — Admin only</summary>
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(long id)
        {
            var room = await _context.Rooms.FindAsync(id)
                       ?? throw AppException.NotFound($"Room #{id}");

            // Không xóa nếu đang có khách ở
            if (room.Status == RoomStatus.Occupied)
                throw new AppException("Không thể xóa phòng đang có khách ở.");

            room.IsActive = false;
            room.UpdatedAt = DateTime.UtcNow;
            _context.Rooms.Update(room);
            await _context.SaveChangesAsync();

            return Success<object>(null!, $"Phòng #{id} đã được vô hiệu hóa.");
        }

        // ════════════════════════════════════════════════════════════════════
        // ROOM TYPES — CRUD
        // ════════════════════════════════════════════════════════════════════

        /// <summary>Lấy danh sách loại phòng</summary>
        [HttpGet("/api/room-types")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoomTypeDto>>), 200)]
        public async Task<IActionResult> GetRoomTypes([FromQuery] long? hotelId)
        {
            var query = _context.RoomTypes
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .Where(rt => rt.IsActive)
                .AsQueryable();

            if (hotelId.HasValue) query = query.Where(rt => rt.HotelId == hotelId.Value);

            var roomTypes = await query.ToListAsync();
            return Success(_mapper.Map<IEnumerable<RoomTypeDto>>(roomTypes));
        }

        /// <summary>Lấy chi tiết loại phòng theo ID</summary>
        [HttpGet("/api/room-types/{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<RoomTypeDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetRoomTypeById(long id)
        {
            var roomType = await _context.RoomTypes
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RatePlans.Where(rp => rp.IsActive))
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .FirstOrDefaultAsync(rt => rt.RoomTypeId == id && rt.IsActive)
                ?? throw AppException.NotFound($"RoomType #{id}");

            return Success(_mapper.Map<RoomTypeDto>(roomType));
        }

        /// <summary>Tạo loại phòng mới — Manager only</summary>
        [HttpPost("/api/room-types")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RoomTypeDto>), 201)]
        public async Task<IActionResult> CreateRoomType([FromBody] CreateRoomTypeDto dto)
        {
            var roomType = _mapper.Map<RoomType>(dto);
            await _context.RoomTypes.AddAsync(roomType);
            await _context.SaveChangesAsync();

            // Gán Amenities
            if (dto.AmenityIds.Any())
            {
                var amenities = dto.AmenityIds.Select(aid => new RoomTypeAmenity
                {
                    RoomTypeId = roomType.RoomTypeId,
                    AmenityId = aid
                });
                await _context.RoomTypeAmenities.AddRangeAsync(amenities);
                await _context.SaveChangesAsync();
            }

            var created = await _context.RoomTypes
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .FirstAsync(rt => rt.RoomTypeId == roomType.RoomTypeId);

            return Created(_mapper.Map<RoomTypeDto>(created), $"Loại phòng '{dto.Name}' đã được tạo.");
        }

        /// <summary>Cập nhật loại phòng — Manager only</summary>
        [HttpPut("/api/room-types/{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RoomTypeDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateRoomType(long id, [FromBody] UpdateRoomTypeDto dto)
        {
            var roomType = await _context.RoomTypes
                .Include(rt => rt.RoomTypeAmenities)
                .FirstOrDefaultAsync(rt => rt.RoomTypeId == id)
                ?? throw AppException.NotFound($"RoomType #{id}");

            _mapper.Map(dto, roomType);

            // Cập nhật lại toàn bộ Amenities nếu được truyền
            if (dto.AmenityIds != null)
            {
                _context.RoomTypeAmenities.RemoveRange(roomType.RoomTypeAmenities);
                var newAmenities = dto.AmenityIds.Select(aid => new RoomTypeAmenity
                {
                    RoomTypeId = id,
                    AmenityId = aid
                });
                await _context.RoomTypeAmenities.AddRangeAsync(newAmenities);
            }

            _context.RoomTypes.Update(roomType);
            await _context.SaveChangesAsync();

            var updated = await _context.RoomTypes
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .FirstAsync(rt => rt.RoomTypeId == id);

            return Success(_mapper.Map<RoomTypeDto>(updated), "Cập nhật loại phòng thành công.");
        }

        /// <summary>Xóa mềm loại phòng — Admin only</summary>
        [HttpDelete("/api/room-types/{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> DeleteRoomType(long id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id)
                           ?? throw AppException.NotFound($"RoomType #{id}");

            var hasActiveRooms = await _context.Rooms
                .AnyAsync(r => r.RoomTypeId == id && r.IsActive);
            if (hasActiveRooms)
                throw new AppException("Không thể xóa loại phòng còn phòng đang hoạt động.");

            roomType.IsActive = false;
            _context.RoomTypes.Update(roomType);
            await _context.SaveChangesAsync();

            return Success<object>(null!, $"Loại phòng #{id} đã được vô hiệu hóa.");
        }
    }
}

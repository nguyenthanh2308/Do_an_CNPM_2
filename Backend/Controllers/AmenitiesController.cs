using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Amenity;
using HotelManagement.DTOs.Common;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Amenities Controller — Quản lý danh mục Tiện ích (Wifi, Bể bơi, Gym, TV...)
    /// API Prefix: /api/Amenities
    /// </summary>
    [Authorize(Roles = "Admin,Manager")]
    public class AmenitiesController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public AmenitiesController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // ════════════════════════════════════════════════════════════════════
        // GET ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Lấy toàn bộ danh sách tiện ích
        /// Lễ tân và Khách hàng (hiển thị giao diện) có thể truy xuất
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AmenityDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var amenities = await _context.Amenities
                .OrderBy(a => a.Name)
                .ToListAsync();

            return Success(_mapper.Map<IEnumerable<AmenityDto>>(amenities));
        }

        /// <summary>
        /// Xem chi tiết tiện ích theo ID
        /// </summary>
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AmenityDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(long id)
        {
            var amenity = await _context.Amenities.FindAsync(id)
                ?? throw AppException.NotFound($"Amenity #{id}");

            return Success(_mapper.Map<AmenityDto>(amenity));
        }

        // ════════════════════════════════════════════════════════════════════
        // POST ENDPOINTS (TẠO MỚI)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Thêm một loại tiện ích mới vào hệ thống
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<AmenityDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateAmenityDto dto)
        {
            // Kiểm tra trùng tên tiện ích
            if (await _context.Amenities.AnyAsync(a => a.Name.ToLower() == dto.Name.ToLower()))
            {
                throw AppException.Conflict($"Tiện ích có tên '{dto.Name}' đã tồn tại.");
            }

            var amenity = _mapper.Map<Amenity>(dto);

            await _context.Amenities.AddAsync(amenity);
            await _context.SaveChangesAsync();

            return Created(_mapper.Map<AmenityDto>(amenity), $"Tạo tiện ích '{amenity.Name}' thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PUT ENDPOINTS (CẬP NHẬT)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Sửa thông tin tiện ích (icon, mô tả)
        /// </summary>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<AmenityDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateAmenityDto dto)
        {
            var amenity = await _context.Amenities.FindAsync(id)
                ?? throw AppException.NotFound($"Amenity #{id}");

            // Ràng buộc trùng lặp tên
            if (dto.Name != null && dto.Name != amenity.Name)
            {
                if (await _context.Amenities.AnyAsync(a => a.Name.ToLower() == dto.Name.ToLower() && a.AmenityId != id))
                    throw AppException.Conflict($"Tiện ích có tên '{dto.Name}' đã tồn tại.");
            }

            _mapper.Map(dto, amenity);
            _context.Amenities.Update(amenity);
            await _context.SaveChangesAsync();

            return Success(_mapper.Map<AmenityDto>(amenity), $"Cập nhật tiện ích '{amenity.Name}' thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // DELETE ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Xóa tiện ích khỏi hệ thống (Cảnh báo: Sẽ xóa khóa ngoại với các RoomType)
        /// </summary>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Delete(long id)
        {
            var amenity = await _context.Amenities.FindAsync(id)
                ?? throw AppException.NotFound($"Amenity #{id}");

            // Entity framework sẽ tự động cascade xóa bảng trung gian RoomTypeAmenity nếu có setting DB
            // Nếu không set cascade xóa, cần xóa tay:
            var relations = await _context.RoomTypeAmenities.Where(rta => rta.AmenityId == id).ToListAsync();
            if (relations.Any())
            {
                _context.RoomTypeAmenities.RemoveRange(relations);
            }

            _context.Amenities.Remove(amenity);
            await _context.SaveChangesAsync();

            return Success((object)null!, $"Tiện ích '{amenity.Name}' đã bị xóa khỏi hệ thống.");
        }
    }
}

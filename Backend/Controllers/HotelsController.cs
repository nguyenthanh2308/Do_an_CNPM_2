using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Hotel;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Hotels Controller — Quản lý khách sạn (Admin/Manager only)
    /// </summary>
    [Authorize]
    public class HotelsController : BaseController
    {
        private readonly IHotelService _hotelService;

        public HotelsController(IHotelService hotelService)
        {
            _hotelService = hotelService;
        }

        /// <summary>Lấy danh sách khách sạn (phân trang)</summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<HotelDto>>), 200)]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _hotelService.GetPagedHotelsAsync(page, pageSize);
            return Success(result);
        }

        /// <summary>Lấy tất cả khách sạn (không phân trang)</summary>
        [HttpGet("all")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<HotelDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var hotels = await _hotelService.GetAllHotelsAsync();
            return Success(hotels);
        }

        /// <summary>Lấy chi tiết khách sạn theo ID</summary>
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<HotelDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(long id)
        {
            var hotel = await _hotelService.GetHotelByIdAsync(id);
            return Success(hotel);
        }

        /// <summary>Tạo khách sạn mới — Admin/Manager only</summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<HotelDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Create([FromBody] CreateHotelDto dto)
        {
            var hotel = await _hotelService.CreateHotelAsync(dto);
            return Created(nameof(GetById), hotel);
        }

        /// <summary>Cập nhật khách sạn — Admin/Manager only</summary>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<HotelDto>), 200)]
        [ProducesResponseType(404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateHotelDto dto)
        {
            var hotel = await _hotelService.UpdateHotelAsync(id, dto);
            return Success(hotel);
        }

        /// <summary>Xoá khách sạn (soft delete) — Admin only</summary>
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Delete(long id)
        {
            await _hotelService.DeleteHotelAsync(id);
            return Success(new { message = "Khách sạn đã bị xoá." });
        }
    }
}

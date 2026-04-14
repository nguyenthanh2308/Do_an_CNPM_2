using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HotelManagement.DTOs.RoomType;
using HotelManagement.Services.Interfaces;

namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/room-types")]
    [Authorize]
    public class RoomTypesController : BaseController
    {
        private readonly IRoomTypeService _roomTypeService;

        public RoomTypesController(IRoomTypeService roomTypeService)
        {
            _roomTypeService = roomTypeService;
        }

        /// <summary>
        /// Danh sách loại phòng (có phân trang)
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPaged([FromQuery] int pageIndex = 0, [FromQuery] int pageSize = 10)
        {
            var (data, total) = await _roomTypeService.GetPagedRoomTypesAsync(pageIndex, pageSize);
            return Ok(new
            {
                data,
                pageIndex,
                pageSize,
                total
            });
        }

        /// <summary>
        /// Tất cả loại phòng (không phân trang)
        /// </summary>
        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            var data = await _roomTypeService.GetAllRoomTypesAsync();
            return Ok(new { data });
        }

        /// <summary>
        /// Chi tiết loại phòng
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(long id)
        {
            var roomType = await _roomTypeService.GetRoomTypeByIdAsync(id);
            if (roomType == null)
                return Fail("Loại phòng không tồn tại.", 404);
            return Success(roomType);
        }

        /// <summary>
        /// Danh sách loại phòng theo khách sạn
        /// </summary>
        [HttpGet("hotel/{hotelId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByHotel(long hotelId)
        {
            var data = await _roomTypeService.GetRoomTypesByHotelAsync(hotelId);
            return Ok(new { data });
        }

        /// <summary>
        /// Tạo loại phòng mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreateRoomTypeDto dto)
        {
            if (!ModelState.IsValid)
                return Fail(ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList(), 422);

            try
            {
                var roomType = await _roomTypeService.CreateRoomTypeAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = roomType.RoomTypeId }, roomType);
            }
            catch (InvalidOperationException ex)
            {
                return Fail(ex.Message);
            }
        }

        /// <summary>
        /// Cập nhật loại phòng
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateRoomTypeDto dto)
        {
            try
            {
                var roomType = await _roomTypeService.UpdateRoomTypeAsync(id, dto);
                if (roomType == null)
                    return Fail("Loại phòng không tồn tại.", 404);
                return Success(roomType);
            }
            catch (InvalidOperationException ex)
            {
                return Fail(ex.Message);
            }
        }

        /// <summary>
        /// Vô hiệu hóa loại phòng (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _roomTypeService.DeleteRoomTypeAsync(id);
            if (!success)
                return Fail("Loại phòng không tồn tại.", 404);
            return Ok(new { message = "Loại phòng đã được vô hiệu hóa." });
        }
    }
}

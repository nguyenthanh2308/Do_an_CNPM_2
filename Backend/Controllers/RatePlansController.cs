using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.RatePlan;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// RatePlans Controller — Quản lý gói giá phòng (Bao gồm giá mỗi đêm, chính sách ăn uống, hoàn hủy...)
    /// API Prefix: /api/RatePlans
    /// </summary>
    [Authorize]
    public class RatePlansController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public RatePlansController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // ════════════════════════════════════════════════════════════════════
        // GET ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Lấy danh sách tất cả các gói giá (Rate plans)
        /// Lễ tân, Quản lý, và Khách viếng thăm(Website) có thể tra cứu
        /// </summary>
        /// <param name="roomTypeId">Tìm gói giá theo Loại phòng</param>
        /// <param name="activeOnly">Chỉ lấy các gói giá đang hoạt động (mặc định: true)</param>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RatePlanDto>>), 200)]
        public async Task<IActionResult> GetAll(
            [FromQuery] long? roomTypeId,
            [FromQuery] bool activeOnly = true)
        {
            var query = _context.RatePlans
                .Include(rp => rp.RoomType)
                .AsQueryable();

            if (roomTypeId.HasValue)
                query = query.Where(rp => rp.RoomTypeId == roomTypeId.Value);

            if (activeOnly)
                query = query.Where(rp => rp.IsActive);

            var ratePlans = await query
                .OrderBy(rp => rp.RoomType.Name)
                .ThenBy(rp => rp.PricePerNight)
                .ToListAsync();

            return Success(_mapper.Map<IEnumerable<RatePlanDto>>(ratePlans));
        }

        /// <summary>
        /// Lấy chi tiết gói giá theo ID
        /// </summary>
        [HttpGet("{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<RatePlanDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(long id)
        {
            var ratePlan = await _context.RatePlans
                .Include(rp => rp.RoomType)
                .FirstOrDefaultAsync(rp => rp.RatePlanId == id)
                ?? throw AppException.NotFound($"RatePlan #{id}");

            return Success(_mapper.Map<RatePlanDto>(ratePlan));
        }

        // ════════════════════════════════════════════════════════════════════
        // POST ENDPOINTS (TẠO MỚI)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Tạo gói giá mới 
        /// Role yêu cầu: Admin, Manager
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RatePlanDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateRatePlanDto dto)
        {
            // Kiểm tra xem RoomType có tồn tại và đang hoạt động không?
            var roomType = await _context.RoomTypes.FindAsync(dto.RoomTypeId)
                ?? throw AppException.NotFound($"RoomType #{dto.RoomTypeId}");

            if (!roomType.IsActive)
                throw new AppException("Không thể thêm gói giá cho loại phòng đang bị vô hiệu hóa.");

            var ratePlan = new RatePlan
            {
                RoomTypeId = dto.RoomTypeId,
                Name = dto.Name,
                Description = dto.Description,
                PricePerNight = dto.PricePerNight,
                MealPlan = Enum.TryParse<Enums.MealPlan>(dto.MealPlan ?? "RoomOnly", out var mealPlanCreate)
                    ? mealPlanCreate
                    : Enums.MealPlan.RoomOnly,
                IsRefundable = dto.IsRefundable,
                CancellationPolicy = dto.CancellationPolicy,
                MinStayNights = dto.MinStayNights > 0 ? dto.MinStayNights : 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.RatePlans.AddAsync(ratePlan);
            await _context.SaveChangesAsync();

            // Lấy lại entity đầy đủ bao gồm RoomType Name
            var createdEntity = await _context.RatePlans
                .Include(rp => rp.RoomType)
                .FirstAsync(rp => rp.RatePlanId == ratePlan.RatePlanId);

            return Created(_mapper.Map<RatePlanDto>(createdEntity), $"Gói giá '{ratePlan.Name}' vừa được tạo thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PUT ENDPOINTS (CẬP NHẬT)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Cập nhật thông tin gói giá 
        /// Role yêu cầu: Admin, Manager
        /// </summary>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<RatePlanDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateRatePlanDto dto)
        {
            var ratePlan = await _context.RatePlans
                .Include(rp => rp.RoomType)
                .FirstOrDefaultAsync(rp => rp.RatePlanId == id)
                ?? throw AppException.NotFound($"RatePlan #{id}");

            // Cập nhật các trường phi null
            if (dto.Name != null) ratePlan.Name = dto.Name;
            if (dto.Description != null) ratePlan.Description = dto.Description;
            if (dto.PricePerNight.HasValue) ratePlan.PricePerNight = dto.PricePerNight.Value;
            if (dto.MealPlan != null && Enum.TryParse<Enums.MealPlan>(dto.MealPlan, out var mealPlanUpdate))
                ratePlan.MealPlan = mealPlanUpdate;
            if (dto.IsRefundable.HasValue) ratePlan.IsRefundable = dto.IsRefundable.Value;
            if (dto.CancellationPolicy != null) ratePlan.CancellationPolicy = dto.CancellationPolicy;
            if (dto.MinStayNights.HasValue && dto.MinStayNights.Value > 0) ratePlan.MinStayNights = dto.MinStayNights.Value;
            if (dto.IsActive.HasValue) ratePlan.IsActive = dto.IsActive.Value;

            ratePlan.UpdatedAt = DateTime.UtcNow;

            _context.RatePlans.Update(ratePlan);
            await _context.SaveChangesAsync();

            return Success(_mapper.Map<RatePlanDto>(ratePlan), $"Cập nhật gói giá '{ratePlan.Name}' thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // DELETE ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Xóa gói giá (Xóa mềm - Soft Delete bằng cách set IsActive = false)
        /// Role yêu cầu: Admin, Manager
        /// </summary>
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Delete(long id)
        {
            var ratePlan = await _context.RatePlans.FindAsync(id)
                ?? throw AppException.NotFound($"RatePlan #{id}");

            // Thay vì xóa cứng, ta set IsActive = false (soft delete)
            if (!ratePlan.IsActive)
                throw new AppException("Gói giá này đã bị vô hiệu hóa.");

            // Kiểm tra xem gói giá này có đang chứa trong những booking chưa hoàn thành không?
            var activeBookings = await _context.Bookings
                .Where(b => b.RatePlanId == id && 
                           (b.Status == Enums.BookingStatus.Pending || 
                            b.Status == Enums.BookingStatus.Confirmed || 
                            b.Status == Enums.BookingStatus.CheckedIn))
                .CountAsync();

            if (activeBookings > 0)
                throw new AppException($"Không thể vô hiệu hóa gói giá này do đang có {activeBookings} đặt phòng chưa hoàn tất sử dụng.");

            ratePlan.IsActive = false;
            ratePlan.UpdatedAt = DateTime.UtcNow;

            _context.RatePlans.Update(ratePlan);
            await _context.SaveChangesAsync();

            return Success((object)null!, $"Gói giá '{ratePlan.Name}' đã được vô hiệu hóa an toàn.");
        }
    }
}

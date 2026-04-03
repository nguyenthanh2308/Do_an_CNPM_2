using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Promotion;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Promotions Controller — Quản lý mã giảm giá, khuyến mãi (Vouchers/Promotions)
    /// API Prefix: /api/Promotions
    /// </summary>
    [Authorize(Roles = "Admin,Manager")]
    public class PromotionsController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public PromotionsController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // ════════════════════════════════════════════════════════════════════
        // GET ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Lấy danh sách các mã giảm giá (Có hỗ trợ phân trang và tìm kiếm theo mã code)
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PromotionDto>>), 200)]
        public async Task<IActionResult> GetPaged(
            [FromQuery] string? searchCode,
            [FromQuery] bool? isActiveOnly,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Promotions.AsQueryable();

            if (!string.IsNullOrWhiteSpace(searchCode))
            {
                var lowerSearch = searchCode.ToLower().Trim();
                query = query.Where(p => p.Code.ToLower().Contains(lowerSearch));
            }

            if (isActiveOnly.HasValue && isActiveOnly.Value)
            {
                query = query.Where(p => p.IsActive && p.EndDate >= DateTime.UtcNow);
            }

            var totalCount = await query.CountAsync();

            var promotions = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Success(new PagedResult<PromotionDto>
            {
                Data = _mapper.Map<List<PromotionDto>>(promotions),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        /// <summary>
        /// Xem chi tiết thông số của một mã giảm giá
        /// </summary>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<PromotionDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(long id)
        {
            var promotion = await _context.Promotions.FindAsync(id)
                ?? throw AppException.NotFound($"Promotion #{id}");

            return Success(_mapper.Map<PromotionDto>(promotion));
        }

        /// <summary>
        /// Tra cứu chi tiết một mã giảm giá qua mã Code (Để dùng cho giao diện tìm Vouchers hợp lệ)
        /// Khách hàng (AllowAnonymous) hoặc Lễ tân có thể tra cứu
        /// </summary>
        [HttpGet("code/{code}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<PromotionDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetByCode(string code)
        {
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code.ToLower() == code.ToLower().Trim())
                ?? throw AppException.NotFound($"Promotion Code '{code}'");

            return Success(_mapper.Map<PromotionDto>(promotion));
        }

        // ════════════════════════════════════════════════════════════════════
        // POST ENDPOINTS (TẠO MỚI)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Phát hành mã giảm giá mới
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<PromotionDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        public async Task<IActionResult> Create([FromBody] CreatePromotionDto dto)
        {
            // Kiểm tra mã Code có trùng lặp không (phải Unique)
            var normalizedCode = dto.Code.Trim().ToUpper();
            if (await _context.Promotions.AnyAsync(p => p.Code.ToUpper() == normalizedCode))
            {
                throw AppException.Conflict($"Mã giảm giá '{normalizedCode}' đã tồn tại trong hệ thống.");
            }

            if (dto.StartDate >= dto.EndDate)
            {
                throw new AppException("Ngày bắt đầu chiến dịch phải nằm trước Ngày kết thúc.");
            }

            var promotion = _mapper.Map<Promotion>(dto);
            promotion.Code = normalizedCode;
            promotion.IsActive = true;
            promotion.CreatedAt = DateTime.UtcNow;

            await _context.Promotions.AddAsync(promotion);
            await _context.SaveChangesAsync();

            return Created(_mapper.Map<PromotionDto>(promotion), $"Mã giảm giá '{promotion.Code}' đã được khởi tạo.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PUT ENDPOINTS (CẬP NHẬT)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Cập nhật chiến dịch giảm giá
        /// </summary>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<PromotionDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdatePromotionDto dto)
        {
            var promotion = await _context.Promotions.FindAsync(id)
                ?? throw AppException.NotFound($"Promotion #{id}");

            // Validate logic: StartDate phai < EndDate nếu được đổi
            DateTime newStartDate = dto.StartDate ?? promotion.StartDate;
            DateTime newEndDate = dto.EndDate ?? promotion.EndDate;
            if (newStartDate >= newEndDate)
            {
                throw new AppException("Ngày bắt đầu không thể vượt qua hoặc bằng Ngày kết thúc.");
            }

            _mapper.Map(dto, promotion);

            // Xử lý Start/EndDate thủ công nếu map bỏ sót
            if (dto.StartDate.HasValue) promotion.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue) promotion.EndDate = dto.EndDate.Value;
            if (dto.IsActive.HasValue) promotion.IsActive = dto.IsActive.Value;

            promotion.UpdatedAt = DateTime.UtcNow;

            _context.Promotions.Update(promotion);
            await _context.SaveChangesAsync();

            return Success(_mapper.Map<PromotionDto>(promotion), $"Cập nhật campaign mã '{promotion.Code}' thành công.");
        }

        // ════════════════════════════════════════════════════════════════════
        // DELETE ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Xóa/Hủy bỏ mã giảm giá (Chỉ thực hiện xóa mềm để bảo toàn lịch sử hóa đơn)
        /// </summary>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Delete(long id)
        {
            var promotion = await _context.Promotions.FindAsync(id)
                ?? throw AppException.NotFound($"Promotion #{id}");

            // Vô hiệu hóa (xóa mềm)
            if (!promotion.IsActive)
                throw new AppException("Mã giảm giá này đã ngừng phát hành từ trước.");

            promotion.IsActive = false;
            promotion.UpdatedAt = DateTime.UtcNow;

            _context.Promotions.Update(promotion);
            await _context.SaveChangesAsync();

            return Success((object)null!, $"Đã kích hoạt thu hồi/ngưng sử dụng mã '{promotion.Code}'.");
        }
    }
}

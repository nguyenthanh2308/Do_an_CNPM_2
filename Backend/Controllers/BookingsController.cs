using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Promotion;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Booking Controller — quản lý đặt phòng, check-in/out, tìm phòng và voucher
    /// </summary>
    [Authorize]
    public class BookingsController : BaseController
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // ── GET ENDPOINTS ──────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Lấy danh sách booking có phân trang và filter
        /// </summary>
        /// <remarks>
        /// Roles: Admin, Manager, Receptionist
        /// Query params: guestName, status, checkInFrom, checkInTo, page, pageSize
        /// </remarks>
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<BookingSummaryDto>>), 200)]
        public async Task<IActionResult> GetAll([FromQuery] BookingFilterDto filter)
        {
            _logger.LogInformation("GET /api/bookings — Page: {Page}, Filter: {@Filter}", filter.Page, filter);
            var result = await _bookingService.GetPagedAsync(filter);
            return Success(result);
        }

        /// <summary>
        /// Lấy chi tiết booking theo ID
        /// </summary>
        /// <param name="id">Booking ID</param>
        [HttpGet("{id:long}")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<BookingDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(long id)
        {
            _logger.LogInformation("GET /api/bookings/{Id}", id);
            var booking = await _bookingService.GetByIdAsync(id);
            return Success(booking);
        }

        /// <summary>
        /// Lấy danh sách booking của một khách hàng
        /// </summary>
        /// <param name="guestId">Guest ID</param>
        [HttpGet("guest/{guestId:long}")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BookingSummaryDto>>), 200)]
        public async Task<IActionResult> GetByGuest(long guestId)
        {
            _logger.LogInformation("GET /api/bookings/guest/{GuestId}", guestId);
            var bookings = await _bookingService.GetByGuestAsync(guestId);
            return Success(bookings);
        }

        /// <summary>
        /// Khách hàng xem booking của chính mình (từ JWT)
        /// </summary>
        [HttpGet("my-bookings")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BookingSummaryDto>>), 200)]
        public async Task<IActionResult> GetMyBookings()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Fail("Không xác định được người dùng.", 401);

            // GuestId và UserId liên kết — tìm GuestId từ UserId trong Service
            // Tạm thời dùng userId như guestId nếu Guest.UserId = UserId
            _logger.LogInformation("GET /api/bookings/my-bookings — UserId: {UserId}", userId);
            var bookings = await _bookingService.GetByGuestAsync(userId.Value);
            return Success(bookings);
        }

        // ════════════════════════════════════════════════════════════════════
        // ── TÌM PHÒNG TRỐNG ────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Tìm phòng trống theo ngày check-in/out và số khách
        /// </summary>
        /// <remarks>
        /// Query: checkin (required), checkout (required), guests, roomTypeId, maxPrice
        /// Không cần đăng nhập — public endpoint
        /// </remarks>
        [HttpGet("available-rooms")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoomAvailabilityDto>>), 200)]
        public async Task<IActionResult> GetAvailableRooms([FromQuery] SearchAvailableRoomsDto filter)
        {
            _logger.LogInformation(
                "GET /api/bookings/available-rooms — CheckIn: {CheckIn}, CheckOut: {CheckOut}",
                filter.CheckIn, filter.CheckOut);

            var rooms = await _bookingService.GetAvailableRoomsAsync(filter);
            return Success(rooms);
        }

        // ════════════════════════════════════════════════════════════════════
        // ── VOUCHER ────────────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Kiểm tra và tính toán giá trị mã giảm giá
        /// </summary>
        [HttpPost("validate-voucher")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<ValidateVoucherResponseDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> ValidateVoucher([FromBody] ValidateVoucherRequestDto dto)
        {
            _logger.LogInformation("POST /api/bookings/validate-voucher — Code: {Code}", dto.Code);
            var result = await _bookingService.ValidateVoucherAsync(dto);
            return Success(result);
        }

        // ════════════════════════════════════════════════════════════════════
        // ── POST ENDPOINTS ─────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Tạo đặt phòng mới
        /// </summary>
        /// <remarks>
        /// Roles: Admin, Manager, Receptionist (đặt hộ), hoặc Guest tự đặt (Anonymous)
        /// 
        /// Luồng tự động:
        /// - Kiểm tra phòng trống
        /// - Kiểm tra xung đột lịch
        /// - Tính tổng tiền + áp dụng voucher
        /// - Tạo Booking + BookingRooms
        /// </remarks>
        [HttpPost]
        [AllowAnonymous]   // Guest tự đặt online không cần tài khoản
        [ProducesResponseType(typeof(ApiResponse<BookingDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 409)]
        [ProducesResponseType(typeof(ApiResponse<object>), 422)]
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            try
            {
                _logger.LogInformation(
                    "POST /api/bookings — Guest: {GuestId}, RatePlan: {RatePlanId}, Rooms: {@RoomIds}",
                    dto.GuestId, dto.RatePlanId, dto.RoomIds);

                if (dto.RoomIds == null || !dto.RoomIds.Any())
                    throw new HotelManagement.Exceptions.AppException("Phải chọn ít nhất một phòng.");

                var createdByUserId = GetCurrentUserId();
                var booking = await _bookingService.CreateBookingAsync(dto, createdByUserId);

                _logger.LogInformation("Booking #{BookingId} created successfully.", booking.BookingId);
                return Created(booking, $"Đặt phòng #{booking.BookingId} thành công.");
            }
            catch (HotelManagement.Exceptions.AppException)
            {
                throw; // Re-throw AppException so middleware can handle it properly
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating booking: {Message}", ex.Message);
                throw new HotelManagement.Exceptions.AppException(
                    $"Lỗi tạo booking: {ex.GetType().Name} - {ex.Message}", 500);
            }
        }

        // ════════════════════════════════════════════════════════════════════
        // ── PUT ENDPOINTS ──────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Cập nhật thông tin booking (chỉ khi Pending/Confirmed)
        /// </summary>
        /// <param name="id">Booking ID</param>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<BookingDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateBookingDto dto)
        {
            _logger.LogInformation("PUT /api/bookings/{Id}", id);
            var booking = await _bookingService.UpdateBookingAsync(id, dto);
            return Success(booking, "Cập nhật booking thành công.");
        }

        /// <summary>
        /// Thực hiện Check-in — chuyển Booking sang CheckedIn, Room sang Occupied
        /// </summary>
        /// <remarks>Roles: Admin, Manager, Receptionist</remarks>
        [HttpPut("checkin")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<BookingDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
        {
            _logger.LogInformation("PUT /api/bookings/checkin — BookingId: {BookingId}", dto.BookingId);
            var booking = await _bookingService.CheckInAsync(dto);

            _logger.LogInformation(
                "Check-in thành công. Booking #{BookingId} — Guest: {GuestName}",
                booking.BookingId, booking.GuestName);
            return Success(booking, $"Check-in thành công cho booking #{booking.BookingId}.");
        }

        /// <summary>
        /// Thực hiện Check-out — chuyển Booking sang Completed, Room sang Dirty
        /// </summary>
        /// <remarks>
        /// Roles: Admin, Manager, Receptionist
        /// 
        /// Sau khi check-out, hệ thống tự động:
        /// - Set Room.Status = Dirty
        /// - Tạo HousekeepingTask (Cleaning) với Priority = High
        /// - SignalR sẽ notify Housekeeping dashboard
        /// </remarks>
        [HttpPut("checkout")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<BookingDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
        {
            _logger.LogInformation("PUT /api/bookings/checkout — BookingId: {BookingId}", dto.BookingId);
            var booking = await _bookingService.CheckOutAsync(dto);

            _logger.LogInformation(
                "Check-out thành công. Booking #{BookingId} — Phòng đã chuyển sang Dirty.",
                booking.BookingId);
            return Success(booking, $"Check-out thành công. Đã tạo task dọn phòng tự động.");
        }

        // ════════════════════════════════════════════════════════════════════
        // ── DELETE (CANCEL) ────────────────────────────────────────────────
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Hủy booking theo ID
        /// </summary>
        /// <param name="id">Booking ID</param>
        /// <param name="dto">Lý do hủy (không bắt buộc)</param>
        /// <remarks>
        /// Roles: Admin, Manager, Receptionist (hủy hộ)
        ///        Guest (hủy booking của chính mình — kiểm tra quyền trong Service)
        /// </remarks>
        [HttpDelete("{id:long}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Cancel(long id, [FromBody] CancelBookingDto? dto)
        {
            _logger.LogInformation("DELETE /api/bookings/{Id}", id);

            var cancelDto = dto ?? new CancelBookingDto { BookingId = id };
            cancelDto.BookingId = id; // đảm bảo ID từ route

            await _bookingService.CancelBookingAsync(cancelDto);
            _logger.LogInformation("Booking #{Id} đã bị hủy.", id);

            return Success<object>(null!, $"Booking #{id} đã được hủy thành công.");
        }
    }
}

using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Promotion;

namespace HotelManagement.Services.Interfaces
{
    /// <summary>
    /// IBookingService — định nghĩa toàn bộ nghiệp vụ Booking
    /// </summary>
    public interface IBookingService
    {
        // ── CRUD ─────────────────────────────────────────────────────────────
        Task<BookingDto> GetByIdAsync(long bookingId);
        Task<PagedResult<BookingSummaryDto>> GetPagedAsync(BookingFilterDto filter);
        Task<IEnumerable<BookingSummaryDto>> GetByGuestAsync(long guestId);

        // ── Tạo booking ──────────────────────────────────────────────────────
        Task<BookingDto> CreateBookingAsync(CreateBookingDto dto, long? createdByUserId = null);
        Task<BookingDto> UpdateBookingAsync(long bookingId, UpdateBookingDto dto);
        Task CancelBookingAsync(CancelBookingDto dto);

        // ── Check-in / Check-out ──────────────────────────────────────────────
        Task<BookingDto> CheckInAsync(CheckInDto dto);
        Task<BookingDto> CheckOutAsync(CheckOutDto dto);

        // ── Tìm phòng trống ───────────────────────────────────────────────────
        Task<IEnumerable<RoomAvailabilityDto>> GetAvailableRoomsAsync(SearchAvailableRoomsDto filter);

        // ── Voucher ───────────────────────────────────────────────────────────
        Task<ValidateVoucherResponseDto> ValidateVoucherAsync(ValidateVoucherRequestDto dto);
    }

    // ── Response DTO cho tìm phòng trống (dùng nội bộ trong Service) ─────────
    public class RoomAvailabilityDto
    {
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public long RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public string? ThumbnailUrl { get; set; }
        public int MaxOccupancy { get; set; }
        public float? AreaSqm { get; set; }
        public decimal PricePerNight { get; set; }
    }
}

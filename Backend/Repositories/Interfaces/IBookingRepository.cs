using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Common;
using HotelManagement.Models;

namespace HotelManagement.Repositories.Interfaces
{
    /// <summary>
    /// Booking Repository Interface — các query nghiệp vụ đặc thù
    /// </summary>
    public interface IBookingRepository : IRepository<Booking>
    {
        /// <summary>Lấy booking đầy đủ include (Guest, RatePlan, Rooms, Promotion)</summary>
        Task<Booking?> GetBookingDetailAsync(long bookingId);

        /// <summary>Danh sách booking có phân trang + filter</summary>
        Task<(IEnumerable<Booking> Items, int TotalCount)> GetPagedAsync(BookingFilterDto filter);

        /// <summary>Kiểm tra phòng có bị trùng lịch không (trong khoảng checkIn - checkOut)</summary>
        Task<IEnumerable<long>> GetConflictingRoomIdsAsync(
            List<long> roomIds, DateTime checkIn, DateTime checkOut, long? excludeBookingId = null);

        /// <summary>Lấy tất cả booking đang CheckedIn của một phòng</summary>
        Task<Booking?> GetActiveBookingByRoomAsync(long roomId);

        /// <summary>Lấy booking theo guest</summary>
        Task<IEnumerable<Booking>> GetByGuestAsync(long guestId);

        /// <summary>Đếm số lần đã dùng của promotion</summary>
        Task<int> CountPromotionUsageAsync(long promotionId);
    }
}

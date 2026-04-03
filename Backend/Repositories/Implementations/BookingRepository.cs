using HotelManagement.Data;
using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Common;
using HotelManagement.Enums;
using HotelManagement.Models;
using HotelManagement.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Repositories.Implementations
{
    public class BookingRepository : Repository<Booking>, IBookingRepository
    {
        public BookingRepository(HotelDbContext context) : base(context) { }

        /// <summary>
        /// Lấy booking đầy đủ thông tin: Guest, RatePlan → RoomType, Rooms, Promotion, CreatedByUser
        /// </summary>
        public async Task<Booking?> GetBookingDetailAsync(long bookingId)
        {
            return await _context.Bookings
                .Include(b => b.Guest)
                .Include(b => b.RatePlan)
                    .ThenInclude(rp => rp.RoomType)
                .Include(b => b.Promotion)
                .Include(b => b.CreatedByUser)
                .Include(b => b.BookingRooms)
                    .ThenInclude(br => br.Room)
                        .ThenInclude(r => r.RoomType)
                .Include(b => b.Invoices)
                    .ThenInclude(i => i.Payments)
                .FirstOrDefaultAsync(b => b.BookingId == bookingId);
        }

        /// <summary>
        /// Phân trang + filter theo: GuestName, Status, CheckInFrom/To
        /// </summary>
        public async Task<(IEnumerable<Booking> Items, int TotalCount)> GetPagedAsync(BookingFilterDto filter)
        {
            var query = _context.Bookings
                .Include(b => b.Guest)
                .Include(b => b.RatePlan)
                    .ThenInclude(rp => rp.RoomType)
                .Include(b => b.BookingRooms)
                    .ThenInclude(br => br.Room)
                .AsQueryable();

            // ── Filter ────────────────────────────────────────────────────────
            if (!string.IsNullOrWhiteSpace(filter.GuestName))
                query = query.Where(b => b.Guest.FullName.Contains(filter.GuestName));

            if (!string.IsNullOrWhiteSpace(filter.Status)
                && Enum.TryParse<BookingStatus>(filter.Status, true, out var status))
                query = query.Where(b => b.Status == status);

            if (filter.CheckInFrom.HasValue)
                query = query.Where(b => b.CheckInDate >= filter.CheckInFrom.Value);

            if (filter.CheckInTo.HasValue)
                query = query.Where(b => b.CheckInDate <= filter.CheckInTo.Value);

            // ── Count & Paginate ──────────────────────────────────────────────
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(b => b.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        /// <summary>
        /// Tìm các phòng bị trùng lịch với danh sách roomIds trong khoảng [checkIn, checkOut)
        /// Trả về danh sách roomId bị conflict
        /// </summary>
        public async Task<IEnumerable<long>> GetConflictingRoomIdsAsync(
            List<long> roomIds, DateTime checkIn, DateTime checkOut, long? excludeBookingId = null)
        {
            var validStatuses = new[] { BookingStatus.Pending, BookingStatus.Confirmed, BookingStatus.CheckedIn };

            var query = _context.BookingRooms
                .Where(br =>
                    roomIds.Contains(br.RoomId) &&
                    validStatuses.Contains(br.Booking.Status) &&
                    br.CheckInDate < checkOut &&
                    br.CheckOutDate > checkIn);

            if (excludeBookingId.HasValue)
                query = query.Where(br => br.BookingId != excludeBookingId.Value);

            return await query.Select(br => br.RoomId).Distinct().ToListAsync();
        }

        /// <summary>
        /// Lấy booking đang CheckedIn của một phòng (nếu có)
        /// </summary>
        public async Task<Booking?> GetActiveBookingByRoomAsync(long roomId)
        {
            return await _context.Bookings
                .Include(b => b.Guest)
                .Include(b => b.BookingRooms)
                .Where(b => b.Status == BookingStatus.CheckedIn &&
                            b.BookingRooms.Any(br => br.RoomId == roomId))
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Lấy danh sách booking theo guest
        /// </summary>
        public async Task<IEnumerable<Booking>> GetByGuestAsync(long guestId)
        {
            return await _context.Bookings
                .Include(b => b.RatePlan)
                    .ThenInclude(rp => rp.RoomType)
                .Include(b => b.BookingRooms)
                    .ThenInclude(br => br.Room)
                .Where(b => b.GuestId == guestId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Đếm số lần promotion đã được sử dụng (status không phải Cancelled)
        /// </summary>
        public async Task<int> CountPromotionUsageAsync(long promotionId)
        {
            return await _context.Bookings
                .CountAsync(b => b.PromotionId == promotionId
                              && b.Status != BookingStatus.Cancelled);
        }
    }
}

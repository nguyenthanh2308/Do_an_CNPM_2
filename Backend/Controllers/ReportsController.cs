using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Reports Controller — báo cáo doanh thu, công suất phòng, top phòng
    /// </summary>
    [Authorize(Roles = "Admin,Manager")]
    public class ReportsController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(HotelDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // BÁO CÁO DOANH THU
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Báo cáo doanh thu theo khoảng thời gian
        /// </summary>
        /// <param name="from">Từ ngày (ISO 8601)</param>
        /// <param name="to">Đến ngày (ISO 8601)</param>
        [HttpGet("revenue")]
        [ProducesResponseType(typeof(ApiResponse<RevenueReportDto>), 200)]
        public async Task<IActionResult> GetRevenue(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            if (from > to)
                return Fail("Ngày bắt đầu phải nhỏ hơn ngày kết thúc.");

            _logger.LogInformation("GET /api/reports/revenue — From: {From}, To: {To}", from, to);

            // Lấy invoices đã thanh toán trong khoảng thời gian
            var invoices = await _context.Invoices
                .Include(i => i.Booking)
                .Where(i => i.Status == InvoiceStatus.Paid
                         && i.IssuedAt >= from
                         && i.IssuedAt <= to)
                .ToListAsync();

            var bookings = await _context.Bookings
                .Where(b => b.CheckInDate >= from && b.CheckInDate <= to)
                .ToListAsync();

            // Doanh thu theo ngày
            var dailyBreakdown = invoices
                .GroupBy(i => i.IssuedAt.Date)
                .Select(g => new DailyRevenueDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(i => i.TotalAmount),
                    BookingCount = g.Count()
                })
                .OrderBy(d => d.Date)
                .ToList();

            var totalRevenue = invoices.Sum(i => i.TotalAmount);
            var completedBookings = bookings.Count(b => b.Status == BookingStatus.Completed);
            var cancelledBookings = bookings.Count(b => b.Status == BookingStatus.Cancelled);

            var report = new RevenueReportDto
            {
                FromDate = from,
                ToDate = to,
                TotalRevenue = totalRevenue,
                TotalBookings = bookings.Count,
                CompletedBookings = completedBookings,
                CancelledBookings = cancelledBookings,
                AverageRevenuePerBooking = completedBookings > 0
                    ? Math.Round(totalRevenue / completedBookings, 2) : 0,
                DailyBreakdown = dailyBreakdown
            };

            return Success(report);
        }

        // ════════════════════════════════════════════════════════════════════
        // BÁO CÁO CÔNG SUẤT PHÒNG
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Báo cáo công suất phòng theo loại phòng
        /// </summary>
        [HttpGet("occupancy")]
        [ProducesResponseType(typeof(ApiResponse<OccupancyReportDto>), 200)]
        public async Task<IActionResult> GetOccupancy(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] long? hotelId)
        {
            if (from > to)
                return Fail("Ngày bắt đầu phải nhỏ hơn ngày kết thúc.");

            _logger.LogInformation(
                "GET /api/reports/occupancy — From: {From}, To: {To}, Hotel: {HotelId}",
                from, to, hotelId);

            var roomsQuery = _context.Rooms
                .Include(r => r.RoomType)
                .Where(r => r.IsActive)
                .AsQueryable();

            if (hotelId.HasValue) roomsQuery = roomsQuery.Where(r => r.HotelId == hotelId.Value);
            var rooms = await roomsQuery.ToListAsync();
            var totalRooms = rooms.Count;

            // Số phòng-đêm đã sử dụng trong khoảng thời gian
            var bookingRoomsQuery = _context.BookingRooms
                .Include(br => br.Room).ThenInclude(r => r.RoomType)
                .Include(br => br.Booking)
                .Where(br =>
                    br.Booking.Status != BookingStatus.Cancelled &&
                    br.CheckInDate < to &&
                    br.CheckOutDate > from);

            if (hotelId.HasValue)
                bookingRoomsQuery = bookingRoomsQuery.Where(br => br.Room.HotelId == hotelId.Value);

            var bookingRooms = await bookingRoomsQuery.ToListAsync();

            // Nhóm theo RoomType
            var byRoomType = rooms
                .GroupBy(r => new { r.RoomTypeId, r.RoomType.Name })
                .Select(g =>
                {
                    var roomIdsInType = g.Select(r => r.RoomId).ToList();
                    var occupied = bookingRooms
                        .Where(br => roomIdsInType.Contains(br.RoomId))
                        .Select(br => br.RoomId)
                        .Distinct()
                        .Count();

                    return new RoomTypeOccupancyDto
                    {
                        RoomTypeName = g.Key.Name,
                        TotalRooms = g.Count(),
                        OccupiedRooms = occupied,
                        OccupancyRate = g.Count() > 0
                            ? Math.Round((double)occupied / g.Count() * 100, 1) : 0
                    };
                })
                .OrderByDescending(x => x.OccupancyRate)
                .ToList();

            var occupiedCount = bookingRooms.Select(br => br.RoomId).Distinct().Count();

            return Success(new OccupancyReportDto
            {
                FromDate = from,
                ToDate = to,
                TotalRooms = totalRooms,
                OccupancyRate = totalRooms > 0
                    ? Math.Round((double)occupiedCount / totalRooms * 100, 1) : 0,
                ByRoomType = byRoomType
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // TOP PHÒNG ĐƯỢC ĐẶT NHIỀU NHẤT
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Top phòng được đặt nhiều nhất trong khoảng thời gian
        /// </summary>
        /// <param name="from">Từ ngày</param>
        /// <param name="to">Đến ngày</param>
        /// <param name="top">Số lượng top (mặc định 10)</param>
        [HttpGet("top-rooms")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<TopRoomDto>>), 200)]
        public async Task<IActionResult> GetTopRooms(
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] int top = 10)
        {
            if (from > to) return Fail("Ngày bắt đầu phải nhỏ hơn ngày kết thúc.");
            if (top < 1 || top > 50) return Fail("Top phải từ 1 đến 50.");

            _logger.LogInformation("GET /api/reports/top-rooms — Top: {Top}", top);

            var topRooms = await _context.BookingRooms
                .Include(br => br.Room).ThenInclude(r => r.RoomType)
                .Include(br => br.Booking)
                .Where(br =>
                    br.Booking.Status != BookingStatus.Cancelled &&
                    br.CheckInDate >= from &&
                    br.CheckInDate <= to)
                .GroupBy(br => new
                {
                    br.RoomId,
                    br.Room.RoomNumber,
                    RoomTypeName = br.Room.RoomType.Name
                })
                .Select(g => new TopRoomDto
                {
                    RoomId = g.Key.RoomId,
                    RoomNumber = g.Key.RoomNumber,
                    RoomTypeName = g.Key.RoomTypeName,
                    BookingCount = g.Count(),
                    TotalRevenue = g.Sum(br => br.PricePerNight *
                        (br.CheckOutDate - br.CheckInDate).Days)
                })
                .OrderByDescending(r => r.BookingCount)
                .ThenByDescending(r => r.TotalRevenue)
                .Take(top)
                .ToListAsync();

            return Success(topRooms);
        }

        // ════════════════════════════════════════════════════════════════════
        // THỐNG KÊ TỔNG QUAN (Dashboard)
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Số liệu tổng quan cho Dashboard Manager — dữ liệu hôm nay
        /// </summary>
        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ApiResponse<DashboardDto>), 200)]
        public async Task<IActionResult> GetDashboard([FromQuery] long? hotelId)
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var roomsQuery = _context.Rooms.Where(r => r.IsActive);
            if (hotelId.HasValue) roomsQuery = roomsQuery.Where(r => r.HotelId == hotelId.Value);
            var rooms = await roomsQuery.ToListAsync();

            var bookingsQuery = _context.Bookings.AsQueryable();

            var dashboard = new DashboardDto
            {
                TotalRooms = rooms.Count,
                AvailableRooms = rooms.Count(r => r.Status == RoomStatus.Available),
                OccupiedRooms = rooms.Count(r => r.Status == RoomStatus.Occupied),
                DirtyRooms = rooms.Count(r => r.Status == RoomStatus.Dirty),
                MaintenanceRooms = rooms.Count(r => r.Status == RoomStatus.Maintenance),
                CheckInsToday = await bookingsQuery
                    .CountAsync(b => b.CheckInDate.Date == today && b.Status == BookingStatus.Confirmed),
                CheckOutsToday = await bookingsQuery
                    .CountAsync(b => b.CheckOutDate.Date == today && b.Status == BookingStatus.CheckedIn),
                TotalBookingsToday = await bookingsQuery
                    .CountAsync(b => b.CreatedAt.Date == today),
                PendingHousekeepingTasks = await _context.HousekeepingTasks
                    .CountAsync(ht => ht.Status == HousekeepingTaskStatus.Pending)
            };

            return Success(dashboard);
        }
    }

    // ── Dashboard DTO (chỉ dùng trong Reports) ─────────────────────────────
    public class DashboardDto
    {
        public int TotalRooms { get; set; }
        public int AvailableRooms { get; set; }
        public int OccupiedRooms { get; set; }
        public int DirtyRooms { get; set; }
        public int MaintenanceRooms { get; set; }
        public int CheckInsToday { get; set; }
        public int CheckOutsToday { get; set; }
        public int TotalBookingsToday { get; set; }
        public int PendingHousekeepingTasks { get; set; }
        public double OccupancyRate => TotalRooms > 0
            ? Math.Round((double)OccupiedRooms / TotalRooms * 100, 1) : 0;
    }
}

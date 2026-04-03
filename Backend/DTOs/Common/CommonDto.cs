namespace HotelManagement.DTOs.Common
{
    /// <summary>
    /// Generic wrapper cho các response trả về danh sách có phân trang
    /// </summary>
    public class PagedResult<T>
    {
        public List<T> Data { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }

    /// <summary>
    /// Wrapper chung cho tất cả API response
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string> Errors { get; set; } = new();

        public static ApiResponse<T> Ok(T data, string? message = null) =>
            new() { Success = true, Data = data, Message = message };

        public static ApiResponse<T> Fail(string error) =>
            new() { Success = false, Errors = new List<string> { error } };

        public static ApiResponse<T> Fail(List<string> errors) =>
            new() { Success = false, Errors = errors };
    }

    /// <summary>
    /// DTO cho báo cáo doanh thu
    /// </summary>
    public class RevenueReportDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }
        public decimal AverageRevenuePerBooking { get; set; }
        public List<DailyRevenueDto> DailyBreakdown { get; set; } = new();
    }

    public class DailyRevenueDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int BookingCount { get; set; }
    }

    /// <summary>
    /// DTO báo cáo công suất phòng
    /// </summary>
    public class OccupancyReportDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int TotalRooms { get; set; }
        public double OccupancyRate { get; set; }   // % phòng đã dùng
        public List<RoomTypeOccupancyDto> ByRoomType { get; set; } = new();
    }

    public class RoomTypeOccupancyDto
    {
        public string RoomTypeName { get; set; } = null!;
        public int TotalRooms { get; set; }
        public int OccupiedRooms { get; set; }
        public double OccupancyRate { get; set; }
    }

    /// <summary>
    /// DTO top phòng được đặt nhiều nhất
    /// </summary>
    public class TopRoomDto
    {
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public string RoomTypeName { get; set; } = null!;
        public int BookingCount { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    /// <summary>
    /// DTO tìm phòng trống
    /// </summary>
    public class SearchAvailableRoomsDto
    {
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Guests { get; set; } = 1;
        public long? RoomTypeId { get; set; }
        public decimal? MaxPrice { get; set; }
    }
}

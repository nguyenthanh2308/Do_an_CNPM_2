namespace HotelManagement.Hubs
{
    /// <summary>
    /// Tên tất cả SignalR events (tránh magic strings)
    /// </summary>
    public static class HubEvents
    {
        // Server → Client
        public const string RoomStatusChanged    = "RoomStatusChanged";
        public const string BookingStatusChanged = "BookingStatusChanged";
        public const string NewHousekeepingTask  = "NewHousekeepingTask";
        public const string TaskStatusUpdated    = "TaskStatusUpdated";
        public const string DashboardUpdated     = "DashboardUpdated";
        public const string Notification         = "Notification";
    }

    /// <summary>
    /// Payload gửi khi trạng thái phòng thay đổi
    /// </summary>
    public class RoomStatusChangedPayload
    {
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public long HotelId { get; set; }
        public string OldStatus { get; set; } = null!;
        public string NewStatus { get; set; } = null!;
        public DateTime ChangedAt { get; set; }
        public string? ChangedBy { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Payload gửi khi booking thay đổi trạng thái (check-in/out, cancel)
    /// </summary>
    public class BookingStatusChangedPayload
    {
        public long BookingId { get; set; }
        public string GuestName { get; set; } = null!;
        public string OldStatus { get; set; } = null!;
        public string NewStatus { get; set; } = null!;
        public List<string> RoomNumbers { get; set; } = new();
        public DateTime ChangedAt { get; set; }
    }

    /// <summary>
    /// Payload gửi khi tạo mới HousekeepingTask (sau checkout)
    /// </summary>
    public class NewHousekeepingTaskPayload
    {
        public long TaskId { get; set; }
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string TaskType { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Payload thông báo chung (toast notification)
    /// </summary>
    public class NotificationPayload
    {
        public string Type { get; set; } = "info";  // info | success | warning | error
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string? Link { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}

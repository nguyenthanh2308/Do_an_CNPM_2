using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.HousekeepingTask
{
    // ── Response DTO ──────────────────────────────────────────────────────────
    public class HousekeepingTaskDto
    {
        public long TaskId { get; set; }
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public string CurrentRoomStatus { get; set; } = null!;
        public long? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public long CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; } = null!;
        public string TaskType { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public string? Notes { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── Response DTO rút gọn (cho Housekeeping dashboard) ────────────────────
    public class HousekeepingTaskSummaryDto
    {
        public long TaskId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string TaskType { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string Priority { get; set; } = null!;
        public DateTime? ScheduledAt { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateHousekeepingTaskDto
    {
        [Required] public long RoomId { get; set; }
        public long? AssignedToUserId { get; set; }
        public string TaskType { get; set; } = "Cleaning";
        public string Priority { get; set; } = "Medium";
        public string? Notes { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateHousekeepingTaskDto
    {
        public long? AssignedToUserId { get; set; }
        public string? Priority { get; set; }
        public string? Notes { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    // ── Update status DTO (Housekeeping staff dùng) ──────────────────────────
    public class UpdateTaskStatusDto
    {
        [Required] public string Status { get; set; } = null!; // InProgress | Completed | Cancelled
        public string? Notes { get; set; }
    }

    // ── Report damage DTO ─────────────────────────────────────────────────────
    public class ReportMaintenanceDto
    {
        [Required] public long RoomId { get; set; }
        [Required] [MaxLength(1000)] public string Description { get; set; } = null!;
        public string Priority { get; set; } = "Medium";
    }
}

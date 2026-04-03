using HotelManagement.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HotelManagement.Models
{
    [Table("housekeeping_tasks")]
    public class HousekeepingTask
    {
        [Key]
        [Column("task_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long TaskId { get; set; }

        [Required]
        [Column("room_id")]
        public long RoomId { get; set; }

        /// <summary>
        /// Nhân viên được giao nhiệm vụ dọn phòng
        /// </summary>
        [Column("assigned_to_user_id")]
        public long? AssignedToUserId { get; set; }

        /// <summary>
        /// Người tạo task (Manager hoặc Receptionist)
        /// </summary>
        [Required]
        [Column("created_by_user_id")]
        public long CreatedByUserId { get; set; }

        [Required]
        [Column("task_type")]
        public HousekeepingTaskType TaskType { get; set; } = HousekeepingTaskType.Cleaning;

        [Required]
        [Column("status")]
        public HousekeepingTaskStatus Status { get; set; } = HousekeepingTaskStatus.Pending;

        [Column("priority")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("scheduled_at")]
        public DateTime? ScheduledAt { get; set; }

        [Column("started_at")]
        public DateTime? StartedAt { get; set; }

        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("RoomId")]
        public Room Room { get; set; } = null!;

        [ForeignKey("AssignedToUserId")]
        public User? AssignedToUser { get; set; }

        [ForeignKey("CreatedByUserId")]
        public User CreatedByUser { get; set; } = null!;
    }
}

using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.HousekeepingTask;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Housekeeping Controller — quản lý nhiệm vụ dọn phòng và bảo trì
    /// </summary>
    [Authorize]
    public class HousekeepingController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<HousekeepingController> _logger;

        public HousekeepingController(HotelDbContext context, IMapper mapper,
            ILogger<HousekeepingController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // GET ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Danh sách tất cả task (Manager xem toàn bộ, Housekeeping chỉ thấy task của mình)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<HousekeepingTaskDto>>), 200)]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? status,
            [FromQuery] string? taskType,
            [FromQuery] string? priority,
            [FromQuery] long? roomId)
        {
            var currentUserId = GetCurrentUserId();
            var currentRole = GetCurrentUserRole();

            var query = _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.AssignedToUser)
                .Include(ht => ht.CreatedByUser)
                .AsQueryable();

            // Housekeeping chỉ thấy task được giao cho mình
            if (currentRole == "Housekeeping" && currentUserId.HasValue)
                query = query.Where(ht => ht.AssignedToUserId == currentUserId.Value);

            // Filters
            if (!string.IsNullOrEmpty(status)
                && Enum.TryParse<HousekeepingTaskStatus>(status, true, out var taskStatus))
                query = query.Where(ht => ht.Status == taskStatus);

            if (!string.IsNullOrEmpty(taskType)
                && Enum.TryParse<HousekeepingTaskType>(taskType, true, out var type))
                query = query.Where(ht => ht.TaskType == type);

            if (!string.IsNullOrEmpty(priority)
                && Enum.TryParse<TaskPriority>(priority, true, out var pri))
                query = query.Where(ht => ht.Priority == pri);

            if (roomId.HasValue)
                query = query.Where(ht => ht.RoomId == roomId.Value);

            var tasks = await query
                .OrderByDescending(ht => ht.Priority)
                .ThenBy(ht => ht.CreatedAt)
                .ToListAsync();

            return Success(_mapper.Map<IEnumerable<HousekeepingTaskDto>>(tasks));
        }

        /// <summary>
        /// Danh sách phòng đang ở trạng thái Dirty — cần dọn ngay
        /// </summary>
        [HttpGet("dirty-rooms")]
        [Authorize(Roles = "Admin,Manager,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DTOs.Room.RoomSummaryDto>>), 200)]
        public async Task<IActionResult> GetDirtyRooms()
        {
            var dirtyRooms = await _context.Rooms
                .Include(r => r.RoomType)
                .Where(r => r.Status == RoomStatus.Dirty && r.IsActive)
                .OrderBy(r => r.Floor)
                .ToListAsync();

            return Success(_mapper.Map<IEnumerable<DTOs.Room.RoomSummaryDto>>(dirtyRooms));
        }

        /// <summary>
        /// Lấy chi tiết task theo ID
        /// </summary>
        [HttpGet("{id:long}")]
        [Authorize(Roles = "Admin,Manager,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<HousekeepingTaskDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> GetById(long id)
        {
            var task = await _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.AssignedToUser)
                .Include(ht => ht.CreatedByUser)
                .FirstOrDefaultAsync(ht => ht.TaskId == id)
                ?? throw AppException.NotFound($"HousekeepingTask #{id}");

            return Success(_mapper.Map<HousekeepingTaskDto>(task));
        }

        // ════════════════════════════════════════════════════════════════════
        // POST ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Tạo task dọn phòng / bảo trì mới — Manager/Receptionist
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<HousekeepingTaskDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateHousekeepingTaskDto dto)
        {
            var createdByUserId = GetCurrentUserId()
                ?? throw new AppException("Không xác định được người dùng.", 401);

            // Kiểm tra Room tồn tại
            var room = await _context.Rooms.FindAsync(dto.RoomId)
                       ?? throw AppException.NotFound($"Room #{dto.RoomId}");

            // Kiểm tra AssignedUser (nếu có) must be Housekeeping role
            if (dto.AssignedToUserId.HasValue)
            {
                var assignee = await _context.Users.FindAsync(dto.AssignedToUserId.Value)
                    ?? throw AppException.NotFound($"User #{dto.AssignedToUserId.Value}");

                if (assignee.Role != UserRole.Housekeeping && assignee.Role != UserRole.Manager)
                    throw new AppException("Chỉ có thể giao task cho nhân viên Housekeeping hoặc Manager.");
            }

            if (!Enum.TryParse<HousekeepingTaskType>(dto.TaskType, true, out var taskType))
                return Fail($"TaskType '{dto.TaskType}' không hợp lệ.");

            if (!Enum.TryParse<TaskPriority>(dto.Priority, true, out var priority))
                return Fail($"Priority '{dto.Priority}' không hợp lệ.");

            var task = new HousekeepingTask
            {
                RoomId = dto.RoomId,
                AssignedToUserId = dto.AssignedToUserId,
                CreatedByUserId = createdByUserId,
                TaskType = taskType,
                Priority = priority,
                Status = HousekeepingTaskStatus.Pending,
                Notes = dto.Notes,
                ScheduledAt = dto.ScheduledAt,
                CreatedAt = DateTime.UtcNow
            };

            await _context.HousekeepingTasks.AddAsync(task);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "HousekeepingTask #{TaskId} created for Room #{RoomId} by User #{CreatedBy}.",
                task.TaskId, dto.RoomId, createdByUserId);

            var created = await _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.AssignedToUser)
                .Include(ht => ht.CreatedByUser)
                .FirstAsync(ht => ht.TaskId == task.TaskId);

            return Created(_mapper.Map<HousekeepingTaskDto>(created));
        }

        /// <summary>
        /// Báo cáo hư hỏng — tạo task Maintenance
        /// </summary>
        [HttpPost("maintenance-report")]
        [Authorize(Roles = "Admin,Manager,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<HousekeepingTaskDto>), 201)]
        public async Task<IActionResult> ReportMaintenance([FromBody] ReportMaintenanceDto dto)
        {
            var createdByUserId = GetCurrentUserId()
                ?? throw new AppException("Không xác định được người dùng.", 401);

            var room = await _context.Rooms.FindAsync(dto.RoomId)
                       ?? throw AppException.NotFound($"Room #{dto.RoomId}");

            if (!Enum.TryParse<TaskPriority>(dto.Priority, true, out var priority))
                priority = TaskPriority.Medium;

            // Đổi trạng thái phòng sang Maintenance
            room.Status = RoomStatus.Maintenance;
            room.UpdatedAt = DateTime.UtcNow;
            _context.Rooms.Update(room);

            var task = new HousekeepingTask
            {
                RoomId = dto.RoomId,
                CreatedByUserId = createdByUserId,
                TaskType = HousekeepingTaskType.Maintenance,
                Priority = priority,
                Status = HousekeepingTaskStatus.Pending,
                Notes = dto.Description,
                CreatedAt = DateTime.UtcNow
            };

            await _context.HousekeepingTasks.AddAsync(task);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Maintenance reported for Room #{RoomId}. Task #{TaskId} created.",
                dto.RoomId, task.TaskId);

            var created = await _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.CreatedByUser)
                .FirstAsync(ht => ht.TaskId == task.TaskId);

            return Created(_mapper.Map<HousekeepingTaskDto>(created),
                $"Đã báo cáo hư hỏng và tạo task bảo trì cho phòng {room.RoomNumber}.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PUT ENDPOINTS
        // ════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Cập nhật thông tin task (giao lại nhân viên, đổi priority...)
        /// </summary>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Admin,Manager")]
        [ProducesResponseType(typeof(ApiResponse<HousekeepingTaskDto>), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateHousekeepingTaskDto dto)
        {
            var task = await _context.HousekeepingTasks.FindAsync(id)
                       ?? throw AppException.NotFound($"HousekeepingTask #{id}");

            if (task.Status == HousekeepingTaskStatus.Completed || task.Status == HousekeepingTaskStatus.Cancelled)
                throw new AppException($"Không thể cập nhật task đã ở trạng thái '{task.Status}'.");

            if (dto.AssignedToUserId.HasValue) task.AssignedToUserId = dto.AssignedToUserId;
            if (dto.Priority != null && Enum.TryParse<TaskPriority>(dto.Priority, true, out var pri))
                task.Priority = pri;
            if (dto.Notes != null) task.Notes = dto.Notes;
            if (dto.ScheduledAt.HasValue) task.ScheduledAt = dto.ScheduledAt;
            task.UpdatedAt = DateTime.UtcNow;

            _context.HousekeepingTasks.Update(task);
            await _context.SaveChangesAsync();

            var updated = await _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.AssignedToUser)
                .Include(ht => ht.CreatedByUser)
                .FirstAsync(ht => ht.TaskId == id);

            return Success(_mapper.Map<HousekeepingTaskDto>(updated), "Cập nhật task thành công.");
        }

        /// <summary>
        /// Cập nhật trạng thái task — Housekeeping tự cập nhật tiến độ
        /// </summary>
        /// <remarks>
        /// InProgress → task bắt đầu, Completed → phòng chuyển sang Available tự động
        /// </remarks>
        [HttpPut("{id:long}/status")]
        [Authorize(Roles = "Admin,Manager,Housekeeping")]
        [ProducesResponseType(typeof(ApiResponse<HousekeepingTaskDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateTaskStatusDto dto)
        {
            if (!Enum.TryParse<HousekeepingTaskStatus>(dto.Status, true, out var newStatus))
                return Fail($"Status '{dto.Status}' không hợp lệ. Chấp nhận: InProgress, Completed, Cancelled.");

            var task = await _context.HousekeepingTasks
                .Include(ht => ht.Room)
                .FirstOrDefaultAsync(ht => ht.TaskId == id)
                ?? throw AppException.NotFound($"HousekeepingTask #{id}");

            // Validate transition
            ValidateStatusTransition(task.Status, newStatus);

            // Quyền: Housekeeping chỉ được cập nhật task của mình
            var currentUserId = GetCurrentUserId();
            var currentRole = GetCurrentUserRole();
            if (currentRole == "Housekeeping" && task.AssignedToUserId != currentUserId)
                throw AppException.Forbidden("Bạn không có quyền cập nhật task này.");

            var oldStatus = task.Status;
            task.Status = newStatus;
            if (dto.Notes != null) task.Notes = dto.Notes;
            task.UpdatedAt = DateTime.UtcNow;

            // Ghi thời gian
            if (newStatus == HousekeepingTaskStatus.InProgress && !task.StartedAt.HasValue)
                task.StartedAt = DateTime.UtcNow;

            if (newStatus == HousekeepingTaskStatus.Completed)
            {
                task.CompletedAt = DateTime.UtcNow;

                // Nếu là task Cleaning → phòng chuyển sang Available
                if (task.TaskType == HousekeepingTaskType.Cleaning && task.Room != null)
                {
                    task.Room.Status = RoomStatus.Available;
                    task.Room.UpdatedAt = DateTime.UtcNow;
                    _context.Rooms.Update(task.Room);

                    _logger.LogInformation(
                        "Room #{RoomId} ({RoomNumber}) → Available after cleaning task #{TaskId}.",
                        task.Room.RoomId, task.Room.RoomNumber, id);
                }

                // Nếu là task Maintenance → phòng về Available
                if (task.TaskType == HousekeepingTaskType.Maintenance && task.Room != null)
                {
                    task.Room.Status = RoomStatus.Available;
                    task.Room.UpdatedAt = DateTime.UtcNow;
                    _context.Rooms.Update(task.Room);
                }
            }

            _context.HousekeepingTasks.Update(task);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "HousekeepingTask #{TaskId} status: {Old} → {New} by User #{UserId}.",
                id, oldStatus, newStatus, currentUserId);

            var updated = await _context.HousekeepingTasks
                .Include(ht => ht.Room).ThenInclude(r => r.RoomType)
                .Include(ht => ht.AssignedToUser)
                .Include(ht => ht.CreatedByUser)
                .FirstAsync(ht => ht.TaskId == id);

            return Success(_mapper.Map<HousekeepingTaskDto>(updated),
                $"Task #{id}: {oldStatus} → {newStatus}.");
        }

        // ════════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ════════════════════════════════════════════════════════════════════

        private static void ValidateStatusTransition(
            HousekeepingTaskStatus current, HousekeepingTaskStatus next)
        {
            var allowed = new Dictionary<HousekeepingTaskStatus, HousekeepingTaskStatus[]>
            {
                [HousekeepingTaskStatus.Pending]    = new[] { HousekeepingTaskStatus.InProgress, HousekeepingTaskStatus.Cancelled },
                [HousekeepingTaskStatus.InProgress] = new[] { HousekeepingTaskStatus.Completed, HousekeepingTaskStatus.Cancelled },
                [HousekeepingTaskStatus.Completed]  = Array.Empty<HousekeepingTaskStatus>(),
                [HousekeepingTaskStatus.Cancelled]  = Array.Empty<HousekeepingTaskStatus>()
            };

            if (!allowed.ContainsKey(current) || !allowed[current].Contains(next))
                throw new AppException(
                    $"Không thể chuyển trạng thái từ '{current}' sang '{next}'.");
        }
    }
}

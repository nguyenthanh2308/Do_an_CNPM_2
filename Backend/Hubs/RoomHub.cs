using HotelManagement.DTOs.Room;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HotelManagement.Hubs
{
    /// <summary>
    /// RoomHub — Real-time thông báo thay đổi trạng thái phòng và housekeeping
    /// 
    /// Groups:
    ///   "hotel-{hotelId}"  → tất cả client trong hotelId
    ///   "housekeeping"     → nhân viên Housekeeping
    ///   "management"       → Manager + Admin
    /// </summary>
    [Authorize]
    public class RoomHub : Hub
    {
        private readonly ILogger<RoomHub> _logger;

        public RoomHub(ILogger<RoomHub> logger)
        {
            _logger = logger;
        }

        // ════════════════════════════════════════════════════════════════════
        // Lifecycle
        // ════════════════════════════════════════════════════════════════════

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            var role   = Context.User?.FindFirst("role")?.Value ?? "";

            _logger.LogInformation("SignalR Connected: UserId={UserId}, Role={Role}, ConnId={ConnId}",
                userId, role, Context.ConnectionId);

            // Tự động join group theo role
            if (role == "Housekeeping")
                await Groups.AddToGroupAsync(Context.ConnectionId, "housekeeping");

            if (role is "Admin" or "Manager")
                await Groups.AddToGroupAsync(Context.ConnectionId, "management");

            if (role is "Admin" or "Manager" or "Receptionist" or "Housekeeping")
                await Groups.AddToGroupAsync(Context.ConnectionId, "staff");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation("SignalR Disconnected: ConnId={ConnId}", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        // ════════════════════════════════════════════════════════════════════
        // Client → Server: Tham gia group theo hotelId
        // ════════════════════════════════════════════════════════════════════

        public async Task JoinHotelGroup(long hotelId)
        {
            var groupName = $"hotel-{hotelId}";
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            _logger.LogInformation("ConnId={ConnId} joined group {Group}",
                Context.ConnectionId, groupName);

            await Clients.Caller.SendAsync("JoinedGroup", groupName);
        }

        public async Task LeaveHotelGroup(long hotelId)
        {
            var groupName = $"hotel-{hotelId}";
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }
    }
}

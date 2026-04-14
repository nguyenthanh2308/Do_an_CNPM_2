using HotelManagement.DTOs.RoomType;
using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Room
{
    // ── Response DTO đầy đủ ───────────────────────────────────────────────────
    public class RoomDto
    {
        public long RoomId { get; set; }
        public long HotelId { get; set; }
        public string HotelName { get; set; } = null!;
        public long RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string Status { get; set; } = null!;   // Available, Occupied, Dirty...
        public string? Notes { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool IsActive { get; set; }
        public RoomTypeSummaryDto? RoomTypeDetails { get; set; }
    }

    // ── Response DTO rút gọn (dùng trong danh sách tìm phòng) ────────────────
    public class RoomSummaryDto
    {
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string Status { get; set; } = null!;
        public string RoomTypeName { get; set; } = null!;
        public decimal BasePrice { get; set; }
    }

    // ── Response DTO cho tìm phòng trống (Guest view) ─────────────────────────
    public class AvailableRoomDto
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

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateRoomDto
    {
        [Required] public long HotelId { get; set; }
        [Required] public long RoomTypeId { get; set; }
        [Required] [MaxLength(20)] public string RoomNumber { get; set; } = null!;
        [Range(1, 100)] public int Floor { get; set; } = 1;
        public string? Notes { get; set; }
        public string? ThumbnailUrl { get; set; }
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateRoomDto
    {
        public long? RoomTypeId { get; set; }
        [MaxLength(20)] public string? RoomNumber { get; set; }
        [Range(1, 100)] public int? Floor { get; set; }
        public string? Notes { get; set; }
        public string? ThumbnailUrl { get; set; }
        public bool? IsActive { get; set; }
    }

    // ── Update status DTO (Housekeeping dùng) ────────────────────────────────
    public class UpdateRoomStatusDto
    {
        [Required] public string Status { get; set; } = null!;
        public string? Notes { get; set; }
    }
}

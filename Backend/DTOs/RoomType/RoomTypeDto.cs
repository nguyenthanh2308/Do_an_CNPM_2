using HotelManagement.DTOs.Amenity;
using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.RoomType
{
    // ── Response DTO đầy đủ (dùng ở trang chi tiết) ──────────────────────────
    public class RoomTypeDto
    {
        public long RoomTypeId { get; set; }
        public long HotelId { get; set; }
        public string HotelName { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int MaxOccupancy { get; set; }
        public decimal BasePrice { get; set; }
        public string? ThumbnailUrl { get; set; }
        public float? AreaSqm { get; set; }
        public bool IsActive { get; set; }
        public int TotalRooms { get; set; }          // số phòng thuộc loại này
        public int AvailableRooms { get; set; }      // số phòng còn trống
        public List<AmenityDto> Amenities { get; set; } = new();
    }

    // ── Response DTO rút gọn (dùng trong danh sách) ───────────────────────────
    public class RoomTypeSummaryDto
    {
        public long RoomTypeId { get; set; }
        public string Name { get; set; } = null!;
        public decimal BasePrice { get; set; }
        public int MaxOccupancy { get; set; }
        public string? ThumbnailUrl { get; set; }
        public float? AreaSqm { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateRoomTypeDto
    {
        [Required] public long HotelId { get; set; }
        [Required] [MaxLength(150)] public string Name { get; set; } = null!;
        public string? Description { get; set; }
        [Range(1, 20)] public int MaxOccupancy { get; set; } = 2;
        [Required] [Range(0, double.MaxValue)] public decimal BasePrice { get; set; }
        public string? ThumbnailUrl { get; set; }
        public float? AreaSqm { get; set; }
        public List<long> AmenityIds { get; set; } = new(); // gán tiện nghi
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateRoomTypeDto
    {
        [MaxLength(150)] public string? Name { get; set; }
        public string? Description { get; set; }
        [Range(1, 20)] public int? MaxOccupancy { get; set; }
        [Range(0, double.MaxValue)] public decimal? BasePrice { get; set; }
        public string? ThumbnailUrl { get; set; }
        public float? AreaSqm { get; set; }
        public bool? IsActive { get; set; }
        public List<long>? AmenityIds { get; set; } // cập nhật lại toàn bộ tiện nghi
    }
}

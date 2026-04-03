using HotelManagement.DTOs.Guest;
using HotelManagement.DTOs.Room;
using System.ComponentModel.DataAnnotations;

namespace HotelManagement.DTOs.Booking
{
    // ── Response DTO đầy đủ ───────────────────────────────────────────────────
    public class BookingDto
    {
        public long BookingId { get; set; }
        public long GuestId { get; set; }
        public string GuestName { get; set; } = null!;
        public string? GuestEmail { get; set; }
        public string? GuestPhone { get; set; }
        public long RatePlanId { get; set; }
        public string RatePlanName { get; set; } = null!;
        public string RoomTypeName { get; set; } = null!;
        public long? PromotionId { get; set; }
        public string? PromotionCode { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public DateTime? ActualCheckIn { get; set; }
        public DateTime? ActualCheckOut { get; set; }
        public int NumGuests { get; set; }
        public int NightCount { get; set; }         // computed: số đêm lưu trú
        public string Status { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string BookingSource { get; set; } = null!;
        public string? SpecialRequests { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedByUserName { get; set; }
        public List<BookingRoomDto> Rooms { get; set; } = new();
    }

    // ── Response DTO rút gọn (dùng trong danh sách) ─────────────────────────
    public class BookingSummaryDto
    {
        public long BookingId { get; set; }
        public string GuestName { get; set; } = null!;
        public string? GuestPhone { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public string RoomNumbers { get; set; } = null!;  // "101, 102"
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public string Status { get; set; } = null!;
        public decimal FinalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ── BookingRoom nested DTO ────────────────────────────────────────────────
    public class BookingRoomDto
    {
        public long BookingRoomId { get; set; }
        public long RoomId { get; set; }
        public string RoomNumber { get; set; } = null!;
        public int Floor { get; set; }
        public string RoomTypeName { get; set; } = null!;
        public decimal PricePerNight { get; set; }
    }

    // ── Create DTO ────────────────────────────────────────────────────────────
    public class CreateBookingDto
    {
        [Required] public long GuestId { get; set; }
        [Required] public long RatePlanId { get; set; }
        public long? PromotionId { get; set; }
        [Required] public DateTime CheckInDate { get; set; }
        [Required] public DateTime CheckOutDate { get; set; }
        [Range(1, 20)] public int NumGuests { get; set; } = 1;
        public string BookingSource { get; set; } = "Online";
        public string? SpecialRequests { get; set; }
        public string? Notes { get; set; }

        /// <summary>Danh sách phòng được chọn</summary>
        [Required] [MinLength(1)] public List<long> RoomIds { get; set; } = new();
    }

    // ── Update DTO ────────────────────────────────────────────────────────────
    public class UpdateBookingDto
    {
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        [Range(1, 20)] public int? NumGuests { get; set; }
        public string? SpecialRequests { get; set; }
        public string? Notes { get; set; }
        public long? PromotionId { get; set; }
    }

    // ── Check-in DTO ──────────────────────────────────────────────────────────
    public class CheckInDto
    {
        [Required] public long BookingId { get; set; }
        public string? Notes { get; set; }
    }

    // ── Check-out DTO ─────────────────────────────────────────────────────────
    public class CheckOutDto
    {
        [Required] public long BookingId { get; set; }
        public string? Notes { get; set; }
        
        public decimal Surcharges { get; set; } = 0;
        public decimal TaxAmount { get; set; } = 0;
        
        [Required] public string PaymentMethod { get; set; } = null!;
        [Required] public decimal AmountPaid { get; set; }
    }

    // ── Cancel DTO ────────────────────────────────────────────────────────────
    public class CancelBookingDto
    {
        [Required] public long BookingId { get; set; }
        [MaxLength(500)] public string? Reason { get; set; }
    }

    // ── Search filter DTO ────────────────────────────────────────────────────
    public class BookingFilterDto
    {
        public string? GuestName { get; set; }
        public string? Status { get; set; }
        public DateTime? CheckInFrom { get; set; }
        public DateTime? CheckInTo { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}

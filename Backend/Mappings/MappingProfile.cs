using AutoMapper;
using HotelManagement.DTOs.Amenity;
using HotelManagement.DTOs.Auth;
using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Guest;
using HotelManagement.DTOs.Hotel;
using HotelManagement.DTOs.HousekeepingTask;
using HotelManagement.DTOs.Invoice;
using HotelManagement.DTOs.Payment;
using HotelManagement.DTOs.Promotion;
using HotelManagement.DTOs.RatePlan;
using HotelManagement.DTOs.Room;
using HotelManagement.DTOs.RoomType;
using HotelManagement.DTOs.User;
using HotelManagement.Enums;
using HotelManagement.Models;

namespace HotelManagement.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ══════════════════════════════════════════════════
            // USER
            // ══════════════════════════════════════════════════
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            CreateMap<User, UserInfoDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

            CreateMap<CreateUserDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())  // hash riêng trong Service
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src =>
                    Enum.Parse<UserRole>(src.Role, true)));

            // ══════════════════════════════════════════════════
            // HOTEL
            // ══════════════════════════════════════════════════
            CreateMap<Hotel, HotelDto>()
                .ForMember(dest => dest.TotalRooms,
                           opt => opt.MapFrom(src => src.Rooms.Count))
                .ForMember(dest => dest.AvailableRooms,
                           opt => opt.MapFrom(src => src.Rooms.Count(r => r.Status == RoomStatus.Available && r.IsActive)));

            CreateMap<CreateHotelDto, Hotel>();
            CreateMap<UpdateHotelDto, Hotel>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // AMENITY
            // ══════════════════════════════════════════════════
            CreateMap<Amenity, AmenityDto>();
            CreateMap<CreateAmenityDto, Amenity>();
            CreateMap<UpdateAmenityDto, Amenity>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // ROOM TYPE
            // ══════════════════════════════════════════════════
            CreateMap<RoomType, RoomTypeDto>()
                .ForMember(dest => dest.HotelName,
                           opt => opt.MapFrom(src => src.Hotel != null ? src.Hotel.Name : string.Empty))
                .ForMember(dest => dest.TotalRooms,
                           opt => opt.MapFrom(src => src.Rooms.Count))
                .ForMember(dest => dest.AvailableRooms,
                           opt => opt.MapFrom(src => src.Rooms.Count(r => r.Status == RoomStatus.Available && r.IsActive)))
                .ForMember(dest => dest.Amenities,
                           opt => opt.MapFrom(src => src.RoomTypeAmenities.Select(rta => rta.Amenity)));

            CreateMap<RoomType, RoomTypeSummaryDto>();

            CreateMap<CreateRoomTypeDto, RoomType>()
                .ForMember(dest => dest.RoomTypeAmenities, opt => opt.Ignore()); // xử lý trong Service

            CreateMap<UpdateRoomTypeDto, RoomType>()
                .ForMember(dest => dest.RoomTypeAmenities, opt => opt.Ignore())
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // ROOM
            // ══════════════════════════════════════════════════
            CreateMap<Room, RoomDto>()
                .ForMember(dest => dest.HotelName,
                           opt => opt.MapFrom(src => src.Hotel != null ? src.Hotel.Name : string.Empty))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.Name : string.Empty))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.RoomTypeDetails,
                           opt => opt.MapFrom(src => src.RoomType));

            CreateMap<Room, RoomSummaryDto>()
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.Name : string.Empty))
                .ForMember(dest => dest.BasePrice,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.BasePrice : 0));

            CreateMap<Room, AvailableRoomDto>()
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.Name : string.Empty))
                .ForMember(dest => dest.ThumbnailUrl,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.ThumbnailUrl : null))
                .ForMember(dest => dest.MaxOccupancy,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.MaxOccupancy : 0))
                .ForMember(dest => dest.AreaSqm,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.AreaSqm : null))
                .ForMember(dest => dest.PricePerNight,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.BasePrice : 0));

            CreateMap<CreateRoomDto, Room>()
                .ForMember(dest => dest.Status,   opt => opt.MapFrom(src => RoomStatus.Available))
                .ForMember(dest => dest.IsActive,  opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.Hotel,         opt => opt.Ignore())
                .ForMember(dest => dest.RoomType,      opt => opt.Ignore())
                .ForMember(dest => dest.BookingRooms,  opt => opt.Ignore())
                .ForMember(dest => dest.HousekeepingTasks, opt => opt.Ignore());

            CreateMap<UpdateRoomDto, Room>()
                .ForMember(dest => dest.IsActive,          opt => opt.Ignore())
                .ForMember(dest => dest.HotelId,           opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt,         opt => opt.Ignore())
                .ForMember(dest => dest.Hotel,             opt => opt.Ignore())
                .ForMember(dest => dest.RoomType,          opt => opt.Ignore())
                .ForMember(dest => dest.BookingRooms,      opt => opt.Ignore())
                .ForMember(dest => dest.HousekeepingTasks, opt => opt.Ignore())
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // RATE PLAN
            // ══════════════════════════════════════════════════
            CreateMap<RatePlan, RatePlanDto>()
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RoomType != null ? src.RoomType.Name : string.Empty))
                .ForMember(dest => dest.MealPlan,
                           opt => opt.MapFrom(src => src.MealPlan.ToString()));

            CreateMap<CreateRatePlanDto, RatePlan>()
                .ForMember(dest => dest.MealPlan,
                           opt => opt.MapFrom(src => Enum.Parse<MealPlan>(src.MealPlan, true)));

            CreateMap<UpdateRatePlanDto, RatePlan>()
                .ForMember(dest => dest.MealPlan, opt => opt.Condition(src => src.MealPlan != null))
                .ForMember(dest => dest.MealPlan,
                           opt => opt.MapFrom(src => src.MealPlan != null
                               ? Enum.Parse<MealPlan>(src.MealPlan, true)
                               : MealPlan.RoomOnly))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // GUEST
            // ══════════════════════════════════════════════════
            CreateMap<Guest, GuestDto>()
                .ForMember(dest => dest.IdType,
                           opt => opt.MapFrom(src => src.IdType.ToString()))
                .ForMember(dest => dest.TotalBookings,
                           opt => opt.MapFrom(src => src.Bookings.Count));

            CreateMap<CreateGuestDto, Guest>()
                .ForMember(dest => dest.IdType,
                           opt => opt.MapFrom(src => Enum.Parse<IdType>(src.IdType, true)));

            CreateMap<UpdateGuestDto, Guest>()
                .ForMember(dest => dest.IdType, opt => opt.Condition(src => src.IdType != null))
                .ForMember(dest => dest.IdType,
                           opt => opt.MapFrom(src => src.IdType != null
                               ? Enum.Parse<IdType>(src.IdType, true)
                               : IdType.CCCD))
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // PROMOTION
            // ══════════════════════════════════════════════════
            CreateMap<Promotion, PromotionDto>()
                .ForMember(dest => dest.DiscountType,
                           opt => opt.MapFrom(src => src.DiscountType.ToString()));

            CreateMap<CreatePromotionDto, Promotion>()
                .ForMember(dest => dest.DiscountType,
                           opt => opt.MapFrom(src => Enum.Parse<DiscountType>(src.DiscountType, true)));

            CreateMap<UpdatePromotionDto, Promotion>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // ══════════════════════════════════════════════════
            // BOOKING
            // ══════════════════════════════════════════════════
            CreateMap<Booking, BookingDto>()
                .ForMember(dest => dest.GuestName,
                           opt => opt.MapFrom(src => src.Guest != null ? src.Guest.FullName : string.Empty))
                .ForMember(dest => dest.GuestEmail,
                           opt => opt.MapFrom(src => src.Guest != null ? src.Guest.Email : null))
                .ForMember(dest => dest.GuestPhone,
                           opt => opt.MapFrom(src => src.Guest != null ? src.Guest.Phone : null))
                .ForMember(dest => dest.RatePlanName,
                           opt => opt.MapFrom(src => src.RatePlan != null ? src.RatePlan.Name : string.Empty))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RatePlan != null && src.RatePlan.RoomType != null
                               ? src.RatePlan.RoomType.Name : string.Empty))
                .ForMember(dest => dest.PromotionCode,
                           opt => opt.MapFrom(src => src.Promotion != null ? src.Promotion.Code : null))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.NightCount,
                           opt => opt.MapFrom(src => (src.CheckOutDate - src.CheckInDate).Days))
                .ForMember(dest => dest.CreatedByUserName,
                           opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.FullName : null))
                .ForMember(dest => dest.Rooms,
                           opt => opt.MapFrom(src => src.BookingRooms));

            CreateMap<Booking, BookingSummaryDto>()
                .ForMember(dest => dest.GuestName,
                           opt => opt.MapFrom(src => src.Guest != null ? src.Guest.FullName : string.Empty))
                .ForMember(dest => dest.GuestPhone,
                           opt => opt.MapFrom(src => src.Guest != null ? src.Guest.Phone : null))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.RatePlan != null && src.RatePlan.RoomType != null
                               ? src.RatePlan.RoomType.Name : string.Empty))
                .ForMember(dest => dest.RoomNumbers,
                           opt => opt.MapFrom(src => string.Join(", ",
                               src.BookingRooms.Select(br => br.Room != null ? br.Room.RoomNumber : ""))))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreateBookingDto, Booking>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => BookingStatus.Pending))
                .ForMember(dest => dest.BookingRooms, opt => opt.Ignore()) // xử lý trong Service
                .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
                .ForMember(dest => dest.FinalAmount, opt => opt.Ignore());

            // ── BookingRoom ────────────────────────────────────────────────────
            CreateMap<BookingRoom, BookingRoomDto>()
                .ForMember(dest => dest.RoomNumber,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomNumber : string.Empty))
                .ForMember(dest => dest.Floor,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.Floor : 0))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.Room != null && src.Room.RoomType != null
                               ? src.Room.RoomType.Name : string.Empty));

            // ══════════════════════════════════════════════════
            // INVOICE
            // ══════════════════════════════════════════════════
            CreateMap<Invoice, InvoiceDto>()
                .ForMember(dest => dest.GuestName,
                           opt => opt.MapFrom(src => src.Booking != null && src.Booking.Guest != null
                               ? src.Booking.Guest.FullName : string.Empty))
                .ForMember(dest => dest.RoomNumbers,
                           opt => opt.MapFrom(src => src.Booking != null
                               ? string.Join(", ", src.Booking.BookingRooms
                                   .Select(br => br.Room != null ? br.Room.RoomNumber : ""))
                               : string.Empty))
                .ForMember(dest => dest.CheckInDate,
                           opt => opt.MapFrom(src => src.Booking != null ? src.Booking.CheckInDate : default))
                .ForMember(dest => dest.CheckOutDate,
                           opt => opt.MapFrom(src => src.Booking != null ? src.Booking.CheckOutDate : default))
                .ForMember(dest => dest.NightCount,
                           opt => opt.MapFrom(src => src.Booking != null
                               ? (src.Booking.CheckOutDate - src.Booking.CheckInDate).Days : 0))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.PaidAmount,
                           opt => opt.MapFrom(src => src.Payments
                               .Where(p => p.Status == PaymentStatus.Completed)
                               .Sum(p => p.Amount)))
                .ForMember(dest => dest.RemainingAmount,
                           opt => opt.MapFrom(src => src.TotalAmount - src.Payments
                               .Where(p => p.Status == PaymentStatus.Completed)
                               .Sum(p => p.Amount)));

            CreateMap<CreateInvoiceDto, Invoice>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => InvoiceStatus.Pending))
                .ForMember(dest => dest.InvoiceNumber, opt => opt.Ignore()) // generate trong Service
                .ForMember(dest => dest.IssuedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            // ── Payment nested in Invoice ──────────────────────────────────────
            CreateMap<Models.Payment, PaymentSummaryDto>()
                .ForMember(dest => dest.PaymentMethod,
                           opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()));

            // ══════════════════════════════════════════════════
            // PAYMENT
            // ══════════════════════════════════════════════════
            CreateMap<Models.Payment, PaymentDto>()
                .ForMember(dest => dest.InvoiceNumber,
                           opt => opt.MapFrom(src => src.Invoice != null ? src.Invoice.InvoiceNumber : string.Empty))
                .ForMember(dest => dest.GuestName,
                           opt => opt.MapFrom(src => src.Invoice != null
                               && src.Invoice.Booking != null
                               && src.Invoice.Booking.Guest != null
                               ? src.Invoice.Booking.Guest.FullName : string.Empty))
                .ForMember(dest => dest.PaymentMethod,
                           opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()));

            CreateMap<CreatePaymentDto, Models.Payment>()
                .ForMember(dest => dest.PaymentMethod,
                           opt => opt.MapFrom(src => Enum.Parse<PaymentMethod>(src.PaymentMethod, true)))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => PaymentStatus.Pending));

            // ══════════════════════════════════════════════════
            // HOUSEKEEPING TASK
            // ══════════════════════════════════════════════════
            CreateMap<HousekeepingTask, HousekeepingTaskDto>()
                .ForMember(dest => dest.RoomNumber,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomNumber : string.Empty))
                .ForMember(dest => dest.Floor,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.Floor : 0))
                .ForMember(dest => dest.RoomTypeName,
                           opt => opt.MapFrom(src => src.Room != null && src.Room.RoomType != null
                               ? src.Room.RoomType.Name : string.Empty))
                .ForMember(dest => dest.CurrentRoomStatus,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.Status.ToString() : string.Empty))
                .ForMember(dest => dest.AssignedToUserName,
                           opt => opt.MapFrom(src => src.AssignedToUser != null ? src.AssignedToUser.FullName : null))
                .ForMember(dest => dest.CreatedByUserName,
                           opt => opt.MapFrom(src => src.CreatedByUser != null ? src.CreatedByUser.FullName : string.Empty))
                .ForMember(dest => dest.TaskType,
                           opt => opt.MapFrom(src => src.TaskType.ToString()))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.Priority,
                           opt => opt.MapFrom(src => src.Priority.ToString()));

            CreateMap<HousekeepingTask, HousekeepingTaskSummaryDto>()
                .ForMember(dest => dest.RoomNumber,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.RoomNumber : string.Empty))
                .ForMember(dest => dest.Floor,
                           opt => opt.MapFrom(src => src.Room != null ? src.Room.Floor : 0))
                .ForMember(dest => dest.TaskType,
                           opt => opt.MapFrom(src => src.TaskType.ToString()))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => src.Status.ToString()))
                .ForMember(dest => dest.Priority,
                           opt => opt.MapFrom(src => src.Priority.ToString()));

            CreateMap<CreateHousekeepingTaskDto, HousekeepingTask>()
                .ForMember(dest => dest.TaskType,
                           opt => opt.MapFrom(src => Enum.Parse<HousekeepingTaskType>(src.TaskType, true)))
                .ForMember(dest => dest.Priority,
                           opt => opt.MapFrom(src => Enum.Parse<TaskPriority>(src.Priority, true)))
                .ForMember(dest => dest.Status,
                           opt => opt.MapFrom(src => HousekeepingTaskStatus.Pending));
        }
    }
}

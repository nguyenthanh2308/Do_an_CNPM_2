using FluentValidation;
using HotelManagement.DTOs.Booking;

namespace HotelManagement.Validators.Booking
{
    /// <summary>
    /// Validate CreateBookingDto trước khi xử lý nghiệp vụ
    /// </summary>
    public class CreateBookingValidator : AbstractValidator<CreateBookingDto>
    {
        public CreateBookingValidator()
        {
            RuleFor(x => x.GuestId)
                .GreaterThan(0).WithMessage("GuestId không hợp lệ.");

            RuleFor(x => x.RatePlanId)
                .GreaterThan(0).WithMessage("RatePlanId không hợp lệ.");

            RuleFor(x => x.CheckInDate)
                .GreaterThanOrEqualTo(DateTime.Today)
                .WithMessage("Ngày check-in không được nhỏ hơn ngày hôm nay.");

            RuleFor(x => x.CheckOutDate)
                .GreaterThan(x => x.CheckInDate)
                .WithMessage("Ngày check-out phải sau ngày check-in.");

            RuleFor(x => x)
                .Must(x => (x.CheckOutDate - x.CheckInDate).Days >= 1)
                .WithMessage("Thời gian lưu trú tối thiểu là 1 đêm.")
                .OverridePropertyName("CheckOutDate");

            RuleFor(x => x)
                .Must(x => (x.CheckOutDate - x.CheckInDate).Days <= 365)
                .WithMessage("Thời gian lưu trú không được vượt quá 365 ngày.")
                .OverridePropertyName("CheckOutDate");

            RuleFor(x => x.NumGuests)
                .InclusiveBetween(1, 20)
                .WithMessage("Số khách phải từ 1 đến 20.");

            RuleFor(x => x.RoomIds)
                .NotEmpty().WithMessage("Phải chọn ít nhất 1 phòng.")
                .Must(ids => ids.All(id => id > 0))
                .WithMessage("Danh sách phòng không hợp lệ.")
                .Must(ids => ids.Distinct().Count() == ids.Count)
                .WithMessage("Danh sách phòng không được trùng nhau.");

            RuleFor(x => x.BookingSource)
                .Must(s => new[] { "Online", "WalkIn", "Phone" }.Contains(s))
                .WithMessage("BookingSource phải là: Online, WalkIn hoặc Phone.");

            RuleFor(x => x.SpecialRequests)
                .MaximumLength(1000)
                .WithMessage("Yêu cầu đặc biệt không vượt quá 1000 ký tự.")
                .When(x => x.SpecialRequests != null);
        }
    }

    /// <summary>
    /// Validate CheckInDto
    /// </summary>
    public class CheckInValidator : AbstractValidator<CheckInDto>
    {
        public CheckInValidator()
        {
            RuleFor(x => x.BookingId)
                .GreaterThan(0).WithMessage("BookingId không hợp lệ.");
        }
    }

    /// <summary>
    /// Validate CheckOutDto
    /// </summary>
    public class CheckOutValidator : AbstractValidator<CheckOutDto>
    {
        public CheckOutValidator()
        {
            RuleFor(x => x.BookingId)
                .GreaterThan(0).WithMessage("BookingId không hợp lệ.");
        }
    }

    /// <summary>
    /// Validate CancelBookingDto
    /// </summary>
    public class CancelBookingValidator : AbstractValidator<CancelBookingDto>
    {
        public CancelBookingValidator()
        {
            RuleFor(x => x.BookingId)
                .GreaterThan(0).WithMessage("BookingId không hợp lệ.");

            RuleFor(x => x.Reason)
                .MaximumLength(500)
                .WithMessage("Lý do hủy không vượt quá 500 ký tự.")
                .When(x => x.Reason != null);
        }
    }

    /// <summary>
    /// Validate BookingFilterDto
    /// </summary>
    public class BookingFilterValidator : AbstractValidator<BookingFilterDto>
    {
        private static readonly string[] AllowedStatuses =
            { "Pending", "Confirmed", "CheckedIn", "Completed", "Cancelled" };

        public BookingFilterValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page phải lớn hơn 0.");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100).WithMessage("PageSize phải từ 1 đến 100.");

            RuleFor(x => x.Status)
                .Must(s => AllowedStatuses.Contains(s))
                .WithMessage($"Status không hợp lệ. Chỉ chấp nhận: {string.Join(", ", AllowedStatuses)}")
                .When(x => !string.IsNullOrEmpty(x.Status));

            RuleFor(x => x)
                .Must(x => !x.CheckInFrom.HasValue || !x.CheckInTo.HasValue || x.CheckInFrom <= x.CheckInTo)
                .WithMessage("CheckInFrom phải nhỏ hơn hoặc bằng CheckInTo.")
                .OverridePropertyName("CheckInFrom");
        }
    }
}

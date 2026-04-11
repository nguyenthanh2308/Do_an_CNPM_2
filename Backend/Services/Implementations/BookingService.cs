using AutoMapper;
using FluentValidation;
using HotelManagement.Data;
using HotelManagement.DTOs.Booking;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Promotion;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Hubs;
using HotelManagement.Models;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepo;
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateBookingDto> _createValidator;
        private readonly IValidator<CheckInDto> _checkInValidator;
        private readonly IValidator<CheckOutDto> _checkOutValidator;
        private readonly IValidator<CancelBookingDto> _cancelValidator;
        private readonly IValidator<BookingFilterDto> _filterValidator;
        private readonly IHubContext<RoomHub> _hubContext;
        private readonly IInvoiceService _invoiceService;

        public BookingService(
            IBookingRepository bookingRepo,
            HotelDbContext context,
            IMapper mapper,
            IValidator<CreateBookingDto> createValidator,
            IValidator<CheckInDto> checkInValidator,
            IValidator<CheckOutDto> checkOutValidator,
            IValidator<CancelBookingDto> cancelValidator,
            IValidator<BookingFilterDto> filterValidator,
            IHubContext<RoomHub> hubContext,
            IInvoiceService invoiceService)
        {
            _bookingRepo = bookingRepo;
            _context = context;
            _mapper = mapper;
            _createValidator = createValidator;
            _checkInValidator = checkInValidator;
            _checkOutValidator = checkOutValidator;
            _cancelValidator = cancelValidator;
            _filterValidator = filterValidator;
            _hubContext = hubContext;
            _invoiceService = invoiceService;
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET BY ID
        // ═══════════════════════════════════════════════════════════════════
        public async Task<BookingDto> GetByIdAsync(long bookingId)
        {
            var booking = await _bookingRepo.GetBookingDetailAsync(bookingId)
                          ?? throw AppException.NotFound($"Booking #{bookingId}");

            return _mapper.Map<BookingDto>(booking);
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET PAGED LIST
        // ═══════════════════════════════════════════════════════════════════
        public async Task<PagedResult<BookingSummaryDto>> GetPagedAsync(BookingFilterDto filter)
        {
            // Validate filter
            var validation = await _filterValidator.ValidateAsync(filter);
            if (!validation.IsValid)
                throw AppException.Validation(validation.Errors.Select(e => e.ErrorMessage).ToList());

            var (items, totalCount) = await _bookingRepo.GetPagedAsync(filter);

            return new PagedResult<BookingSummaryDto>
            {
                Data = _mapper.Map<List<BookingSummaryDto>>(items),
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // GET BY GUEST
        // ═══════════════════════════════════════════════════════════════════
        public async Task<IEnumerable<BookingSummaryDto>> GetByGuestAsync(long guestId)
        {
            var bookings = await _bookingRepo.GetByGuestAsync(guestId);
            return _mapper.Map<IEnumerable<BookingSummaryDto>>(bookings);
        }

        // ═══════════════════════════════════════════════════════════════════
        // TẠO BOOKING — luồng chính
        // ═══════════════════════════════════════════════════════════════════
        public async Task<BookingDto> CreateBookingAsync(CreateBookingDto dto, long? createdByUserId = null)
        {
            // ── Bước 1: Validate FluentValidation ────────────────────────────
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                throw AppException.Validation(validation.Errors.Select(e => e.ErrorMessage).ToList());

            // ── Bước 2: Kiểm tra Guest tồn tại ───────────────────────────────
            // Tìm theo GuestId trước, nếu không thấy thì thử tìm theo UserId
            // (Guest Portal gửi userId, không phải guestId)
            var guest = await _context.Guests.FindAsync(dto.GuestId)
                        ?? await _context.Guests.FirstOrDefaultAsync(g => g.UserId == dto.GuestId);

            // Nếu vẫn không thấy, tự tạo Guest mới từ thông tin User (user mới đăng ký)
            if (guest == null)
            {
                var linkedUser = await _context.Users.FindAsync(dto.GuestId);
                if (linkedUser == null)
                    throw AppException.NotFound($"Guest #{dto.GuestId}");

                guest = new Guest
                {
                    UserId = linkedUser.UserId,
                    FullName = linkedUser.FullName ?? linkedUser.Username,
                    Email = linkedUser.Email,
                    Phone = linkedUser.Phone,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.Guests.AddAsync(guest);
                await _context.SaveChangesAsync(); // Lấy GuestId mới
            }

            // ── Bước 3: Kiểm tra RatePlan hợp lệ và còn active ───────────────
            var ratePlan = await _context.RatePlans
                .Include(rp => rp.RoomType)
                .FirstOrDefaultAsync(rp => rp.RatePlanId == dto.RatePlanId && rp.IsActive)
                ?? throw AppException.NotFound($"RatePlan #{dto.RatePlanId}");

            // Kiểm tra MinStayNights
            int nightCount = (dto.CheckOutDate - dto.CheckInDate).Days;
            if (nightCount < ratePlan.MinStayNights)
                throw new AppException(
                    $"Gói giá '{ratePlan.Name}' yêu cầu lưu trú tối thiểu {ratePlan.MinStayNights} đêm.");

            // ── Bước 4: Kiểm tra các phòng tồn tại, thuộc đúng RoomType ──────
            var rooms = await _context.Rooms
                .Where(r => dto.RoomIds.Contains(r.RoomId) && r.IsActive)
                .ToListAsync();

            if (rooms.Count != dto.RoomIds.Count)
            {
                var foundIds = rooms.Select(r => r.RoomId).ToList();
                var notFound = dto.RoomIds.Except(foundIds).ToList();
                throw new AppException($"Phòng không tồn tại hoặc đã bị vô hiệu hóa: {string.Join(", ", notFound)}");
            }

            // Kiểm tra tất cả phòng phải cùng RoomType với RatePlan
            var invalidRooms = rooms.Where(r => r.RoomTypeId != ratePlan.RoomTypeId).ToList();
            if (invalidRooms.Any())
                throw new AppException(
                    $"Phòng {string.Join(", ", invalidRooms.Select(r => r.RoomNumber))} không thuộc loại phòng của gói giá đã chọn.");

            // ── Bước 5: Kiểm tra phòng có Available không ────────────────────
            var notAvailable = rooms.Where(r => r.Status != RoomStatus.Available).ToList();
            if (notAvailable.Any())
                throw new AppException(
                    $"Phòng {string.Join(", ", notAvailable.Select(r => r.RoomNumber))} hiện không sẵn sàng (trạng thái: {string.Join(", ", notAvailable.Select(r => r.Status))}).");

            // ── Bước 6: Kiểm tra xung đột lịch phòng ────────────────────────
            var conflictingIds = await _bookingRepo.GetConflictingRoomIdsAsync(
                dto.RoomIds, dto.CheckInDate, dto.CheckOutDate);

            if (conflictingIds.Any())
            {
                var conflictRoomNumbers = rooms
                    .Where(r => conflictingIds.Contains(r.RoomId))
                    .Select(r => r.RoomNumber);
                throw AppException.Conflict(
                    $"Phòng {string.Join(", ", conflictRoomNumbers)} đã được đặt trong khoảng thời gian này.");
            }

            // ── Bước 7: Kiểm tra sức chứa (tổng capacity >= NumGuests) ───────
            var totalCapacity = rooms.Sum(r =>
                _context.RoomTypes.Find(r.RoomTypeId)?.MaxOccupancy ?? 2);
            if (dto.NumGuests > totalCapacity)
                throw new AppException(
                    $"Số khách ({dto.NumGuests}) vượt quá sức chứa tổng của các phòng đã chọn ({totalCapacity}).");

            // ── Bước 8: Tính tổng tiền ────────────────────────────────────────
            decimal totalAmount = ratePlan.PricePerNight * nightCount * rooms.Count;
            decimal discountAmount = 0;

            // ── Bước 9: Áp dụng Promotion (nếu có) ───────────────────────────
            Promotion? promotion = null;
            if (dto.PromotionId.HasValue)
            {
                promotion = await ValidateAndGetPromotionAsync(dto.PromotionId.Value, totalAmount);
                discountAmount = CalculateDiscount(promotion, totalAmount);
            }

            decimal finalAmount = totalAmount - discountAmount;

            // ── Bước 10: Tạo Booking entity ────────────────────────────────────
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var booking = new Booking
                {
                    GuestId = guest.GuestId,
                    RatePlanId = dto.RatePlanId,
                    PromotionId = dto.PromotionId,
                    CreatedByUserId = createdByUserId,
                    CheckInDate = dto.CheckInDate,
                    CheckOutDate = dto.CheckOutDate,
                    NumGuests = dto.NumGuests,
                    Status = BookingStatus.Confirmed,   // Confirmed ngay vì đã chọn phòng
                    TotalAmount = totalAmount,
                    DiscountAmount = discountAmount,
                    FinalAmount = finalAmount,
                    BookingSource = dto.BookingSource,
                    SpecialRequests = dto.SpecialRequests,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Bookings.AddAsync(booking);
                await _context.SaveChangesAsync(); // Lấy BookingId

                // ── Bước 11: Tạo BookingRoom ──────────────────────────────────
                var bookingRooms = rooms.Select(room => new BookingRoom
                {
                    BookingId = booking.BookingId,
                    RoomId = room.RoomId,
                    CheckInDate = dto.CheckInDate,
                    CheckOutDate = dto.CheckOutDate,
                    PricePerNight = ratePlan.PricePerNight
                }).ToList();

                await _context.BookingRooms.AddRangeAsync(bookingRooms);

                // ── Bước 12: Cập nhật UsedCount của Promotion ─────────────────
                if (promotion != null)
                {
                    promotion.UsedCount++;
                    _context.Promotions.Update(promotion);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // ── Bước 13: Load lại để trả về đầy đủ ──────────────────────
                var created = await _bookingRepo.GetBookingDetailAsync(booking.BookingId);
                return _mapper.Map<BookingDto>(created!);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // UPDATE BOOKING
        // ═══════════════════════════════════════════════════════════════════
        public async Task<BookingDto> UpdateBookingAsync(long bookingId, UpdateBookingDto dto)
        {
            var booking = await _bookingRepo.GetBookingDetailAsync(bookingId)
                          ?? throw AppException.NotFound($"Booking #{bookingId}");

            // Chỉ có thể sửa khi Pending hoặc Confirmed
            if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
                throw new AppException($"Không thể cập nhật booking đang ở trạng thái '{booking.Status}'.");

            if (dto.CheckInDate.HasValue) booking.CheckInDate = dto.CheckInDate.Value;
            if (dto.CheckOutDate.HasValue) booking.CheckOutDate = dto.CheckOutDate.Value;
            if (dto.NumGuests.HasValue) booking.NumGuests = dto.NumGuests.Value;
            if (dto.SpecialRequests != null) booking.SpecialRequests = dto.SpecialRequests;
            if (dto.Notes != null) booking.Notes = dto.Notes;

            // Validate ngày nếu thay đổi
            if (booking.CheckOutDate <= booking.CheckInDate)
                throw new AppException("Ngày check-out phải sau ngày check-in.");

            booking.UpdatedAt = DateTime.UtcNow;
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();

            return _mapper.Map<BookingDto>(booking);
        }

        // ═══════════════════════════════════════════════════════════════════
        // HỦY BOOKING
        // ═══════════════════════════════════════════════════════════════════
        public async Task CancelBookingAsync(CancelBookingDto dto)
        {
            var validation = await _cancelValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                throw AppException.Validation(validation.Errors.Select(e => e.ErrorMessage).ToList());

            var booking = await _bookingRepo.GetBookingDetailAsync(dto.BookingId)
                          ?? throw AppException.NotFound($"Booking #{dto.BookingId}");

            // Không thể hủy nếu đã CheckedIn hoặc Completed
            if (booking.Status is BookingStatus.CheckedIn or BookingStatus.Completed)
                throw new AppException($"Không thể hủy booking đang ở trạng thái '{booking.Status}'.");

            if (booking.Status == BookingStatus.Cancelled)
                throw new AppException("Booking này đã bị hủy trước đó.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                booking.Status = BookingStatus.Cancelled;
                booking.Notes = string.IsNullOrEmpty(dto.Reason)
                    ? booking.Notes
                    : $"Hủy booking: {dto.Reason}";
                booking.UpdatedAt = DateTime.UtcNow;

                // Hoàn lại UsedCount của Promotion
                if (booking.PromotionId.HasValue && booking.Promotion != null)
                {
                    booking.Promotion.UsedCount = Math.Max(0, booking.Promotion.UsedCount - 1);
                    _context.Promotions.Update(booking.Promotion);
                }

                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // CHECK-IN
        // ═══════════════════════════════════════════════════════════════════
        public async Task<BookingDto> CheckInAsync(CheckInDto dto)
        {
            var validation = await _checkInValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                throw AppException.Validation(validation.Errors.Select(e => e.ErrorMessage).ToList());

            var booking = await _bookingRepo.GetBookingDetailAsync(dto.BookingId)
                          ?? throw AppException.NotFound($"Booking #{dto.BookingId}");

            // Chỉ có thể check-in khi Confirmed
            if (booking.Status != BookingStatus.Confirmed)
                throw new AppException(
                    $"Không thể check-in. Booking hiện đang ở trạng thái '{booking.Status}'. Yêu cầu trạng thái: Confirmed.");

            // Kiểm tra ngày check-in hợp lệ (không quá sớm / muộn 1 ngày)
            var today = DateTime.Today;
            if (booking.CheckInDate.Date > today.AddDays(1))
                throw new AppException(
                    $"Chưa đến ngày check-in. Ngày check-in: {booking.CheckInDate:dd/MM/yyyy}.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Cập nhật Booking status
                booking.Status = BookingStatus.CheckedIn;
                booking.ActualCheckIn = DateTime.UtcNow;
                booking.Notes = dto.Notes ?? booking.Notes;
                booking.UpdatedAt = DateTime.UtcNow;

                var statusChangedRooms = new List<Room>();

                // Cập nhật tất cả Room sang Occupied
                foreach (var br in booking.BookingRooms)
                {
                    var room = await _context.Rooms.FindAsync(br.RoomId);
                    if (room != null)
                    {
                        statusChangedRooms.Add(new Room { RoomId = room.RoomId, RoomNumber = room.RoomNumber, Floor = room.Floor, HotelId = room.HotelId });

                        room.Status = RoomStatus.Occupied;
                        room.UpdatedAt = DateTime.UtcNow;
                        _context.Rooms.Update(room);
                    }
                }

                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // SignalR thông báo
                foreach (var room in statusChangedRooms)
                {
                    await _hubContext.Clients.Group("staff").SendAsync(HubEvents.RoomStatusChanged, new RoomStatusChangedPayload
                    {
                        RoomId = room.RoomId,
                        RoomNumber = room.RoomNumber,
                        Floor = room.Floor,
                        HotelId = room.HotelId,
                        OldStatus = RoomStatus.Available.ToString(),
                        NewStatus = RoomStatus.Occupied.ToString(),
                        ChangedAt = DateTime.UtcNow
                    });
                }

                return _mapper.Map<BookingDto>(booking);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // CHECK-OUT
        // ═══════════════════════════════════════════════════════════════════
        public async Task<BookingDto> CheckOutAsync(CheckOutDto dto)
        {
            var validation = await _checkOutValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                throw AppException.Validation(validation.Errors.Select(e => e.ErrorMessage).ToList());

            var booking = await _bookingRepo.GetBookingDetailAsync(dto.BookingId)
                          ?? throw AppException.NotFound($"Booking #{dto.BookingId}");

            // Chỉ có thể check-out khi CheckedIn
            if (booking.Status != BookingStatus.CheckedIn)
                throw new AppException(
                    $"Không thể check-out. Booking hiện đang ở trạng thái '{booking.Status}'. Yêu cầu trạng thái: CheckedIn.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Gọi sang InvoiceService để xử lý Hóa đơn & Thanh toán (Luồng gộp)
                // Nó sẽ quăng lỗi nếu AmountPaid không đủ thanh toán tổng hóa đơn
                await _invoiceService.GenerateCheckoutInvoiceAsync(
                    booking, 
                    dto.Surcharges, 
                    dto.TaxAmount, 
                    dto.PaymentMethod, 
                    dto.AmountPaid, 
                    dto.Notes);

                // Cập nhật Booking status
                booking.Status = BookingStatus.Completed;
                booking.ActualCheckOut = DateTime.UtcNow;
                booking.Notes = dto.Notes ?? booking.Notes;
                booking.UpdatedAt = DateTime.UtcNow;

                // Lưu thông tin để gửi qua SignalR sau khi commit
                var housekeepingTasks = new List<HousekeepingTask>();

                // Cập nhật tất cả Room sang Dirty → Housekeeping sẽ nhận task
                foreach (var br in booking.BookingRooms)
                {
                    var room = await _context.Rooms.FindAsync(br.RoomId);
                    if (room != null)
                    {
                        room.Status = RoomStatus.Dirty;
                        room.UpdatedAt = DateTime.UtcNow;
                        _context.Rooms.Update(room);

                        // Tự động tạo HousekeepingTask cho mỗi phòng vừa trả
                        var cleaningTask = new HousekeepingTask
                        {
                            RoomId = room.RoomId,
                            Room = room, // Gắn tạm Entity để dùng truyền qua msg
                            TaskType = HousekeepingTaskType.Cleaning,
                            Status = HousekeepingTaskStatus.Pending,
                            Priority = TaskPriority.High,
                            Notes = $"Phòng {room.RoomNumber} vừa check-out. Cần dọn ngay.",
                            CreatedByUserId = booking.CreatedByUserId ?? 1, // fallback
                            CreatedAt = DateTime.UtcNow
                        };
                        await _context.HousekeepingTasks.AddAsync(cleaningTask);
                        housekeepingTasks.Add(cleaningTask);
                    }
                }

                _context.Bookings.Update(booking);
                await _context.SaveChangesAsync();  // Lưu để lấy TaskId
                await transaction.CommitAsync();

                // Gửi thông báo đến Housekeeping / staff qua SignalR
                foreach (var task in housekeepingTasks)
                {
                    // Thông báo phòng đổi trạng thái -> Dirty
                    await _hubContext.Clients.Group("staff").SendAsync(HubEvents.RoomStatusChanged, new RoomStatusChangedPayload
                    {
                        RoomId = task.Room.RoomId,
                        RoomNumber = task.Room.RoomNumber,
                        Floor = task.Room.Floor,
                        HotelId = task.Room.HotelId,
                        OldStatus = RoomStatus.Occupied.ToString(),
                        NewStatus = RoomStatus.Dirty.ToString(),
                        ChangedAt = DateTime.UtcNow
                    });

                    // Báo có task dọn phòng mới
                    await _hubContext.Clients.Group("housekeeping").SendAsync(HubEvents.NewHousekeepingTask, new NewHousekeepingTaskPayload
                    {
                        TaskId = task.TaskId,
                        RoomId = task.Room.RoomId,
                        RoomNumber = task.Room.RoomNumber,
                        Floor = task.Room.Floor,
                        TaskType = task.TaskType.ToString(),
                        Priority = task.Priority.ToString(),
                        Notes = task.Notes,
                        CreatedAt = task.CreatedAt
                    });
                }

                return _mapper.Map<BookingDto>(booking);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        // TÌM PHÒNG TRỐNG
        // ═══════════════════════════════════════════════════════════════════
        public async Task<IEnumerable<RoomAvailabilityDto>> GetAvailableRoomsAsync(SearchAvailableRoomsDto filter)
        {
            if (filter.CheckOut <= filter.CheckIn)
                throw new AppException("Ngày check-out phải sau ngày check-in.");

            // Lấy tất cả RoomId đã bị đặt trong khoảng thời gian
            var bookedRoomIds = await _context.BookingRooms
                .Where(br =>
                    br.Booking.Status != BookingStatus.Cancelled &&
                    br.CheckInDate < filter.CheckOut &&
                    br.CheckOutDate > filter.CheckIn)
                .Select(br => br.RoomId)
                .Distinct()
                .ToListAsync();

            var query = _context.Rooms
                .Include(r => r.RoomType)
                .Where(r =>
                    r.IsActive &&
                    r.Status == RoomStatus.Available &&
                    !bookedRoomIds.Contains(r.RoomId));

            // Filter theo RoomType
            if (filter.RoomTypeId.HasValue)
                query = query.Where(r => r.RoomTypeId == filter.RoomTypeId.Value);

            // Filter theo số khách
            if (filter.Guests > 0)
                query = query.Where(r => r.RoomType.MaxOccupancy >= filter.Guests);

            // Filter theo giá
            if (filter.MaxPrice.HasValue)
                query = query.Where(r => r.RoomType.BasePrice <= filter.MaxPrice.Value);

            var rooms = await query
                .OrderBy(r => r.RoomType.BasePrice)
                .ThenBy(r => r.Floor)
                .ToListAsync();

            return rooms.Select(r => new RoomAvailabilityDto
            {
                RoomId = r.RoomId,
                RoomNumber = r.RoomNumber,
                Floor = r.Floor,
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType?.Name ?? string.Empty,
                ThumbnailUrl = r.RoomType?.ThumbnailUrl,
                MaxOccupancy = r.RoomType?.MaxOccupancy ?? 0,
                AreaSqm = r.RoomType?.AreaSqm,
                PricePerNight = r.RoomType?.BasePrice ?? 0
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // VALIDATE VOUCHER
        // ═══════════════════════════════════════════════════════════════════
        public async Task<ValidateVoucherResponseDto> ValidateVoucherAsync(ValidateVoucherRequestDto dto)
        {
            var promotion = await _context.Promotions
                .FirstOrDefaultAsync(p => p.Code == dto.Code && p.IsActive);

            if (promotion == null)
                return new ValidateVoucherResponseDto { IsValid = false, Message = "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa." };

            var now = DateTime.UtcNow;
            if (now < promotion.StartDate || now > promotion.EndDate)
                return new ValidateVoucherResponseDto { IsValid = false, Message = "Mã giảm giá đã hết hạn hoặc chưa có hiệu lực." };

            if (promotion.UsageLimit > 0 && promotion.UsedCount >= promotion.UsageLimit)
                return new ValidateVoucherResponseDto { IsValid = false, Message = "Mã giảm giá đã đạt giới hạn sử dụng." };

            if (dto.BookingAmount < promotion.MinBookingAmount)
                return new ValidateVoucherResponseDto
                {
                    IsValid = false,
                    Message = $"Đơn hàng phải đạt tối thiểu {promotion.MinBookingAmount:N0} VNĐ để áp dụng mã này."
                };

            var discountAmount = CalculateDiscount(promotion, dto.BookingAmount);

            return new ValidateVoucherResponseDto
            {
                IsValid = true,
                Message = "Áp dụng mã giảm giá thành công.",
                PromotionId = promotion.PromotionId,
                DiscountAmount = discountAmount,
                FinalAmount = dto.BookingAmount - discountAmount
            };
        }

        // ═══════════════════════════════════════════════════════════════════
        // PRIVATE HELPERS
        // ═══════════════════════════════════════════════════════════════════

        private async Task<Promotion> ValidateAndGetPromotionAsync(long promotionId, decimal bookingAmount)
        {
            var promotion = await _context.Promotions.FindAsync(promotionId)
                            ?? throw AppException.NotFound($"Promotion #{promotionId}");

            if (!promotion.IsActive)
                throw new AppException("Mã giảm giá đã bị vô hiệu hóa.");

            var now = DateTime.UtcNow;
            if (now < promotion.StartDate || now > promotion.EndDate)
                throw new AppException("Mã giảm giá đã hết hạn hoặc chưa có hiệu lực.");

            if (promotion.UsageLimit > 0 && promotion.UsedCount >= promotion.UsageLimit)
                throw new AppException("Mã giảm giá đã đạt giới hạn sử dụng.");

            if (bookingAmount < promotion.MinBookingAmount)
                throw new AppException(
                    $"Đơn hàng phải đạt tối thiểu {promotion.MinBookingAmount:N0} VNĐ để áp dụng mã này.");

            return promotion;
        }

        private static decimal CalculateDiscount(Promotion promotion, decimal bookingAmount)
        {
            decimal discount = promotion.DiscountType == DiscountType.Percentage
                ? bookingAmount * (promotion.DiscountValue / 100)
                : promotion.DiscountValue;

            // Giới hạn số tiền giảm tối đa (nếu có)
            if (promotion.MaxDiscountAmount.HasValue && discount > promotion.MaxDiscountAmount.Value)
                discount = promotion.MaxDiscountAmount.Value;

            return Math.Min(discount, bookingAmount); // không giảm quá tổng tiền
        }
    }
}

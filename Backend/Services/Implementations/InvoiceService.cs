using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Invoice;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations
{
    public class InvoiceService : IInvoiceService
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;
        private readonly IPaymentService _paymentService;

        public InvoiceService(HotelDbContext context, IMapper mapper, IPaymentService paymentService)
        {
            _context = context;
            _mapper = mapper;
            _paymentService = paymentService;
        }

        public async Task<InvoiceDto> GetInvoiceByIdAsync(long invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Guest)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingRooms)
                        .ThenInclude(br => br.Room)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId)
                ?? throw AppException.NotFound($"Invoice #{invoiceId}");

            return _mapper.Map<InvoiceDto>(invoice);
        }

        public async Task<IEnumerable<InvoiceDto>> GetInvoicesByBookingAsync(long bookingId)
        {
            var invoices = await _context.Invoices
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Guest)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingRooms)
                        .ThenInclude(br => br.Room)
                .Include(i => i.Payments)
                .Where(i => i.BookingId == bookingId)
                .OrderByDescending(i => i.IssuedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<InvoiceDto>>(invoices);
        }

        public async Task<PagedResult<InvoiceDto>> GetPagedInvoicesAsync(int page, int pageSize)
        {
            var query = _context.Invoices
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Guest)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingRooms)
                        .ThenInclude(br => br.Room)
                .Include(i => i.Payments)
                .AsQueryable();

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(i => i.IssuedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<InvoiceDto>
            {
                Data = _mapper.Map<List<InvoiceDto>>(items),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<Invoice> GenerateCheckoutInvoiceAsync(
            Booking booking, 
            decimal surcharges, 
            decimal taxAmount, 
            string paymentMethodStr, 
            decimal amountPaid, 
            string? notes)
        {
            // 1. Tính toán
            // Booking.FinalAmount đã trừ Discount promotion lúc đặt phòng
            decimal subtotal = booking.FinalAmount + surcharges;
            decimal totalAmount = subtotal + taxAmount;

            // Bắt buộc thanh toán đẩy đủ phần còn nợ
            if (amountPaid < totalAmount)
            {
                throw new AppException($"Số tiền thanh toán ({amountPaid:N0}) chưa đủ. Cần thanh toán đủ tổng nợ là {totalAmount:N0} để hoàn tất Check-out.");
            }

            // 2. Tạo Invoice
            var invoice = new Invoice
            {
                BookingId = booking.BookingId,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{booking.BookingId}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                IssuedAt = DateTime.UtcNow,
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                DiscountAmount = booking.DiscountAmount, // Copy logic để in hóa đơn
                TotalAmount = totalAmount,
                Status = InvoiceStatus.Paid, // Vì bắt buộc trả đủ nên set luôn thành Paid
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Invoices.AddAsync(invoice);
            await _context.SaveChangesAsync(); // Sinh ra InvoiceId

            // 3. Tạo Payment qua PaymentService để tách biệt trách nhiệm nghiệp vụ.
            await _paymentService.CreateCheckoutPaymentAsync(
                invoice,
                paymentMethodStr,
                amountPaid,
                notes);
            
            return invoice;
        }
    }
}

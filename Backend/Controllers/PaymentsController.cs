using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Payment;
using HotelManagement.Enums;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Payments Controller — tra cứu và ghi nhận thanh toán.
    /// Guests có thể thanh toán cho booking của chính mình.
    /// Staff có thể tra cứu tất cả thanh toán.
    /// </summary>
    [Authorize]
    public class PaymentsController : BaseController
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public PaymentsController(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentDto>>), 200)]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 200);

            var query = _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(p => p.PaymentDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Success(new PagedResult<PaymentDto>
            {
                Data = _mapper.Map<List<PaymentDto>>(items),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id:long}")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<PaymentDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(long id)
        {
            var payment = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .FirstOrDefaultAsync(p => p.PaymentId == id)
                ?? throw AppException.NotFound($"Payment #{id}");

            return Success(_mapper.Map<PaymentDto>(payment));
        }

        [HttpGet("invoice/{invoiceId:long}")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentDto>>), 200)]
        public async Task<IActionResult> GetByInvoice(long invoiceId)
        {
            var payments = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .Where(p => p.InvoiceId == invoiceId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return Success(_mapper.Map<IEnumerable<PaymentDto>>(payments));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<PaymentDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 403)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Create([FromBody] CreatePaymentDto dto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.Guest)
                .FirstOrDefaultAsync(i => i.InvoiceId == dto.InvoiceId)
                ?? throw AppException.NotFound($"Invoice #{dto.InvoiceId}");

            // Check if user is staff or owns the booking
            var userId = GetCurrentUserId();
            var userRole = User.FindFirst("role")?.Value;
            var isStaff = !string.IsNullOrEmpty(userRole) && new[] { "Admin", "Manager", "Receptionist" }.Contains(userRole);
            
            if (!isStaff)
            {
                // Guest must own the booking associated with this invoice
                var guest = await _context.Guests.FirstOrDefaultAsync(g => g.UserId == userId && g.GuestId == invoice.Booking.GuestId);
                if (guest == null)
                    return Fail("Bạn không có quyền thanh toán hóa đơn này.", 403);
            }

            if (!Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var method))
                throw new AppException($"PaymentMethod '{dto.PaymentMethod}' không hợp lệ.");

            var paidAmount = invoice.Payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .Sum(p => p.Amount);
            var remaining = invoice.TotalAmount - paidAmount;
            if (remaining <= 0)
                throw new AppException("Hóa đơn đã được thanh toán đủ.");

            var payment = new Payment
            {
                InvoiceId = dto.InvoiceId,
                Amount = Math.Min(dto.Amount, remaining),
                PaymentMethod = method,
                PaymentDate = DateTime.UtcNow,
                TransactionId = dto.TransactionId,
                Status = PaymentStatus.Completed,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Payments.AddAsync(payment);

            if (payment.Amount >= remaining)
                invoice.Status = InvoiceStatus.Paid;
            else if (invoice.Status == InvoiceStatus.Cancelled)
                invoice.Status = InvoiceStatus.Pending;

            _context.Invoices.Update(invoice);
            await _context.SaveChangesAsync();

            var created = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .FirstAsync(p => p.PaymentId == payment.PaymentId);

            return Created(_mapper.Map<PaymentDto>(created), "Ghi nhận thanh toán thành công.");
        }

        [HttpPut("{id:long}/status")]
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [ProducesResponseType(typeof(ApiResponse<PaymentDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdatePaymentStatusDto dto)
        {
            var payment = await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .FirstOrDefaultAsync(p => p.PaymentId == id)
                ?? throw AppException.NotFound($"Payment #{id}");

            if (!Enum.TryParse<PaymentStatus>(dto.Status, true, out var status))
                throw new AppException($"PaymentStatus '{dto.Status}' không hợp lệ.");

            payment.Status = status;
            if (!string.IsNullOrWhiteSpace(dto.TransactionId)) payment.TransactionId = dto.TransactionId;
            if (dto.Notes != null) payment.Notes = dto.Notes;

            _context.Payments.Update(payment);

            var invoice = payment.Invoice;
            var completedPaid = await _context.Payments
                .Where(p => p.InvoiceId == invoice.InvoiceId && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            if (completedPaid >= invoice.TotalAmount)
                invoice.Status = InvoiceStatus.Paid;
            else
                invoice.Status = InvoiceStatus.Pending;

            _context.Invoices.Update(invoice);
            await _context.SaveChangesAsync();

            return Success(_mapper.Map<PaymentDto>(payment), "Cập nhật trạng thái thanh toán thành công.");
        }
    }
}

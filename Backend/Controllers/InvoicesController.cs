using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Invoice;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Invoices Controller — Quản lý Hóa đơn và xem chi tiết thanh toán của khách
    /// Ghi chú: Việc tạo hóa đơn và thanh toán được tự động xử lý trong luồng Check-out của Booking
    /// Guests có thể xem hóa đơn của booking của chính mình
    /// </summary>
    [Authorize]
    public class InvoicesController : BaseController
    {
        private readonly IInvoiceService _invoiceService;
        private readonly HotelDbContext _context;

        public InvoicesController(IInvoiceService invoiceService, HotelDbContext context)
        {
            _invoiceService = invoiceService;
            _context = context;
        }

        /// <summary>
        /// Xem chi tiết hóa đơn theo ID (Bao gồm danh sách các Payment đã trả)
        /// </summary>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), 200)]
        public async Task<IActionResult> GetById(long id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            return Success(invoice);
        }

        /// <summary>
        /// Lấy toàn bộ hóa đơn của một Booking cụ thể
        /// </summary>
        [HttpGet("booking/{bookingId:long}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<InvoiceDto>>), 200)]
        public async Task<IActionResult> GetByBooking(long bookingId)
        {
            var invoices = await _invoiceService.GetInvoicesByBookingAsync(bookingId);
            return Success(invoices);
        }

        /// <summary>
        /// Liệt kê phân trang toàn bộ hóa đơn trong hệ thống (Manager / Receptionist xem doanh thu/công nợ)
        /// </summary>
        [Authorize(Roles = "Admin,Manager,Receptionist")]
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<InvoiceDto>>), 200)]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _invoiceService.GetPagedInvoicesAsync(page, pageSize);
            return Success(result);
        }
    }
}

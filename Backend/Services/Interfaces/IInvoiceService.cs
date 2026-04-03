using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Invoice;
using HotelManagement.Models;

namespace HotelManagement.Services.Interfaces
{
    public interface IInvoiceService
    {
        Task<InvoiceDto> GetInvoiceByIdAsync(long invoiceId);
        Task<IEnumerable<InvoiceDto>> GetInvoicesByBookingAsync(long bookingId);
        Task<PagedResult<InvoiceDto>> GetPagedInvoicesAsync(int page, int pageSize);
        
        /// <summary>
        /// Tạo hóa đơn và thanh toán đi kèm trong quá trình Check-out
        /// Gọi và thực thi bên trong transaction của BookingService
        /// </summary>
        Task<Invoice> GenerateCheckoutInvoiceAsync(
            Booking booking, 
            decimal surcharges, 
            decimal taxAmount, 
            string paymentMethod, 
            decimal amountPaid, 
            string? notes);
    }
}

using HotelManagement.Models;

namespace HotelManagement.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<Payment> CreateCheckoutPaymentAsync(
            Invoice invoice,
            string paymentMethod,
            decimal amountPaid,
            string? notes);

        Task<IEnumerable<Payment>> GetByInvoiceAsync(long invoiceId);

        Task<IEnumerable<Payment>> GetPaymentHistoryAsync(DateTime from, DateTime to);
    }
}

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
    }
}

using HotelManagement.Data;
using HotelManagement.Enums;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;

namespace HotelManagement.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly HotelDbContext _context;

        public PaymentService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<Payment> CreateCheckoutPaymentAsync(
            Invoice invoice,
            string paymentMethod,
            decimal amountPaid,
            string? notes)
        {
            if (!Enum.TryParse<PaymentMethod>(paymentMethod, true, out var method))
            {
                method = PaymentMethod.Cash;
            }

            var payment = new Payment
            {
                InvoiceId = invoice.InvoiceId,
                Amount = amountPaid >= invoice.TotalAmount ? invoice.TotalAmount : amountPaid,
                PaymentMethod = method,
                PaymentDate = DateTime.UtcNow,
                TransactionId = $"TXN-{invoice.InvoiceId}-{DateTime.UtcNow.Ticks}",
                Status = PaymentStatus.Completed,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Payments.AddAsync(payment);
            await _context.SaveChangesAsync();

            return payment;
        }
    }
}

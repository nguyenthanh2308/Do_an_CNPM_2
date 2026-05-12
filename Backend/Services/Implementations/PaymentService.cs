using HotelManagement.Data;
using HotelManagement.Enums;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly HotelDbContext _context;

        public PaymentService(HotelDbContext context)
        {
            _context = context;
        }

        // ═══════════════════════════════════════════════════════════════════
        // TẠO THANH TOÁN KHI CHECK-OUT
        // ═══════════════════════════════════════════════════════════════════
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

        // ═══════════════════════════════════════════════════════════════════
        // LẤY PAYMENTS THEO HÓA ĐƠN
        // ═══════════════════════════════════════════════════════════════════
        public async Task<IEnumerable<Payment>> GetByInvoiceAsync(long invoiceId)
        {
            return await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .Where(p => p.InvoiceId == invoiceId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }

        // ═══════════════════════════════════════════════════════════════════
        // LỊCH SỬ THANH TOÁN THEO KHOẢNG THỜI GIAN
        // ═══════════════════════════════════════════════════════════════════
        public async Task<IEnumerable<Payment>> GetPaymentHistoryAsync(DateTime from, DateTime to)
        {
            return await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Booking)
                        .ThenInclude(b => b.Guest)
                .Where(p => p.PaymentDate >= from && p.PaymentDate <= to)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();
        }
    }
}

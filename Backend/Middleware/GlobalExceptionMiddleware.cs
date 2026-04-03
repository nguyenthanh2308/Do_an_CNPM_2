using HotelManagement.DTOs.Common;
using HotelManagement.Exceptions;
using System.Net;
using System.Text.Json;

namespace HotelManagement.Middleware
{
    /// <summary>
    /// Middleware xử lý tập trung tất cả exception — tránh try/catch lặp lại trong Controller
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (AppException ex)
            {
                // Lỗi nghiệp vụ — đã được kiểm soát
                _logger.LogWarning("AppException [{StatusCode}]: {Message}", ex.StatusCode, ex.Message);
                await WriteResponseAsync(context, ex.StatusCode, ex.Errors);
            }
            catch (FluentValidation.ValidationException ex)
            {
                // FluentValidation throws trực tiếp (nếu dùng AddValidatorsFromAssembly behavior)
                var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
                _logger.LogWarning("ValidationException: {@Errors}", errors);
                await WriteResponseAsync(context, 422, errors);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("UnauthorizedAccessException: {Message}", ex.Message);
                await WriteResponseAsync(context, 401, new List<string> { "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn." });
            }
            catch (Exception ex)
            {
                // Lỗi không mong đợi — log đầy đủ stack trace
                _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
                await WriteResponseAsync(context, 500,
                    new List<string> { "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
            }
        }

        private static async Task WriteResponseAsync(HttpContext context, int statusCode, List<string> errors)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = ApiResponse<object>.Fail(errors);
            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }

    // Extension method để đăng ký dễ dàng trong Program.cs
    public static class GlobalExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
            => app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}

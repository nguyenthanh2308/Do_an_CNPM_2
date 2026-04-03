using HotelManagement.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    /// <summary>
    /// Base controller — chuẩn hóa response format cho toàn bộ API
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public abstract class BaseController : ControllerBase
    {
        protected IActionResult Success<T>(T data, string? message = null)
            => Ok(ApiResponse<T>.Ok(data, message));

        protected IActionResult Created<T>(T data, string? message = "Tạo thành công.")
            => StatusCode(201, ApiResponse<T>.Ok(data, message));

        protected IActionResult Fail(string error, int statusCode = 400)
            => StatusCode(statusCode, ApiResponse<object>.Fail(error));

        protected IActionResult Fail(List<string> errors, int statusCode = 422)
            => StatusCode(statusCode, ApiResponse<object>.Fail(errors));

        /// <summary>Lấy UserId từ JWT claims</summary>
        protected long? GetCurrentUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "userId");
            return claim != null && long.TryParse(claim.Value, out var id) ? id : null;
        }

        /// <summary>Lấy Role từ JWT claims</summary>
        protected string? GetCurrentUserRole()
            => User.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
    }
}

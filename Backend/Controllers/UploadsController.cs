using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    [Authorize(Roles = "Admin,Manager")]
    public class UploadsController : BaseController
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        [HttpPost("image")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return Fail("Vui long chon file anh hop le.");

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
                return Fail("Dinh dang anh khong duoc ho tro. Chi chap nhan: .jpg, .jpeg, .png, .webp, .gif");

            if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return Fail("File tai len phai la anh.");

            var folderSegment = DateTime.UtcNow.ToString("yyyyMM");
            var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", folderSegment);
            Directory.CreateDirectory(uploadDir);

            var safeFileName = $"{Guid.NewGuid():N}{extension}";
            var physicalPath = Path.Combine(uploadDir, safeFileName);

            await using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var publicUrl = $"{Request.Scheme}://{Request.Host}/uploads/{folderSegment}/{safeFileName}";
            return Success(new
            {
                url = publicUrl,
                fileName = safeFileName,
                contentType = file.ContentType,
                size = file.Length
            }, "Tai anh thanh cong.");
        }
    }
}

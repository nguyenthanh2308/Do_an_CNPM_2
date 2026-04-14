using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Hotel;

namespace HotelManagement.Services.Interfaces
{
    /// <summary>
    /// IHotelService — Quản lý khách sạn
    /// </summary>
    public interface IHotelService
    {
        /// <summary>Lấy danh sách khách sạn (phân trang)</summary>
        Task<PagedResult<HotelDto>> GetPagedHotelsAsync(int page = 1, int pageSize = 20);

        /// <summary>Lấy chi tiết khách sạn theo ID</summary>
        Task<HotelDto> GetHotelByIdAsync(long hotelId);

        /// <summary>Lấy tất cả khách sạn (không phân trang)</summary>
        Task<IEnumerable<HotelDto>> GetAllHotelsAsync();

        /// <summary>Tạo khách sạn mới</summary>
        Task<HotelDto> CreateHotelAsync(CreateHotelDto dto);

        /// <summary>Cập nhật khách sạn</summary>
        Task<HotelDto> UpdateHotelAsync(long hotelId, UpdateHotelDto dto);

        /// <summary>Xoá khách sạn (soft delete)</summary>
        Task DeleteHotelAsync(long hotelId);
    }
}

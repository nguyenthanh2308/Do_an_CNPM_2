using HotelManagement.DTOs.RoomType;

namespace HotelManagement.Services.Interfaces
{
    public interface IRoomTypeService
    {
        Task<(List<RoomTypeDto> Data, int Total)> GetPagedRoomTypesAsync(int pageIndex = 0, int pageSize = 10);
        Task<List<RoomTypeDto>> GetAllRoomTypesAsync();
        Task<RoomTypeDto?> GetRoomTypeByIdAsync(long id);
        Task<List<RoomTypeDto>> GetRoomTypesByHotelAsync(long hotelId);
        Task<RoomTypeDto> CreateRoomTypeAsync(CreateRoomTypeDto dto);
        Task<RoomTypeDto?> UpdateRoomTypeAsync(long id, UpdateRoomTypeDto dto);
        Task<bool> DeleteRoomTypeAsync(long id);
    }
}

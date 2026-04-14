using HotelManagement.Data;
using HotelManagement.DTOs.RoomType;
using HotelManagement.Enums;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations
{
    public class RoomTypeService : IRoomTypeService
    {
        private readonly HotelDbContext _context;

        public RoomTypeService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<(List<RoomTypeDto> Data, int Total)> GetPagedRoomTypesAsync(int pageIndex = 0, int pageSize = 10)
        {
            var total = await _context.RoomTypes.Where(rt => rt.IsActive).CountAsync();
            var roomTypes = await _context.RoomTypes
                .Where(rt => rt.IsActive)
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .OrderByDescending(rt => rt.CreatedAt)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dtos = roomTypes.Select(MapToDto).ToList();
            return (dtos, total);
        }

        public async Task<List<RoomTypeDto>> GetAllRoomTypesAsync()
        {
            var roomTypes = await _context.RoomTypes
                .Where(rt => rt.IsActive)
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .OrderBy(rt => rt.Name)
                .ToListAsync();

            return roomTypes.Select(MapToDto).ToList();
        }

        public async Task<RoomTypeDto?> GetRoomTypeByIdAsync(long id)
        {
            var roomType = await _context.RoomTypes
                .Where(rt => rt.IsActive && rt.RoomTypeId == id)
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .FirstOrDefaultAsync();

            return roomType != null ? MapToDto(roomType) : null;
        }

        public async Task<List<RoomTypeDto>> GetRoomTypesByHotelAsync(long hotelId)
        {
            var roomTypes = await _context.RoomTypes
                .Where(rt => rt.IsActive && rt.HotelId == hotelId)
                .Include(rt => rt.Hotel)
                .Include(rt => rt.Rooms)
                .OrderBy(rt => rt.Name)
                .ToListAsync();

            return roomTypes.Select(MapToDto).ToList();
        }

        public async Task<RoomTypeDto> CreateRoomTypeAsync(CreateRoomTypeDto dto)
        {
            // Verify hotel exists
            var hotel = await _context.Hotels.FindAsync(dto.HotelId);
            if (hotel == null || !hotel.IsActive)
                throw new InvalidOperationException("Khách sạn không tồn tại.");

            // Check name uniqueness per hotel
            var exists = await _context.RoomTypes
                .AnyAsync(rt => rt.HotelId == dto.HotelId && rt.Name == dto.Name && rt.IsActive);
            if (exists)
                throw new InvalidOperationException($"Loại phòng '{dto.Name}' đã tồn tại ở khách sạn này.");

            var roomType = new RoomType
            {
                HotelId = dto.HotelId,
                Name = dto.Name,
                Description = dto.Description,
                MaxOccupancy = dto.MaxOccupancy,
                BasePrice = dto.BasePrice,
                ThumbnailUrl = dto.ThumbnailUrl,
                AreaSqm = dto.AreaSqm,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();
            roomType.Hotel = hotel;
            return MapToDto(roomType);
        }

        public async Task<RoomTypeDto?> UpdateRoomTypeAsync(long id, UpdateRoomTypeDto dto)
        {
            var roomType = await _context.RoomTypes
                .Include(rt => rt.Hotel)
                .FirstOrDefaultAsync(rt => rt.RoomTypeId == id && rt.IsActive);
            
            if (roomType == null)
                return null;

            // Check name uniqueness if changing name
            if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name != roomType.Name)
            {
                var exists = await _context.RoomTypes
                    .AnyAsync(rt => rt.HotelId == roomType.HotelId && rt.Name == dto.Name && rt.IsActive && rt.RoomTypeId != id);
                if (exists)
                    throw new InvalidOperationException($"Loại phòng '{dto.Name}' đã tồn tại ở khách sạn này.");
            }

            if (!string.IsNullOrWhiteSpace(dto.Name))
                roomType.Name = dto.Name;
            if (dto.Description != null)
                roomType.Description = dto.Description;
            if (dto.MaxOccupancy.HasValue)
                roomType.MaxOccupancy = dto.MaxOccupancy.Value;
            if (dto.BasePrice.HasValue)
                roomType.BasePrice = dto.BasePrice.Value;
            if (dto.ThumbnailUrl != null)
                roomType.ThumbnailUrl = dto.ThumbnailUrl;
            if (dto.AreaSqm.HasValue)
                roomType.AreaSqm = dto.AreaSqm.Value;

            await _context.SaveChangesAsync();
            await _context.Entry(roomType).Collection(rt => rt.Rooms).LoadAsync();
            return MapToDto(roomType);
        }

        public async Task<bool> DeleteRoomTypeAsync(long id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null || !roomType.IsActive)
                return false;

            roomType.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        private RoomTypeDto MapToDto(RoomType roomType)
        {
            return new RoomTypeDto
            {
                RoomTypeId = roomType.RoomTypeId,
                HotelId = roomType.HotelId,
                HotelName = roomType.Hotel?.Name ?? "N/A",
                Name = roomType.Name,
                Description = roomType.Description,
                MaxOccupancy = roomType.MaxOccupancy,
                BasePrice = roomType.BasePrice,
                ThumbnailUrl = roomType.ThumbnailUrl,
                AreaSqm = roomType.AreaSqm,
                IsActive = roomType.IsActive,
                TotalRooms = roomType.Rooms?.Count ?? 0,
                AvailableRooms = roomType.Rooms?.Count(r => r.Status == RoomStatus.Available) ?? 0,
                Amenities = new() // populated separately if needed
            };
        }
    }
}

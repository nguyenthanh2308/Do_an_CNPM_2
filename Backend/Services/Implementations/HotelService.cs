using AutoMapper;
using HotelManagement.Data;
using HotelManagement.DTOs.Common;
using HotelManagement.DTOs.Hotel;
using HotelManagement.Exceptions;
using HotelManagement.Models;
using HotelManagement.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace HotelManagement.Services.Implementations
{
    public class HotelService : IHotelService
    {
        private readonly HotelDbContext _context;
        private readonly IMapper _mapper;

        public HotelService(HotelDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PagedResult<HotelDto>> GetPagedHotelsAsync(int page = 1, int pageSize = 20)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 5, 100);

            var query = _context.Hotels
                .Include(h => h.Rooms)
                .AsQueryable();

            int totalCount = await query.CountAsync();

            var hotels = await query
                .OrderBy(h => h.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<HotelDto>
            {
                Data = _mapper.Map<List<HotelDto>>(hotels),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            };
        }

        public async Task<HotelDto> GetHotelByIdAsync(long hotelId)
        {
            var hotel = await _context.Hotels
                .Include(h => h.Rooms)
                .Include(h => h.RoomTypes)
                .FirstOrDefaultAsync(h => h.HotelId == hotelId)
                ?? throw AppException.NotFound($"Khách sạn #{hotelId}");

            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task<IEnumerable<HotelDto>> GetAllHotelsAsync()
        {
            var hotels = await _context.Hotels
                .Include(h => h.Rooms)
                .OrderBy(h => h.Name)
                .ToListAsync();

            return _mapper.Map<IEnumerable<HotelDto>>(hotels);
        }

        public async Task<HotelDto> CreateHotelAsync(CreateHotelDto dto)
        {
            // Check if hotel name already exists
            var existingHotel = await _context.Hotels
                .FirstOrDefaultAsync(h => h.Name == dto.Name);
            
            if (existingHotel != null)
                throw new AppException($"Khách sạn '{dto.Name}' đã tồn tại.", 409);

            var hotel = new Hotel
            {
                Name = dto.Name,
                Address = dto.Address,
                Phone = dto.Phone,
                Email = dto.Email,
                Description = dto.Description,
                StarRating = dto.StarRating,
                ThumbnailUrl = dto.ThumbnailUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Hotels.AddAsync(hotel);
            await _context.SaveChangesAsync();

            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task<HotelDto> UpdateHotelAsync(long hotelId, UpdateHotelDto dto)
        {
            var hotel = await _context.Hotels
                .Include(h => h.Rooms)
                .FirstOrDefaultAsync(h => h.HotelId == hotelId)
                ?? throw AppException.NotFound($"Khách sạn #{hotelId}");

            // Check if name is being changed and if already exists
            if (!string.IsNullOrEmpty(dto.Name) && dto.Name != hotel.Name)
            {
                var existingHotel = await _context.Hotels
                    .FirstOrDefaultAsync(h => h.Name == dto.Name && h.HotelId != hotelId);
                
                if (existingHotel != null)
                    throw new AppException($"Khách sạn '{dto.Name}' đã tồn tại.", 409);
                
                hotel.Name = dto.Name;
            }

            if (!string.IsNullOrEmpty(dto.Address)) hotel.Address = dto.Address;
            if (!string.IsNullOrEmpty(dto.Phone)) hotel.Phone = dto.Phone;
            if (!string.IsNullOrEmpty(dto.Email)) hotel.Email = dto.Email;
            if (!string.IsNullOrEmpty(dto.Description)) hotel.Description = dto.Description;
            if (dto.StarRating.HasValue) hotel.StarRating = dto.StarRating.Value;
            if (!string.IsNullOrEmpty(dto.ThumbnailUrl)) hotel.ThumbnailUrl = dto.ThumbnailUrl;
            if (dto.IsActive.HasValue) hotel.IsActive = dto.IsActive.Value;

            _context.Hotels.Update(hotel);
            await _context.SaveChangesAsync();

            return _mapper.Map<HotelDto>(hotel);
        }

        public async Task DeleteHotelAsync(long hotelId)
        {
            var hotel = await _context.Hotels
                .FirstOrDefaultAsync(h => h.HotelId == hotelId)
                ?? throw AppException.NotFound($"Khách sạn #{hotelId}");

            // Soft delete - đánh dấu IsActive = false
            hotel.IsActive = false;
            _context.Hotels.Update(hotel);
            await _context.SaveChangesAsync();
        }
    }
}

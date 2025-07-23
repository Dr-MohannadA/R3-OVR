using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OVRSystem.API.Data;
using OVRSystem.API.DTOs;

namespace OVRSystem.API.Services;

public class FacilityService : IFacilityService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public FacilityService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<FacilityDto>> GetFacilitiesAsync()
    {
        var facilities = await _context.Facilities
            .Where(f => f.IsActive)
            .OrderBy(f => f.NameEn)
            .ToListAsync();

        return _mapper.Map<IEnumerable<FacilityDto>>(facilities);
    }

    public async Task<FacilityDto?> GetFacilityByIdAsync(int id)
    {
        var facility = await _context.Facilities.FindAsync(id);
        return facility != null ? _mapper.Map<FacilityDto>(facility) : null;
    }
}
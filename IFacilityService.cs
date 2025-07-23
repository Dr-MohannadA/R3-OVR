using OVRSystem.API.DTOs;

namespace OVRSystem.API.Services;

public interface IFacilityService
{
    Task<IEnumerable<FacilityDto>> GetFacilitiesAsync();
    Task<FacilityDto?> GetFacilityByIdAsync(int id);
}
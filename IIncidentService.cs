using OVRSystem.API.DTOs;

namespace OVRSystem.API.Services;

public interface IIncidentService
{
    Task<IEnumerable<IncidentDto>> GetIncidentsAsync(string? userId = null, int? facilityId = null, string? status = null, DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<IncidentDto?> GetIncidentByIdAsync(int id);
    Task<IncidentDto> CreateIncidentAsync(CreateIncidentDto createDto, string? userId = null);
    Task<IncidentDto?> UpdateIncidentAsync(int id, UpdateIncidentDto updateDto, string userId);
    Task<bool> DeleteIncidentAsync(int id, string userId);
    Task<bool> UpdateIncidentStatusAsync(int id, string status, string userId, string? reason = null);
    Task<bool> ApproveClosureAsync(int id, string userId);
    Task<bool> RejectClosureAsync(int id, string userId, string reason);
    Task<string> GenerateOvrIdAsync();
}
using OVRSystem.API.DTOs;

namespace OVRSystem.API.Services;

public interface ICommentService
{
    Task<IEnumerable<IncidentCommentDto>> GetCommentsAsync(int incidentId);
    Task<IncidentCommentDto> AddCommentAsync(int incidentId, CreateCommentDto commentDto, string userId);
}
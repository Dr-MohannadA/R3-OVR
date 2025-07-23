using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OVRSystem.API.Data;
using OVRSystem.API.DTOs;
using OVRSystem.API.Models;

namespace OVRSystem.API.Services;

public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditService _auditService;

    public CommentService(ApplicationDbContext context, IMapper mapper, IAuditService auditService)
    {
        _context = context;
        _mapper = mapper;
        _auditService = auditService;
    }

    public async Task<IEnumerable<IncidentCommentDto>> GetCommentsAsync(int incidentId)
    {
        var comments = await _context.IncidentComments
            .Include(c => c.User)
                .ThenInclude(u => u!.Facility)
            .Where(c => c.IncidentId == incidentId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<IncidentCommentDto>>(comments);
    }

    public async Task<IncidentCommentDto> AddCommentAsync(int incidentId, CreateCommentDto commentDto, string userId)
    {
        var comment = new IncidentComment
        {
            IncidentId = incidentId,
            UserId = userId,
            Content = commentDto.Content,
            CommentType = commentDto.CommentType,
            CreatedAt = DateTime.UtcNow
        };

        _context.IncidentComments.Add(comment);
        await _context.SaveChangesAsync();

        // Reload with includes
        comment = await _context.IncidentComments
            .Include(c => c.User)
                .ThenInclude(u => u!.Facility)
            .FirstOrDefaultAsync(c => c.Id == comment.Id);

        await _auditService.LogAsync("IncidentComment", comment!.Id.ToString(), "CREATE", userId);

        return _mapper.Map<IncidentCommentDto>(comment!);
    }
}
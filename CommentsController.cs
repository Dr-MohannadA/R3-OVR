using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OVRSystem.API.DTOs;
using OVRSystem.API.Services;
using System.Security.Claims;

namespace OVRSystem.API.Controllers;

[ApiController]
[Route("api/incidents/{incidentId}/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentCommentDto>>> GetComments(int incidentId)
    {
        var comments = await _commentService.GetCommentsAsync(incidentId);
        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<IncidentCommentDto>> AddComment(int incidentId, [FromBody] CreateCommentDto commentDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var comment = await _commentService.AddCommentAsync(incidentId, commentDto, userId);
        return Ok(comment);
    }
}
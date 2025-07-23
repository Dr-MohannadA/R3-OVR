using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OVRSystem.API.DTOs;
using OVRSystem.API.Services;
using System.Security.Claims;

namespace OVRSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<IncidentDto>>> GetIncidents(
        [FromQuery] string? status = null,
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var facilityId = User.FindFirst("facilityId")?.Value;

        int? userFacilityId = null;
        if (userRole != "admin" && !string.IsNullOrEmpty(facilityId))
        {
            userFacilityId = int.Parse(facilityId);
        }

        var incidents = await _incidentService.GetIncidentsAsync(userId, userFacilityId, status, dateFrom, dateTo);
        return Ok(incidents);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<IncidentDto>> GetIncident(int id)
    {
        var incident = await _incidentService.GetIncidentByIdAsync(id);
        if (incident == null)
        {
            return NotFound();
        }

        // Check facility access for non-admin users
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var facilityId = User.FindFirst("facilityId")?.Value;
        
        if (userRole != "admin" && !string.IsNullOrEmpty(facilityId))
        {
            var userFacilityId = int.Parse(facilityId);
            if (incident.FacilityId != userFacilityId)
            {
                return Forbid();
            }
        }

        return Ok(incident);
    }

    [HttpPost]
    public async Task<ActionResult<IncidentDto>> CreateIncident([FromBody] CreateIncidentDto createDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var incident = await _incidentService.CreateIncidentAsync(createDto, userId);
        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
    }

    [HttpPatch("{id}")]
    [Authorize]
    public async Task<ActionResult<IncidentDto>> UpdateIncident(int id, [FromBody] UpdateIncidentDto updateDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var incident = await _incidentService.UpdateIncidentAsync(id, updateDto, userId);
        
        if (incident == null)
        {
            return NotFound();
        }

        return Ok(incident);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> DeleteIncident(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _incidentService.DeleteIncidentAsync(id, userId);
        
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id}/status")]
    [Authorize]
    public async Task<ActionResult> UpdateIncidentStatus(int id, [FromBody] UpdateStatusDto statusDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _incidentService.UpdateIncidentStatusAsync(id, statusDto.Status, userId, statusDto.Reason);
        
        if (!result)
        {
            return NotFound();
        }

        return Ok();
    }

    [HttpPost("{id}/approve-closure")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> ApproveClosure(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _incidentService.ApproveClosureAsync(id, userId);
        
        if (!result)
        {
            return NotFound();
        }

        return Ok();
    }

    [HttpPost("{id}/reject-closure")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult> RejectClosure(int id, [FromBody] RejectClosureDto rejectDto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _incidentService.RejectClosureAsync(id, userId, rejectDto.Reason);
        
        if (!result)
        {
            return NotFound();
        }

        return Ok();
    }
}

public class UpdateStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

public class RejectClosureDto
{
    public string Reason { get; set; } = string.Empty;
}
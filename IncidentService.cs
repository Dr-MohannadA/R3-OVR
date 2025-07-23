using AutoMapper;
using Microsoft.EntityFrameworkCore;
using OVRSystem.API.Data;
using OVRSystem.API.DTOs;
using OVRSystem.API.Models;

namespace OVRSystem.API.Services;

public class IncidentService : IIncidentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditService _auditService;

    public IncidentService(ApplicationDbContext context, IMapper mapper, IAuditService auditService)
    {
        _context = context;
        _mapper = mapper;
        _auditService = auditService;
    }

    public async Task<IEnumerable<IncidentDto>> GetIncidentsAsync(string? userId = null, int? facilityId = null, string? status = null, DateTime? dateFrom = null, DateTime? dateTo = null)
    {
        var query = _context.Incidents
            .Include(i => i.Facility)
            .Include(i => i.SubmittedByUser)
            .Include(i => i.ClosedByUser)
            .AsQueryable();

        // Apply facility filter for non-admin users
        if (facilityId.HasValue)
        {
            query = query.Where(i => i.FacilityId == facilityId.Value);
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(i => i.Status == status);
        }

        // Apply date range filter
        if (dateFrom.HasValue)
        {
            query = query.Where(i => i.IncidentDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(i => i.IncidentDate <= dateTo.Value);
        }

        var incidents = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<IncidentDto>>(incidents);
    }

    public async Task<IncidentDto?> GetIncidentByIdAsync(int id)
    {
        var incident = await _context.Incidents
            .Include(i => i.Facility)
            .Include(i => i.SubmittedByUser)
            .Include(i => i.ClosedByUser)
            .Include(i => i.Comments)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(i => i.Id == id);

        return incident != null ? _mapper.Map<IncidentDto>(incident) : null;
    }

    public async Task<IncidentDto> CreateIncidentAsync(CreateIncidentDto createDto, string? userId = null)
    {
        var incident = _mapper.Map<Incident>(createDto);
        incident.OvrId = await GenerateOvrIdAsync();
        incident.SubmittedBy = userId;
        incident.CreatedAt = DateTime.UtcNow;
        incident.UpdatedAt = DateTime.UtcNow;

        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();

        // Reload with includes
        incident = await _context.Incidents
            .Include(i => i.Facility)
            .Include(i => i.SubmittedByUser)
            .FirstOrDefaultAsync(i => i.Id == incident.Id);

        // Log audit
        await _auditService.LogAsync("Incident", incident!.Id.ToString(), "CREATE", userId, incident.ReporterEmail);

        return _mapper.Map<IncidentDto>(incident!);
    }

    public async Task<IncidentDto?> UpdateIncidentAsync(int id, UpdateIncidentDto updateDto, string userId)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null) return null;

        var oldValues = new { incident.OvrCategory, incident.WhatBeingReported, incident.Status, incident.Severity, incident.Priority, incident.IsFlagged };

        // Update only provided fields
        if (!string.IsNullOrEmpty(updateDto.OvrCategory))
            incident.OvrCategory = updateDto.OvrCategory;
        
        if (!string.IsNullOrEmpty(updateDto.WhatBeingReported))
            incident.WhatBeingReported = updateDto.WhatBeingReported;
        
        if (!string.IsNullOrEmpty(updateDto.Status))
            incident.Status = updateDto.Status;
        
        if (!string.IsNullOrEmpty(updateDto.Severity))
            incident.Severity = updateDto.Severity;
        
        if (!string.IsNullOrEmpty(updateDto.Priority))
            incident.Priority = updateDto.Priority;
        
        if (updateDto.IsFlagged.HasValue)
            incident.IsFlagged = updateDto.IsFlagged.Value;

        if (!string.IsNullOrEmpty(updateDto.ClosureReason))
            incident.ClosureReason = updateDto.ClosureReason;
        
        if (!string.IsNullOrEmpty(updateDto.ClosureComments))
            incident.ClosureComments = updateDto.ClosureComments;

        incident.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Log audit with changes
        var changes = System.Text.Json.JsonSerializer.Serialize(new { OldValues = oldValues, NewValues = updateDto });
        await _auditService.LogAsync("Incident", incident.Id.ToString(), "UPDATE", userId, null, changes);

        // Reload with includes
        incident = await _context.Incidents
            .Include(i => i.Facility)
            .Include(i => i.SubmittedByUser)
            .Include(i => i.ClosedByUser)
            .FirstOrDefaultAsync(i => i.Id == id);

        return _mapper.Map<IncidentDto>(incident!);
    }

    public async Task<bool> DeleteIncidentAsync(int id, string userId)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null) return false;

        _context.Incidents.Remove(incident);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("Incident", incident.Id.ToString(), "DELETE", userId);

        return true;
    }

    public async Task<bool> UpdateIncidentStatusAsync(int id, string status, string userId, string? reason = null)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null) return false;

        var oldStatus = incident.Status;
        incident.Status = status;
        incident.UpdatedAt = DateTime.UtcNow;

        if (status == "closed")
        {
            incident.ClosedAt = DateTime.UtcNow;
            incident.ClosedBy = userId;
            if (!string.IsNullOrEmpty(reason))
                incident.ClosureReason = reason;
        }

        await _context.SaveChangesAsync();

        var changes = System.Text.Json.JsonSerializer.Serialize(new { OldStatus = oldStatus, NewStatus = status, Reason = reason });
        await _auditService.LogAsync("Incident", incident.Id.ToString(), "STATUS_CHANGE", userId, null, changes);

        return true;
    }

    public async Task<bool> ApproveClosureAsync(int id, string userId)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null || incident.Status != "pending_closure") return false;

        incident.Status = "closed";
        incident.ClosedAt = DateTime.UtcNow;
        incident.ClosedBy = userId;
        incident.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditService.LogAsync("Incident", incident.Id.ToString(), "CLOSURE_APPROVED", userId);

        return true;
    }

    public async Task<bool> RejectClosureAsync(int id, string userId, string reason)
    {
        var incident = await _context.Incidents.FindAsync(id);
        if (incident == null || incident.Status != "pending_closure") return false;

        incident.Status = "open";
        incident.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var changes = System.Text.Json.JsonSerializer.Serialize(new { Reason = reason });
        await _auditService.LogAsync("Incident", incident.Id.ToString(), "CLOSURE_REJECTED", userId, null, changes);

        return true;
    }

    public async Task<string> GenerateOvrIdAsync()
    {
        var date = DateTime.Now;
        var year = date.Year.ToString().Substring(2); // Last 2 digits of year
        var month = date.Month.ToString("D2");
        
        // Get the count of incidents for this month
        var startOfMonth = new DateTime(date.Year, date.Month, 1);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);
        
        var count = await _context.Incidents
            .Where(i => i.CreatedAt >= startOfMonth && i.CreatedAt <= endOfMonth)
            .CountAsync();
        
        var sequence = (count + 1).ToString("D4");
        
        return $"OVR-{year}{month}-{sequence}";
    }
}
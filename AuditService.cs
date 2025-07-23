using OVRSystem.API.Data;
using OVRSystem.API.Models;

namespace OVRSystem.API.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;

    public AuditService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(string entityType, string entityId, string action, string? userId = null, string? userEmail = null, string? changes = null, string? ipAddress = null, string? userAgent = null)
    {
        var auditLog = new AuditLog
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            UserId = userId,
            UserEmail = userEmail,
            Changes = changes,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }
}
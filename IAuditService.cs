namespace OVRSystem.API.Services;

public interface IAuditService
{
    Task LogAsync(string entityType, string entityId, string action, string? userId = null, string? userEmail = null, string? changes = null, string? ipAddress = null, string? userAgent = null);
}
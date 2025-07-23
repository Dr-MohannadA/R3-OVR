using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class AuditLog
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string EntityId { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;
    
    public string? UserId { get; set; }
    public virtual ApplicationUser? User { get; set; }
    
    [MaxLength(256)]
    public string? UserEmail { get; set; }
    
    public string? Changes { get; set; }
    
    [MaxLength(45)]
    public string? IpAddress { get; set; }
    
    [MaxLength(500)]
    public string? UserAgent { get; set; }
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class ApplicationUser : IdentityUser
{
    [MaxLength(100)]
    public string? FirstName { get; set; }
    
    [MaxLength(100)]
    public string? LastName { get; set; }
    
    [MaxLength(50)]
    public string Role { get; set; } = "user";
    
    public int? FacilityId { get; set; }
    public virtual Facility? Facility { get; set; }
    
    [MaxLength(500)]
    public string? ProfileImageUrl { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsApproved { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<Incident> SubmittedIncidents { get; set; } = new List<Incident>();
    public virtual ICollection<Incident> ClosedIncidents { get; set; } = new List<Incident>();
    public virtual ICollection<IncidentComment> Comments { get; set; } = new List<IncidentComment>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public virtual ICollection<UserRegistration> ReviewedRegistrations { get; set; } = new List<UserRegistration>();
}
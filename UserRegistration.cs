using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class UserRegistration
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    
    public int FacilityId { get; set; }
    public virtual Facility Facility { get; set; } = null!;
    
    [MaxLength(50)]
    public string Status { get; set; } = "pending";
    
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReviewedAt { get; set; }
    
    public string? ReviewedBy { get; set; }
    public virtual ApplicationUser? ReviewedByUser { get; set; }
    
    [MaxLength(1000)]
    public string? ReviewComments { get; set; }
}
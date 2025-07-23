using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class Facility
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string NameEn { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string NameAr { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();
    public virtual ICollection<Incident> Incidents { get; set; } = new List<Incident>();
    public virtual ICollection<UserRegistration> UserRegistrations { get; set; } = new List<UserRegistration>();
}
using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class IncidentComment
{
    public int Id { get; set; }
    
    public int IncidentId { get; set; }
    public virtual Incident Incident { get; set; } = null!;
    
    [Required]
    public string UserId { get; set; } = string.Empty;
    public virtual ApplicationUser User { get; set; } = null!;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string CommentType { get; set; } = "comment";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
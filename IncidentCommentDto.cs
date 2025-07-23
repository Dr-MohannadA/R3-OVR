namespace OVRSystem.API.DTOs;

public class IncidentCommentDto
{
    public int Id { get; set; }
    public int IncidentId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public UserDto? User { get; set; }
    public string Content { get; set; } = string.Empty;
    public string CommentType { get; set; } = "comment";
    public DateTime CreatedAt { get; set; }
}

public class CreateCommentDto
{
    public string Content { get; set; } = string.Empty;
    public string CommentType { get; set; } = "comment";
}
using System.ComponentModel.DataAnnotations;

namespace OVRSystem.API.Models;

public class Incident
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string OvrId { get; set; } = string.Empty;
    
    // Reporter Information
    [Required]
    [MaxLength(100)]
    public string ReporterFirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ReporterLastName { get; set; } = string.Empty;
    
    [MaxLength(256)]
    public string? ReporterEmail { get; set; }
    
    [MaxLength(50)]
    public string? ReporterPhone { get; set; }
    
    [MaxLength(200)]
    public string? ReporterJobTitle { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string ReporterDepartment { get; set; } = string.Empty;
    
    [MaxLength(100)]
    public string? ReporterEmployeeId { get; set; }
    
    // Facility Information
    public int FacilityId { get; set; }
    public virtual Facility Facility { get; set; } = null!;
    
    // Incident Basic Information
    public DateTime IncidentDate { get; set; }
    
    [MaxLength(10)]
    public string? IncidentTime { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string IncidentType { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string OvrCategory { get; set; } = string.Empty;
    
    [Required]
    public string WhatBeingReported { get; set; } = string.Empty;
    
    // Patient Information (optional)
    [MaxLength(100)]
    public string? PatientId { get; set; }
    
    public int? PatientAge { get; set; }
    
    [MaxLength(20)]
    public string? PatientGender { get; set; }
    
    [MaxLength(100)]
    public string? PatientNationality { get; set; }
    
    // Incident Details
    [MaxLength(255)]
    public string? IncidentLocation { get; set; }
    
    public bool WitnessesPresent { get; set; } = false;
    
    public string? WitnessNames { get; set; }
    
    [Required]
    public string IncidentDescription { get; set; } = string.Empty;
    
    public string? ImmediateActions { get; set; }
    
    // Contributing Factors
    public string? ContributingFactors { get; set; }
    
    public string? RootCauseAnalysis { get; set; }
    
    // Severity and Priority
    [MaxLength(50)]
    public string Severity { get; set; } = "medium";
    
    [MaxLength(50)]
    public string Priority { get; set; } = "medium";
    
    // Status and Workflow
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "open";
    
    public bool IsFlagged { get; set; } = false;
    
    // Closure Information
    public string? ClosureReason { get; set; }
    
    public string? ClosureComments { get; set; }
    
    public DateTime? ClosedAt { get; set; }
    
    public string? ClosedBy { get; set; }
    public virtual ApplicationUser? ClosedByUser { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public string? SubmittedBy { get; set; }
    public virtual ApplicationUser? SubmittedByUser { get; set; }
    
    // Navigation properties
    public virtual ICollection<IncidentComment> Comments { get; set; } = new List<IncidentComment>();
}
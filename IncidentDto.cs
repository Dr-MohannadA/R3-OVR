namespace OVRSystem.API.DTOs;

public class IncidentDto
{
    public int Id { get; set; }
    public string OvrId { get; set; } = string.Empty;
    
    // Reporter Information
    public string ReporterFirstName { get; set; } = string.Empty;
    public string ReporterLastName { get; set; } = string.Empty;
    public string? ReporterEmail { get; set; }
    public string? ReporterPhone { get; set; }
    public string? ReporterJobTitle { get; set; }
    public string ReporterDepartment { get; set; } = string.Empty;
    public string? ReporterEmployeeId { get; set; }
    
    // Facility Information
    public int FacilityId { get; set; }
    public FacilityDto? Facility { get; set; }
    
    // Incident Basic Information
    public DateTime IncidentDate { get; set; }
    public string? IncidentTime { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string OvrCategory { get; set; } = string.Empty;
    public string WhatBeingReported { get; set; } = string.Empty;
    
    // Patient Information
    public string? PatientId { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? PatientNationality { get; set; }
    
    // Incident Details
    public string? IncidentLocation { get; set; }
    public bool WitnessesPresent { get; set; }
    public string? WitnessNames { get; set; }
    public string IncidentDescription { get; set; } = string.Empty;
    public string? ImmediateActions { get; set; }
    
    // Contributing Factors
    public string? ContributingFactors { get; set; }
    public string? RootCauseAnalysis { get; set; }
    
    // Severity and Priority
    public string Severity { get; set; } = "medium";
    public string Priority { get; set; } = "medium";
    
    // Status and Workflow
    public string Status { get; set; } = "open";
    public bool IsFlagged { get; set; }
    
    // Closure Information
    public string? ClosureReason { get; set; }
    public string? ClosureComments { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ClosedBy { get; set; }
    
    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? SubmittedBy { get; set; }
    
    // Navigation properties
    public List<IncidentCommentDto> Comments { get; set; } = new();
}

public class CreateIncidentDto
{
    // Reporter Information
    public string ReporterFirstName { get; set; } = string.Empty;
    public string ReporterLastName { get; set; } = string.Empty;
    public string? ReporterEmail { get; set; }
    public string? ReporterPhone { get; set; }
    public string? ReporterJobTitle { get; set; }
    public string ReporterDepartment { get; set; } = string.Empty;
    public string? ReporterEmployeeId { get; set; }
    
    // Facility Information
    public int FacilityId { get; set; }
    
    // Incident Basic Information
    public DateTime IncidentDate { get; set; }
    public string? IncidentTime { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string OvrCategory { get; set; } = string.Empty;
    public string WhatBeingReported { get; set; } = string.Empty;
    
    // Patient Information
    public string? PatientId { get; set; }
    public int? PatientAge { get; set; }
    public string? PatientGender { get; set; }
    public string? PatientNationality { get; set; }
    
    // Incident Details
    public string? IncidentLocation { get; set; }
    public bool WitnessesPresent { get; set; }
    public string? WitnessNames { get; set; }
    public string IncidentDescription { get; set; } = string.Empty;
    public string? ImmediateActions { get; set; }
    
    // Contributing Factors
    public string? ContributingFactors { get; set; }
    public string? RootCauseAnalysis { get; set; }
    
    // Severity and Priority
    public string Severity { get; set; } = "medium";
    public string Priority { get; set; } = "medium";
}

public class UpdateIncidentDto
{
    public string? OvrCategory { get; set; }
    public string? WhatBeingReported { get; set; }
    public string? Status { get; set; }
    public string? Severity { get; set; }
    public string? Priority { get; set; }
    public bool? IsFlagged { get; set; }
    public string? ClosureReason { get; set; }
    public string? ClosureComments { get; set; }
}
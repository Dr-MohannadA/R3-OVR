-- OVR System Database Creation Script
-- SQL Server Database for Occurrence Variance Reporting (OVR) System
-- Riyadh Third Health Cluster

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'OVRSystem')
BEGIN
    CREATE DATABASE OVRSystem;
END
GO

USE OVRSystem;
GO

-- Drop existing tables if they exist (for clean setup)
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
IF OBJECT_ID('dbo.IncidentComments', 'U') IS NOT NULL DROP TABLE dbo.IncidentComments;
IF OBJECT_ID('dbo.Incidents', 'U') IS NOT NULL DROP TABLE dbo.Incidents;
IF OBJECT_ID('dbo.UserRegistrations', 'U') IS NOT NULL DROP TABLE dbo.UserRegistrations;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Facilities', 'U') IS NOT NULL DROP TABLE dbo.Facilities;
IF OBJECT_ID('dbo.Sessions', 'U') IS NOT NULL DROP TABLE dbo.Sessions;
GO

-- Create Facilities table (14 hospitals from Riyadh Third Health Cluster)
CREATE TABLE dbo.Facilities (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NameEn NVARCHAR(255) NOT NULL,
    NameAr NVARCHAR(255) NOT NULL,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create Categories table for incident categorization
CREATE TABLE dbo.Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create Users table with ASP.NET Identity integration
CREATE TABLE dbo.Users (
    Id NVARCHAR(450) PRIMARY KEY,
    UserName NVARCHAR(256) NOT NULL,
    NormalizedUserName NVARCHAR(256) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    NormalizedEmail NVARCHAR(256) NOT NULL,
    EmailConfirmed BIT NOT NULL DEFAULT 0,
    PasswordHash NVARCHAR(MAX),
    SecurityStamp NVARCHAR(MAX),
    ConcurrencyStamp NVARCHAR(MAX),
    PhoneNumber NVARCHAR(MAX),
    PhoneNumberConfirmed BIT NOT NULL DEFAULT 0,
    TwoFactorEnabled BIT NOT NULL DEFAULT 0,
    LockoutEnd DATETIMEOFFSET,
    LockoutEnabled BIT NOT NULL DEFAULT 1,
    AccessFailedCount INT NOT NULL DEFAULT 0,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Role NVARCHAR(50) NOT NULL DEFAULT 'user',
    FacilityId INT,
    ProfileImageUrl NVARCHAR(500),
    IsActive BIT NOT NULL DEFAULT 1,
    IsApproved BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (FacilityId) REFERENCES dbo.Facilities(Id)
);
GO

-- Create Sessions table for session management
CREATE TABLE dbo.Sessions (
    Sid NVARCHAR(32) PRIMARY KEY,
    Sess NVARCHAR(MAX) NOT NULL,
    Expire DATETIME2 NOT NULL
);
GO

-- Create index on Sessions.Expire for cleanup
CREATE INDEX IX_Sessions_Expire ON dbo.Sessions(Expire);
GO

-- Create UserRegistrations table for approval workflow
CREATE TABLE dbo.UserRegistrations (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FacilityId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ReviewedAt DATETIME2,
    ReviewedBy NVARCHAR(450),
    ReviewComments NVARCHAR(1000),
    FOREIGN KEY (FacilityId) REFERENCES dbo.Facilities(Id),
    FOREIGN KEY (ReviewedBy) REFERENCES dbo.Users(Id)
);
GO

-- Create Incidents table (main incident reporting table)
CREATE TABLE dbo.Incidents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OvrId NVARCHAR(50) NOT NULL UNIQUE,
    
    -- Reporter Information
    ReporterFirstName NVARCHAR(100) NOT NULL,
    ReporterLastName NVARCHAR(100) NOT NULL,
    ReporterEmail NVARCHAR(256),
    ReporterPhone NVARCHAR(50),
    ReporterJobTitle NVARCHAR(200),
    ReporterDepartment NVARCHAR(200) NOT NULL,
    ReporterEmployeeId NVARCHAR(100),
    
    -- Facility Information
    FacilityId INT NOT NULL,
    
    -- Incident Basic Information
    IncidentDate DATETIME2 NOT NULL,
    IncidentTime NVARCHAR(10),
    IncidentType NVARCHAR(100) NOT NULL, -- incident, near_miss, mandatory_reportable_event, sentinel_event
    OvrCategory NVARCHAR(255) NOT NULL,
    WhatBeingReported NVARCHAR(MAX) NOT NULL,
    
    -- Patient Information (optional)
    PatientId NVARCHAR(100),
    PatientAge INT,
    PatientGender NVARCHAR(20),
    PatientNationality NVARCHAR(100),
    
    -- Incident Details
    IncidentLocation NVARCHAR(255),
    WitnessesPresent BIT DEFAULT 0,
    WitnessNames NVARCHAR(MAX),
    IncidentDescription NVARCHAR(MAX) NOT NULL,
    ImmediateActions NVARCHAR(MAX),
    
    -- Contributing Factors
    ContributingFactors NVARCHAR(MAX),
    RootCauseAnalysis NVARCHAR(MAX),
    
    -- Severity and Priority
    Severity NVARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    Priority NVARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Status and Workflow
    Status NVARCHAR(50) NOT NULL DEFAULT 'open', -- open, in_review, pending_closure, closed
    IsFlagged BIT DEFAULT 0,
    
    -- Closure Information
    ClosureReason NVARCHAR(MAX),
    ClosureComments NVARCHAR(MAX),
    ClosedAt DATETIME2,
    ClosedBy NVARCHAR(450),
    
    -- Timestamps
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    SubmittedBy NVARCHAR(450),
    
    FOREIGN KEY (FacilityId) REFERENCES dbo.Facilities(Id),
    FOREIGN KEY (ClosedBy) REFERENCES dbo.Users(Id),
    FOREIGN KEY (SubmittedBy) REFERENCES dbo.Users(Id)
);
GO

-- Create IncidentComments table for discussion/chat functionality
CREATE TABLE dbo.IncidentComments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IncidentId INT NOT NULL,
    UserId NVARCHAR(450) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CommentType NVARCHAR(50) DEFAULT 'comment', -- comment, system, closure_request, status_change, edit
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (IncidentId) REFERENCES dbo.Incidents(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-- Create AuditLogs table for compliance and tracking
CREATE TABLE dbo.AuditLogs (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EntityType NVARCHAR(100) NOT NULL, -- Incident, User, UserRegistration, etc.
    EntityId NVARCHAR(100) NOT NULL,
    Action NVARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    UserId NVARCHAR(450),
    UserEmail NVARCHAR(256),
    Changes NVARCHAR(MAX), -- JSON string of changes
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON dbo.Users(NormalizedEmail);
CREATE INDEX IX_Users_FacilityId ON dbo.Users(FacilityId);
CREATE INDEX IX_Incidents_FacilityId ON dbo.Incidents(FacilityId);
CREATE INDEX IX_Incidents_Status ON dbo.Incidents(Status);
CREATE INDEX IX_Incidents_CreatedAt ON dbo.Incidents(CreatedAt);
CREATE INDEX IX_Incidents_OvrId ON dbo.Incidents(OvrId);
CREATE INDEX IX_IncidentComments_IncidentId ON dbo.IncidentComments(IncidentId);
CREATE INDEX IX_AuditLogs_EntityType_EntityId ON dbo.AuditLogs(EntityType, EntityId);
CREATE INDEX IX_AuditLogs_UserId ON dbo.AuditLogs(UserId);
CREATE INDEX IX_AuditLogs_Timestamp ON dbo.AuditLogs(Timestamp);
GO

PRINT 'Database tables created successfully!';
-- SQL Server Configuration Script for OVR System
-- Configure SQL Server instance for optimal performance with the OVR System

USE OVRSystem;
GO

-- Enable SQL Server Agent if not already enabled (for maintenance jobs)
-- Note: This requires sysadmin privileges and SQL Server Agent service

-- Configure database options for better performance
ALTER DATABASE OVRSystem SET RECOVERY SIMPLE;  -- For development/testing
-- ALTER DATABASE OVRSystem SET RECOVERY FULL;  -- For production

-- Set compatibility level to latest
ALTER DATABASE OVRSystem SET COMPATIBILITY_LEVEL = 160; -- SQL Server 2022

-- Enable query optimization features
ALTER DATABASE OVRSystem SET QUERY_STORE = ON;
ALTER DATABASE OVRSystem SET QUERY_STORE (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO
);

-- Create additional indexes for better query performance
USE OVRSystem;
GO

-- Performance indexes for common queries
CREATE NONCLUSTERED INDEX IX_Incidents_Status_FacilityId 
ON dbo.Incidents(Status, FacilityId) 
INCLUDE (OvrId, IncidentDate, OvrCategory, Priority, CreatedAt);

CREATE NONCLUSTERED INDEX IX_Incidents_IncidentDate_Status 
ON dbo.Incidents(IncidentDate, Status) 
INCLUDE (FacilityId, OvrId, OvrCategory, Priority);

CREATE NONCLUSTERED INDEX IX_Users_Role_IsActive 
ON dbo.Users(Role, IsActive) 
INCLUDE (FacilityId, FirstName, LastName, Email);

CREATE NONCLUSTERED INDEX IX_IncidentComments_IncidentId_CreatedAt 
ON dbo.IncidentComments(IncidentId, CreatedAt) 
INCLUDE (UserId, Content, CommentType);

CREATE NONCLUSTERED INDEX IX_AuditLogs_Timestamp_EntityType 
ON dbo.AuditLogs(Timestamp DESC, EntityType) 
INCLUDE (EntityId, Action, UserId);

-- Create stored procedures for common operations
GO

-- Procedure to get dashboard metrics
CREATE OR ALTER PROCEDURE sp_GetDashboardMetrics
    @FacilityId INT = NULL,
    @UserRole NVARCHAR(50) = 'user'
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @TotalIncidents INT;
    DECLARE @OpenIncidents INT;
    DECLARE @ClosedIncidents INT;
    DECLARE @PendingClosureIncidents INT;
    DECLARE @ActiveFacilities INT;
    
    -- Base query with facility filter for non-admin users
    IF @UserRole = 'admin' OR @FacilityId IS NULL
    BEGIN
        SELECT @TotalIncidents = COUNT(*) FROM dbo.Incidents;
        SELECT @OpenIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'open';
        SELECT @ClosedIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'closed';
        SELECT @PendingClosureIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'pending_closure';
        SELECT @ActiveFacilities = COUNT(*) FROM dbo.Facilities WHERE IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT @TotalIncidents = COUNT(*) FROM dbo.Incidents WHERE FacilityId = @FacilityId;
        SELECT @OpenIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'open' AND FacilityId = @FacilityId;
        SELECT @ClosedIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'closed' AND FacilityId = @FacilityId;
        SELECT @PendingClosureIncidents = COUNT(*) FROM dbo.Incidents WHERE Status = 'pending_closure' AND FacilityId = @FacilityId;
        SET @ActiveFacilities = 1; -- User can only see their facility
    END
    
    SELECT 
        @TotalIncidents AS TotalIncidents,
        @OpenIncidents AS OpenIncidents,
        @ClosedIncidents AS ClosedIncidents,
        @PendingClosureIncidents AS PendingClosureIncidents,
        @ActiveFacilities AS ActiveFacilities;
END
GO

-- Procedure to clean up old sessions
CREATE OR ALTER PROCEDURE sp_CleanupExpiredSessions
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM dbo.Sessions 
    WHERE Expire < GETUTCDATE();
    
    SELECT @@ROWCOUNT AS DeletedSessions;
END
GO

-- Procedure to generate monthly incident report
CREATE OR ALTER PROCEDURE sp_GetMonthlyIncidentReport
    @Year INT,
    @Month INT,
    @FacilityId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATE = DATEFROMPARTS(@Year, @Month, 1);
    DECLARE @EndDate DATE = EOMONTH(@StartDate);
    
    SELECT 
        f.NameEn AS FacilityName,
        i.OvrCategory,
        i.IncidentType,
        i.Status,
        i.Priority,
        COUNT(*) AS IncidentCount,
        AVG(CASE 
            WHEN i.ClosedAt IS NOT NULL 
            THEN DATEDIFF(hour, i.CreatedAt, i.ClosedAt) 
            ELSE NULL 
        END) AS AvgResolutionTimeHours
    FROM dbo.Incidents i
    INNER JOIN dbo.Facilities f ON i.FacilityId = f.Id
    WHERE i.IncidentDate >= @StartDate 
        AND i.IncidentDate <= @EndDate
        AND (@FacilityId IS NULL OR i.FacilityId = @FacilityId)
    GROUP BY f.NameEn, i.OvrCategory, i.IncidentType, i.Status, i.Priority
    ORDER BY f.NameEn, i.OvrCategory, IncidentCount DESC;
END
GO

-- Create database maintenance job script (to be scheduled)
-- This would typically be set up as a SQL Server Agent job
PRINT 'Database performance indexes and stored procedures created successfully!';
PRINT 'Remember to:';
PRINT '1. Schedule sp_CleanupExpiredSessions to run daily';
PRINT '2. Set up regular database maintenance (backup, index maintenance, statistics update)';
PRINT '3. Monitor query performance using Query Store';
PRINT '4. Adjust connection string in appsettings.json to point to your SQL Server instance';
GO
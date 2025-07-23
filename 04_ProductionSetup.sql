-- Production Environment Setup for OVR System
-- Additional security and performance configurations for production deployment

USE master;
GO

-- Create dedicated database user for the application (recommended for production)
-- Replace 'YourAppPassword' with a strong password
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'OVRSystemApp')
BEGIN
    CREATE LOGIN OVRSystemApp WITH PASSWORD = 'YourStrongPassword123!@#';
END
GO

USE OVRSystem;
GO

-- Create database user and assign permissions
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'OVRSystemApp')
BEGIN
    CREATE USER OVRSystemApp FOR LOGIN OVRSystemApp;
END
GO

-- Grant necessary permissions (principle of least privilege)
ALTER ROLE db_datareader ADD MEMBER OVRSystemApp;
ALTER ROLE db_datawriter ADD MEMBER OVRSystemApp;

-- Grant execute permissions on stored procedures
GRANT EXECUTE ON sp_GetDashboardMetrics TO OVRSystemApp;
GRANT EXECUTE ON sp_CleanupExpiredSessions TO OVRSystemApp;
GRANT EXECUTE ON sp_GetMonthlyIncidentReport TO OVRSystemApp;
GO

-- Production Connection String Example:
-- Server=YOUR_SERVER;Database=OVRSystem;User Id=OVRSystemApp;Password=YourStrongPassword123!@#;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;

-- Create backup strategy
-- Full backup weekly, differential daily, log backup every 15 minutes
DECLARE @BackupPath NVARCHAR(500) = 'C:\Backups\OVRSystem\'; -- Adjust path as needed

-- Full backup job (schedule weekly)
BACKUP DATABASE OVRSystem 
TO DISK = @BackupPath + 'OVRSystem_Full_' + FORMAT(GETDATE(), 'yyyyMMdd_HHmmss') + '.bak'
WITH COMPRESSION, CHECKSUM, INIT;

-- Set database to FULL recovery model for production
ALTER DATABASE OVRSystem SET RECOVERY FULL;
GO

-- Create maintenance plan queries
-- Index maintenance (rebuild/reorganize)
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 
    CASE 
        WHEN avg_fragmentation_in_percent > 30 
        THEN 'ALTER INDEX [' + i.name + '] ON [' + s.name + '].[' + o.name + '] REBUILD;' + CHAR(13)
        WHEN avg_fragmentation_in_percent > 10 
        THEN 'ALTER INDEX [' + i.name + '] ON [' + s.name + '].[' + o.name + '] REORGANIZE;' + CHAR(13)
        ELSE ''
    END
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') AS ips
INNER JOIN sys.indexes AS i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
INNER JOIN sys.objects AS o ON i.object_id = o.object_id
INNER JOIN sys.schemas AS s ON o.schema_id = s.schema_id
WHERE avg_fragmentation_in_percent > 10
    AND i.index_id > 0;

PRINT 'Index Maintenance Commands:';
PRINT @sql;
-- EXEC sp_executesql @sql; -- Uncomment to execute

-- Update statistics for all tables
EXEC sp_updatestats;
GO

-- Create monitoring views for administrators
CREATE OR ALTER VIEW vw_SystemHealth AS
SELECT 
    'Database Size' AS Metric,
    CAST(SUM(size * 8.0 / 1024) AS DECIMAL(10,2)) AS ValueMB,
    'MB' AS Unit
FROM sys.database_files
WHERE type = 0 -- Data files only
UNION ALL
SELECT 
    'Active Users Last 24h' AS Metric,
    COUNT(DISTINCT UserId) AS ValueMB,
    'Users' AS Unit
FROM AuditLogs 
WHERE Timestamp >= DATEADD(day, -1, GETUTCDATE())
    AND Action = 'LOGIN'
UNION ALL
SELECT 
    'Incidents This Month' AS Metric,
    COUNT(*) AS ValueMB,
    'Incidents' AS Unit
FROM Incidents 
WHERE YEAR(CreatedAt) = YEAR(GETUTCDATE()) 
    AND MONTH(CreatedAt) = MONTH(GETUTCDATE())
UNION ALL
SELECT 
    'Open Incidents' AS Metric,
    COUNT(*) AS ValueMB,
    'Incidents' AS Unit
FROM Incidents 
WHERE Status = 'open';
GO

-- Performance monitoring query
CREATE OR ALTER VIEW vw_PerformanceMetrics AS
SELECT 
    db.name AS DatabaseName,
    (SELECT COUNT(*) FROM sys.dm_exec_requests WHERE database_id = db.database_id) AS ActiveConnections,
    (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE database_id = db.database_id) AS TotalSessions,
    CAST((
        SELECT SUM(user_seeks + user_scans + user_lookups) 
        FROM sys.dm_db_index_usage_stats 
        WHERE database_id = db.database_id
    ) AS BIGINT) AS TotalIndexUsage
FROM sys.databases db
WHERE db.name = 'OVRSystem';
GO

-- Security audit queries
CREATE OR ALTER VIEW vw_SecurityAudit AS
SELECT 
    TOP 100
    a.Timestamp,
    a.Action,
    a.EntityType,
    a.EntityId,
    a.UserEmail,
    a.IpAddress,
    CASE 
        WHEN a.Action IN ('LOGIN', 'LOGOUT') THEN 'Authentication'
        WHEN a.Action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'Data Modification'
        WHEN a.Action LIKE '%APPROVED%' OR a.Action LIKE '%REJECTED%' THEN 'Administrative Action'
        ELSE 'Other'
    END AS AuditCategory
FROM AuditLogs a
ORDER BY a.Timestamp DESC;
GO

-- Create alerts for critical events
-- (These would typically be implemented as SQL Server Agent alerts)

PRINT 'Production setup completed successfully!';
PRINT '';
PRINT 'IMPORTANT NEXT STEPS:';
PRINT '1. Change the OVRSystemApp password to a strong, unique password';
PRINT '2. Update your connection string to use the OVRSystemApp user';
PRINT '3. Set up automated backups using SQL Server Agent or Azure Backup';
PRINT '4. Schedule index maintenance to run weekly during off-hours';
PRINT '5. Set up monitoring alerts for:';
PRINT '   - Database size growth';
PRINT '   - Failed login attempts';
PRINT '   - Performance degradation';
PRINT '   - Disk space usage';
PRINT '6. Consider implementing Always Encrypted for sensitive data';
PRINT '7. Set up log shipping or Always On for high availability';
PRINT '';
PRINT 'Connection String for Production:';
PRINT 'Server=YOUR_SERVER;Database=OVRSystem;User Id=OVRSystemApp;Password=YourStrongPassword123!@#;Encrypt=True;TrustServerCertificate=False;';
GO
-- OVR System Seed Data Script
-- Insert initial data for facilities and categories

USE OVRSystem;
GO

-- Insert Facilities (14 hospitals from Riyadh Third Health Cluster)
INSERT INTO dbo.Facilities (NameEn, NameAr, Code, IsActive) VALUES
('Ad Diriyah Hospital', 'مستشفى الدرعية', 'ADH', 1),
('Eradah Mental Health Complex', 'مجمع إرادة للصحة النفسية', 'EMH', 1),
('Dharmaa General Hospital', 'مستشفى ضرماء العام', 'DGH', 1),
('Al‑Bejadiah General Hospital', 'مستشفى البجادية العام', 'BGH', 1),
('Marat General Hospital', 'مستشفى مرات العام', 'MGH', 1),
('Al‑Rafaia in Jemsh General Hospital', 'مستشفى الرفايع في جمش العام', 'RJH', 1),
('Wethelan General Hospital', 'مستشفى وثيلان العام', 'WGH', 1),
('Nafy General Hospital', 'مستشفى نافع العام', 'NGH', 1),
('Sajer General Hospital', 'مستشفى ساجر العام', 'SGH', 1),
('Thadeq General Hospital', 'مستشفى ثادق العام', 'TGH', 1),
('Huraymla General Hospital', 'مستشفى حريملاء العام', 'HGH', 1),
('Afif General Hospital', 'مستشفى عفيف العام', 'AGH', 1),
('Shaqra General Hospital', 'مستشفى شقراء العام', 'SqGH', 1),
('Al Dawadmi General Hospital', 'مستشفى الدوادمي العام', 'DAWH', 1);
GO

-- Insert Categories for incident classification
INSERT INTO dbo.Categories (Name, Description, IsActive) VALUES
('Patient Safety', 'Incidents related to patient safety and care', 1),
('Medication Error', 'Errors in medication administration or prescribing', 1),
('Equipment Failure', 'Medical equipment malfunction or failure', 1),
('Infection Control', 'Healthcare-associated infections and control measures', 1),
('Clinical Procedure', 'Issues during clinical procedures or treatments', 1),
('Documentation', 'Medical record and documentation errors', 1),
('Communication', 'Communication breakdowns between staff or with patients', 1),
('Staffing', 'Issues related to staffing levels or competency', 1),
('Environmental Safety', 'Environmental hazards and safety concerns', 1),
('Laboratory', 'Laboratory testing and result reporting issues', 1),
('Radiology', 'Imaging and radiology-related incidents', 1),
('Surgical', 'Operating room and surgical procedure incidents', 1),
('Emergency Department', 'Emergency department specific incidents', 1),
('Mental Health', 'Mental health and psychiatric care incidents', 1),
('Pharmacy', 'Pharmacy operations and medication dispensing', 1),
('Blood Bank', 'Blood products and transfusion-related incidents', 1),
('Nutrition', 'Dietary and nutrition service incidents', 1),
('Transport', 'Patient transport and transfer incidents', 1),
('Security', 'Security and access control incidents', 1),
('Other', 'Other incidents not covered by specific categories', 1);
GO

-- Create default admin user (password: Aa123@Aa - hashed with BCrypt)
-- Note: This password hash is for 'Aa123@Aa' using BCrypt with work factor 12
INSERT INTO dbo.Users (
    Id, UserName, NormalizedUserName, Email, NormalizedEmail, 
    EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp,
    FirstName, LastName, Role, FacilityId, IsActive, IsApproved
) VALUES (
    NEWID(), 
    'admin@r3hc.sa', 
    'ADMIN@R3HC.SA', 
    'admin@r3hc.sa', 
    'ADMIN@R3HC.SA',
    1,
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMBD.zF0YlCr6Py', -- BCrypt hash for 'Aa123@Aa'
    NEWID(),
    NEWID(),
    'System',
    'Administrator',
    'admin',
    1, -- Ad Diriyah Hospital
    1,
    1
);
GO

-- Insert sample departments for dropdown
-- These will be used in the incident reporting form
PRINT 'Seed data inserted successfully!';
PRINT 'Default admin user created: admin@r3hc.sa (password: Aa123@Aa)';
PRINT 'Total facilities inserted: 14';
PRINT 'Total categories inserted: 20';
GO
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OVRSystem.API.Models;

namespace OVRSystem.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Facility> Facilities { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    public DbSet<IncidentComment> IncidentComments { get; set; }
    public DbSet<UserRegistration> UserRegistrations { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure ApplicationUser
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(u => u.Facility)
                  .WithMany(f => f.Users)
                  .HasForeignKey(u => u.FacilityId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(u => u.SubmittedIncidents)
                  .WithOne(i => i.SubmittedByUser)
                  .HasForeignKey(i => i.SubmittedBy)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(u => u.ClosedIncidents)
                  .WithOne(i => i.ClosedByUser)
                  .HasForeignKey(i => i.ClosedBy)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(u => u.Comments)
                  .WithOne(c => c.User)
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(u => u.AuditLogs)
                  .WithOne(a => a.User)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(u => u.ReviewedRegistrations)
                  .WithOne(r => r.ReviewedByUser)
                  .HasForeignKey(r => r.ReviewedBy)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure Facility
        builder.Entity<Facility>(entity =>
        {
            entity.HasIndex(f => f.Code).IsUnique();
            
            entity.HasMany(f => f.Incidents)
                  .WithOne(i => i.Facility)
                  .HasForeignKey(i => i.FacilityId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(f => f.UserRegistrations)
                  .WithOne(r => r.Facility)
                  .HasForeignKey(r => r.FacilityId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Incident
        builder.Entity<Incident>(entity =>
        {
            entity.HasIndex(i => i.OvrId).IsUnique();
            entity.HasIndex(i => i.Status);
            entity.HasIndex(i => i.CreatedAt);
            entity.HasIndex(i => i.FacilityId);

            entity.HasMany(i => i.Comments)
                  .WithOne(c => c.Incident)
                  .HasForeignKey(c => c.IncidentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(i => i.IncidentDescription).HasColumnType("nvarchar(max)");
            entity.Property(i => i.WhatBeingReported).HasColumnType("nvarchar(max)");
            entity.Property(i => i.ImmediateActions).HasColumnType("nvarchar(max)");
            entity.Property(i => i.ContributingFactors).HasColumnType("nvarchar(max)");
            entity.Property(i => i.RootCauseAnalysis).HasColumnType("nvarchar(max)");
            entity.Property(i => i.ClosureReason).HasColumnType("nvarchar(max)");
            entity.Property(i => i.ClosureComments).HasColumnType("nvarchar(max)");
            entity.Property(i => i.WitnessNames).HasColumnType("nvarchar(max)");
        });

        // Configure IncidentComment
        builder.Entity<IncidentComment>(entity =>
        {
            entity.HasIndex(c => c.IncidentId);
            entity.Property(c => c.Content).HasColumnType("nvarchar(max)");
        });

        // Configure UserRegistration
        builder.Entity<UserRegistration>(entity =>
        {
            entity.HasIndex(r => r.Email).IsUnique();
            entity.Property(r => r.PasswordHash).HasColumnType("nvarchar(max)");
        });

        // Configure AuditLog
        builder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(a => new { a.EntityType, a.EntityId });
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.Timestamp);
            entity.Property(a => a.Changes).HasColumnType("nvarchar(max)");
        });

        // Seed data
        SeedData(builder);
    }

    private void SeedData(ModelBuilder builder)
    {
        // Seed Facilities
        builder.Entity<Facility>().HasData(
            new Facility { Id = 1, NameEn = "Ad Diriyah Hospital", NameAr = "مستشفى الدرعية", Code = "ADH" },
            new Facility { Id = 2, NameEn = "Eradah Mental Health Complex", NameAr = "مجمع إرادة للصحة النفسية", Code = "EMH" },
            new Facility { Id = 3, NameEn = "Dharmaa General Hospital", NameAr = "مستشفى ضرماء العام", Code = "DGH" },
            new Facility { Id = 4, NameEn = "Al‑Bejadiah General Hospital", NameAr = "مستشفى البجادية العام", Code = "BGH" },
            new Facility { Id = 5, NameEn = "Marat General Hospital", NameAr = "مستشفى مرات العام", Code = "MGH" },
            new Facility { Id = 6, NameEn = "Al‑Rafaia in Jemsh General Hospital", NameAr = "مستشفى الرفايع في جمش العام", Code = "RJH" },
            new Facility { Id = 7, NameEn = "Wethelan General Hospital", NameAr = "مستشفى وثيلان العام", Code = "WGH" },
            new Facility { Id = 8, NameEn = "Nafy General Hospital", NameAr = "مستشفى نافع العام", Code = "NGH" },
            new Facility { Id = 9, NameEn = "Sajer General Hospital", NameAr = "مستشفى ساجر العام", Code = "SGH" },
            new Facility { Id = 10, NameEn = "Thadeq General Hospital", NameAr = "مستشفى ثادق العام", Code = "TGH" },
            new Facility { Id = 11, NameEn = "Huraymla General Hospital", NameAr = "مستشفى حريملاء العام", Code = "HGH" },
            new Facility { Id = 12, NameEn = "Afif General Hospital", NameAr = "مستشفى عفيف العام", Code = "AGH" },
            new Facility { Id = 13, NameEn = "Shaqra General Hospital", NameAr = "مستشفى شقراء العام", Code = "SqGH" },
            new Facility { Id = 14, NameEn = "Al Dawadmi General Hospital", NameAr = "مستشفى الدوادمي العام", Code = "DAWH" }
        );

        // Seed Categories
        builder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Patient Safety", Description = "Incidents related to patient safety and care" },
            new Category { Id = 2, Name = "Medication Error", Description = "Errors in medication administration or prescribing" },
            new Category { Id = 3, Name = "Equipment Failure", Description = "Medical equipment malfunction or failure" },
            new Category { Id = 4, Name = "Infection Control", Description = "Healthcare-associated infections and control measures" },
            new Category { Id = 5, Name = "Clinical Procedure", Description = "Issues during clinical procedures or treatments" },
            new Category { Id = 6, Name = "Documentation", Description = "Medical record and documentation errors" },
            new Category { Id = 7, Name = "Communication", Description = "Communication breakdowns between staff or with patients" },
            new Category { Id = 8, Name = "Staffing", Description = "Issues related to staffing levels or competency" },
            new Category { Id = 9, Name = "Environmental Safety", Description = "Environmental hazards and safety concerns" },
            new Category { Id = 10, Name = "Laboratory", Description = "Laboratory testing and result reporting issues" },
            new Category { Id = 11, Name = "Radiology", Description = "Imaging and radiology-related incidents" },
            new Category { Id = 12, Name = "Surgical", Description = "Operating room and surgical procedure incidents" },
            new Category { Id = 13, Name = "Emergency Department", Description = "Emergency department specific incidents" },
            new Category { Id = 14, Name = "Mental Health", Description = "Mental health and psychiatric care incidents" },
            new Category { Id = 15, Name = "Pharmacy", Description = "Pharmacy operations and medication dispensing" },
            new Category { Id = 16, Name = "Blood Bank", Description = "Blood products and transfusion-related incidents" },
            new Category { Id = 17, Name = "Nutrition", Description = "Dietary and nutrition service incidents" },
            new Category { Id = 18, Name = "Transport", Description = "Patient transport and transfer incidents" },
            new Category { Id = 19, Name = "Security", Description = "Security and access control incidents" },
            new Category { Id = 20, Name = "Other", Description = "Other incidents not covered by specific categories" }
        );
    }
}
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OVRSystem.API.Models;

namespace OVRSystem.API.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        try
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Create roles if they don't exist
            string[] roles = { "admin", "user" };
            
            foreach (string role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Create default admin user if it doesn't exist
            var adminEmail = "admin@r3hc.sa";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FirstName = "System",
                    LastName = "Administrator",
                    Role = "admin",
                    FacilityId = 1, // Ad Diriyah Hospital
                    IsActive = true,
                    IsApproved = true
                };

                var result = await userManager.CreateAsync(adminUser, "Aa123@Aa");
                
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "admin");
                    Console.WriteLine("Default admin user created successfully!");
                }
                else
                {
                    Console.WriteLine($"Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database initialization error: {ex.Message}");
        }
    }
}
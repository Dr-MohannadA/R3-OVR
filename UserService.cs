using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OVRSystem.API.Data;
using OVRSystem.API.DTOs;
using OVRSystem.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace OVRSystem.API.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    private readonly IAuditService _auditService;

    public UserService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IMapper mapper,
        IConfiguration configuration,
        IAuditService auditService)
    {
        _context = context;
        _userManager = userManager;
        _mapper = mapper;
        _configuration = configuration;
        _auditService = auditService;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null || !user.IsActive || !user.IsApproved)
        {
            return null;
        }

        var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!result)
        {
            return null;
        }

        var token = await GenerateJwtTokenAsync(user);
        var userDto = _mapper.Map<UserDto>(user);

        await _auditService.LogAsync("User", user.Id, "LOGIN", user.Id, user.Email);

        return new AuthResponseDto
        {
            Token = token,
            User = userDto
        };
    }

    public async Task<bool> RegisterAsync(RegisterDto registerDto)
    {
        // Check if user already exists
        var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
        if (existingUser != null)
        {
            return false;
        }

        // Check if registration already exists
        var existingRegistration = await _context.UserRegistrations
            .FirstOrDefaultAsync(r => r.Email == registerDto.Email);
        if (existingRegistration != null)
        {
            return false;
        }

        // Hash password
        var passwordHasher = new PasswordHasher<ApplicationUser>();
        var hashedPassword = passwordHasher.HashPassword(null!, registerDto.Password);

        var registration = new UserRegistration
        {
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Email = registerDto.Email,
            PasswordHash = hashedPassword,
            FacilityId = registerDto.FacilityId,
            Status = "pending",
            SubmittedAt = DateTime.UtcNow
        };

        _context.UserRegistrations.Add(registration);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("UserRegistration", registration.Id.ToString(), "CREATE", null, registerDto.Email);

        return true;
    }

    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _context.Users
            .Include(u => u.Facility)
            .FirstOrDefaultAsync(u => u.Id == userId);

        return user != null ? _mapper.Map<UserDto>(user) : null;
    }

    public async Task<IEnumerable<UserDto>> GetUsersAsync()
    {
        var users = await _context.Users
            .Include(u => u.Facility)
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        return _mapper.Map<IEnumerable<UserDto>>(users);
    }

    public async Task<IEnumerable<UserRegistrationDto>> GetPendingRegistrationsAsync()
    {
        var registrations = await _context.UserRegistrations
            .Include(r => r.Facility)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.Status == "pending")
            .OrderBy(r => r.SubmittedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<UserRegistrationDto>>(registrations);
    }

    public async Task<bool> ReviewRegistrationAsync(int registrationId, ReviewRegistrationDto reviewDto, string reviewerId)
    {
        var registration = await _context.UserRegistrations.FindAsync(registrationId);
        if (registration == null || registration.Status != "pending")
        {
            return false;
        }

        registration.Status = reviewDto.Approve ? "approved" : "rejected";
        registration.ReviewedAt = DateTime.UtcNow;
        registration.ReviewedBy = reviewerId;
        registration.ReviewComments = reviewDto.Comments;

        if (reviewDto.Approve)
        {
            // Create actual user account
            var user = new ApplicationUser
            {
                UserName = registration.Email,
                Email = registration.Email,
                EmailConfirmed = true,
                FirstName = registration.FirstName,
                LastName = registration.LastName,
                Role = "user",
                FacilityId = registration.FacilityId,
                IsActive = true,
                IsApproved = true
            };

            var result = await _userManager.CreateAsync(user, registration.PasswordHash);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, "user");
            }
        }

        await _context.SaveChangesAsync();

        var action = reviewDto.Approve ? "APPROVED" : "REJECTED";
        await _auditService.LogAsync("UserRegistration", registration.Id.ToString(), action, reviewerId, registration.Email);

        return true;
    }

    public async Task<bool> UpdateUserStatusAsync(string userId, bool isActive, string updatedBy)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (result.Succeeded)
        {
            var action = isActive ? "ACTIVATED" : "DEACTIVATED";
            await _auditService.LogAsync("User", userId, action, updatedBy, user.Email);
            return true;
        }

        return false;
    }

    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var facility = await _context.Facilities.FindAsync(user.FacilityId);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? ""),
            new Claim("facilityId", user.FacilityId?.ToString() ?? ""),
            new Claim("facilityName", facility?.NameEn ?? "")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(double.Parse(_configuration["Jwt:ExpireMinutes"]!)),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
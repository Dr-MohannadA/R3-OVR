using OVRSystem.API.DTOs;

namespace OVRSystem.API.Services;

public interface IUserService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
    Task<bool> RegisterAsync(RegisterDto registerDto);
    Task<UserDto?> GetUserByIdAsync(string userId);
    Task<IEnumerable<UserDto>> GetUsersAsync();
    Task<IEnumerable<UserRegistrationDto>> GetPendingRegistrationsAsync();
    Task<bool> ReviewRegistrationAsync(int registrationId, ReviewRegistrationDto reviewDto, string reviewerId);
    Task<bool> UpdateUserStatusAsync(string userId, bool isActive, string updatedBy);
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OVRSystem.API.DTOs;
using OVRSystem.API.Services;
using System.Security.Claims;

namespace OVRSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "AdminOnly")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _userService.GetUsersAsync();
        return Ok(users);
    }

    [HttpGet("registrations/pending")]
    public async Task<ActionResult<IEnumerable<UserRegistrationDto>>> GetPendingRegistrations()
    {
        var registrations = await _userService.GetPendingRegistrationsAsync();
        return Ok(registrations);
    }

    [HttpPost("registrations/{id}/review")]
    public async Task<ActionResult> ReviewRegistration(int id, [FromBody] ReviewRegistrationDto reviewDto)
    {
        var reviewerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _userService.ReviewRegistrationAsync(id, reviewDto, reviewerId);
        
        if (!result)
        {
            return NotFound();
        }

        return Ok();
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult> UpdateUserStatus(string id, [FromBody] UpdateUserStatusDto statusDto)
    {
        var updatedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;
        var result = await _userService.UpdateUserStatusAsync(id, statusDto.IsActive, updatedBy);
        
        if (!result)
        {
            return NotFound();
        }

        return Ok();
    }
}

public class UpdateUserStatusDto
{
    public bool IsActive { get; set; }
}
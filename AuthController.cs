using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OVRSystem.API.DTOs;
using OVRSystem.API.Services;
using System.Security.Claims;

namespace OVRSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        var result = await _userService.LoginAsync(loginDto);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid credentials or account not approved" });
        }

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register([FromBody] RegisterDto registerDto)
    {
        var result = await _userService.RegisterAsync(registerDto);
        if (!result)
        {
            return BadRequest(new { message = "User already exists or registration failed" });
        }

        return Ok(new { message = "Registration submitted for approval" });
    }

    [HttpGet("user")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult Logout()
    {
        // For JWT, logout is typically handled client-side by removing the token
        return Ok(new { message = "Logged out successfully" });
    }
}
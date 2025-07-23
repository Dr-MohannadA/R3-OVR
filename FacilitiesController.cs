using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OVRSystem.API.DTOs;
using OVRSystem.API.Services;

namespace OVRSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FacilitiesController : ControllerBase
{
    private readonly IFacilityService _facilityService;

    public FacilitiesController(IFacilityService facilityService)
    {
        _facilityService = facilityService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FacilityDto>>> GetFacilities()
    {
        var facilities = await _facilityService.GetFacilitiesAsync();
        return Ok(facilities);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FacilityDto>> GetFacility(int id)
    {
        var facility = await _facilityService.GetFacilityByIdAsync(id);
        if (facility == null)
        {
            return NotFound();
        }

        return Ok(facility);
    }
}
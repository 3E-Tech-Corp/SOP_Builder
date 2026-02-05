using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class SopController : ControllerBase
{
    private readonly SopService _sopService;

    public SopController(SopService sopService)
    {
        _sopService = sopService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sops = await _sopService.GetAll(status: status, page: page, pageSize: pageSize);
        return Ok(sops);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.GetById(id);
        if (sop == null) return NotFound(new { error = "SOP not found" });
        return Ok(sop);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSopRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        var sop = await _sopService.Create(request, auth.UserId);
        return Ok(sop);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSopRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.Update(id, request, auth.UserId);
        if (sop == null) return NotFound(new { error = "SOP not found" });
        return Ok(sop);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _sopService.Delete(id);
        if (!success) return NotFound(new { error = "SOP not found" });
        return Ok(new { message = "SOP archived" });
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.Publish(id);
        if (sop == null) return NotFound(new { error = "SOP not found or cannot be published" });
        return Ok(sop);
    }

    [HttpPost("{id}/duplicate")]
    public async Task<IActionResult> Duplicate(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.Duplicate(id, auth.UserId);
        if (sop == null) return NotFound(new { error = "SOP not found" });
        return Ok(sop);
    }

    private AuthContext? GetAuthContext()
    {
        // Check API key context first
        if (HttpContext.Items.TryGetValue("AuthContext", out var ctx) && ctx is AuthContext apiCtx)
            return apiCtx;

        // Check JWT claims
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;

        return new AuthContext
        {
            UserId = int.Parse(userIdClaim.Value),
            Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "",
            Name = User.FindFirst(ClaimTypes.Name)?.Value ?? "",
            Role = User.FindFirst(ClaimTypes.Role)?.Value ?? "User",
        };
    }
}

using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("sop/{sopId}/objects")]
public class ObjectController : ControllerBase
{
    private readonly ObjectService _objectService;
    private readonly AuditService _auditService;

    public ObjectController(ObjectService objectService, AuditService auditService)
    {
        _objectService = objectService;
        _auditService = auditService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(int sopId, [FromBody] CreateObjectRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        try
        {
            var obj = await _objectService.Create(sopId, request, auth);
            return Ok(obj);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        int sopId,
        [FromQuery] string? status = null,
        [FromQuery] bool? isComplete = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var objects = await _objectService.GetAll(sopId, status, isComplete, page, pageSize);
        return Ok(objects);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int sopId, int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var obj = await _objectService.GetById(sopId, id);
        if (obj == null) return NotFound(new { error = "Object not found" });
        return Ok(obj);
    }

    [HttpPost("{id}/actions/{edgeId}")]
    public async Task<IActionResult> ExecuteAction(int sopId, int id, string edgeId, [FromBody] ExecuteActionRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        try
        {
            var result = await _objectService.ExecuteAction(sopId, id, edgeId, request, auth);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id}/audit")]
    public async Task<IActionResult> GetAudit(int sopId, int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var entries = await _auditService.GetForObject(sopId, id, page, pageSize);
        return Ok(entries);
    }

    private AuthContext? GetAuthContext()
    {
        if (HttpContext.Items.TryGetValue("AuthContext", out var ctx) && ctx is AuthContext apiCtx)
            return apiCtx;

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

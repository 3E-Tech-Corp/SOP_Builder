using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuditController : ControllerBase
{
    private readonly AuditService _auditService;

    public AuditController(AuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] AuditQueryParams query)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var entries = await _auditService.Search(query);
        return Ok(entries);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] AuditQueryParams query)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var csv = await _auditService.ExportCsv(query);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"audit-export-{DateTime.UtcNow:yyyyMMdd}.csv");
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

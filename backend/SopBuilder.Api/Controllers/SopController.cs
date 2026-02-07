using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

/// <summary>
/// Manage Standard Operating Procedures (SOPs).
/// SOPs define workflow graphs with nodes (statuses) and edges (actions/transitions).
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
[Tags("SOPs")]
public class SopController : ControllerBase
{
    private readonly SopService _sopService;

    public SopController(SopService sopService)
    {
        _sopService = sopService;
    }

    /// <summary>
    /// List all SOPs
    /// </summary>
    /// <param name="status">Filter by status: Draft, Published, Archived</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 50, max: 100)</param>
    /// <returns>List of SOPs with node/edge counts</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<SopListDto>), 200)]
    [ProducesResponseType(401)]
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

    /// <summary>
    /// Get SOP by ID
    /// </summary>
    /// <param name="id">SOP ID</param>
    /// <returns>SOP details including full workflow definition</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(SopDetailDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.GetById(id);
        if (sop == null) return NotFound(new { error = "SOP not found" });
        return Ok(sop);
    }

    /// <summary>
    /// Create a new SOP
    /// </summary>
    /// <param name="request">SOP name, description, and optional initial definition</param>
    /// <returns>Created SOP</returns>
    [HttpPost]
    [ProducesResponseType(typeof(SopDetailDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Create([FromBody] CreateSopRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        var sop = await _sopService.Create(request, auth.UserId);
        return Ok(sop);
    }

    /// <summary>
    /// Update SOP definition
    /// </summary>
    /// <param name="id">SOP ID</param>
    /// <param name="request">Updated fields (name, description, definition)</param>
    /// <returns>Updated SOP</returns>
    /// <remarks>
    /// The definition object contains the React Flow graph structure:
    /// - nodes: Array of node objects with id, type, position, data
    /// - edges: Array of edge objects with id, source, target, data
    /// </remarks>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(SopDetailDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSopRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.Update(id, request, auth.UserId);
        if (sop == null) return NotFound(new { error = "SOP not found" });
        return Ok(sop);
    }

    /// <summary>
    /// Archive a SOP (soft delete)
    /// </summary>
    /// <param name="id">SOP ID</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _sopService.Delete(id);
        if (!success) return NotFound(new { error = "SOP not found" });
        return Ok(new { message = "SOP archived" });
    }

    /// <summary>
    /// Publish a SOP
    /// </summary>
    /// <param name="id">SOP ID</param>
    /// <returns>Published SOP with incremented version</returns>
    /// <remarks>
    /// Publishing validates the SOP has at least one Start node and one End node.
    /// Published SOPs cannot be edited (create a new version instead).
    /// </remarks>
    [HttpPost("{id}/publish")]
    [ProducesResponseType(typeof(SopDetailDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Publish(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var sop = await _sopService.Publish(id);
        if (sop == null) return NotFound(new { error = "SOP not found or cannot be published" });
        return Ok(sop);
    }

    /// <summary>
    /// Duplicate a SOP
    /// </summary>
    /// <param name="id">SOP ID to duplicate</param>
    /// <returns>New SOP copy in Draft status</returns>
    [HttpPost("{id}/duplicate")]
    [ProducesResponseType(typeof(SopDetailDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
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

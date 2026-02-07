using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

/// <summary>
/// Manage objects flowing through a SOP workflow.
/// Objects start at the Start node and transition through status nodes via actions.
/// </summary>
[ApiController]
[Route("sop/{sopId}/objects")]
[Produces("application/json")]
[Tags("Objects")]
public class ObjectController : ControllerBase
{
    private readonly ObjectService _objectService;
    private readonly AuditService _auditService;

    public ObjectController(ObjectService objectService, AuditService auditService)
    {
        _objectService = objectService;
        _auditService = auditService;
    }

    /// <summary>
    /// Create a new object in a SOP
    /// </summary>
    /// <param name="sopId">SOP ID</param>
    /// <param name="request">Object name, optional external ID, type, and initial properties</param>
    /// <returns>Created object at the Start node</returns>
    /// <remarks>
    /// The object is automatically placed at the SOP's Start node.
    /// Use the externalId field to link to your own system's identifier.
    /// 
    /// Example:
    /// ```json
    /// {
    ///   "name": "PO-2026-001",
    ///   "externalId": "your-system-id-123",
    ///   "type": "PurchaseOrder",
    ///   "properties": {
    ///     "vendor": "Acme Corp",
    ///     "amount": 5000
    ///   }
    /// }
    /// ```
    /// </remarks>
    [HttpPost]
    [ProducesResponseType(typeof(ObjectDetailDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
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

    /// <summary>
    /// List objects in a SOP
    /// </summary>
    /// <param name="sopId">SOP ID</param>
    /// <param name="status">Filter by current status label</param>
    /// <param name="isComplete">Filter by completion state</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 50)</param>
    /// <returns>Paginated list of objects</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<ObjectListDto>), 200)]
    [ProducesResponseType(401)]
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

    /// <summary>
    /// Get object by ID
    /// </summary>
    /// <param name="sopId">SOP ID</param>
    /// <param name="id">Object ID</param>
    /// <returns>Object details including current position, properties, and documents</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ObjectDetailDto), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int sopId, int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var obj = await _objectService.GetById(sopId, id);
        if (obj == null) return NotFound(new { error = "Object not found" });
        return Ok(obj);
    }

    /// <summary>
    /// Execute an action (transition) on an object
    /// </summary>
    /// <param name="sopId">SOP ID</param>
    /// <param name="id">Object ID</param>
    /// <param name="edgeId">Edge ID from the SOP definition (the action to execute)</param>
    /// <param name="request">Action data: properties to update, documents to attach, notes</param>
    /// <returns>Updated object, audit entry, and notification previews</returns>
    /// <remarks>
    /// The edgeId must be an outgoing edge from the object's current node.
    /// 
    /// Actions may require:
    /// - **Specific roles**: Check edge.data.requiredRoles in the SOP definition
    /// - **Required fields**: Check edge.data.requiredFields
    /// - **Required documents**: Upload via /asset/upload first, then pass assetId
    /// 
    /// Example:
    /// ```json
    /// {
    ///   "properties": {
    ///     "approverNotes": "Approved for Q1 budget",
    ///     "approvedAmount": 4500
    ///   },
    ///   "documents": [
    ///     { "name": "Quote", "assetId": 123 }
    ///   ],
    ///   "notes": "Fast-tracked due to urgency",
    ///   "actorRole": "Manager"
    /// }
    /// ```
    /// 
    /// Decision nodes are auto-evaluated: if the object lands on a decision node,
    /// rules are checked and it may automatically transition to the next status.
    /// </remarks>
    [HttpPost("{id}/actions/{edgeId}")]
    [ProducesResponseType(typeof(ExecuteActionResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
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

    /// <summary>
    /// Get audit trail for an object
    /// </summary>
    /// <param name="sopId">SOP ID</param>
    /// <param name="id">Object ID</param>
    /// <param name="page">Page number (default: 1)</param>
    /// <param name="pageSize">Items per page (default: 100)</param>
    /// <returns>Chronological list of all actions taken on the object</returns>
    [HttpGet("{id}/audit")]
    [ProducesResponseType(typeof(List<AuditEntryDto>), 200)]
    [ProducesResponseType(401)]
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

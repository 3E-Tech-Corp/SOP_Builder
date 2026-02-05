using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class DocumentTypeController : ControllerBase
{
    private readonly DocumentTypeService _documentTypeService;

    public DocumentTypeController(DocumentTypeService documentTypeService)
    {
        _documentTypeService = documentTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive = null)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var types = await _documentTypeService.GetAll(isActive);
        return Ok(types);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var type = await _documentTypeService.GetById(id);
        if (type == null) return NotFound(new { error = "Document type not found" });
        return Ok(type);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentTypeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        try
        {
            var type = await _documentTypeService.Create(request);
            return Ok(type);
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate") || ex.Message.Contains("UNIQUE"))
        {
            return BadRequest(new { error = "A document type with that name already exists" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentTypeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var type = await _documentTypeService.Update(id, request);
        if (type == null) return NotFound(new { error = "Document type not found" });
        return Ok(type);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _documentTypeService.Delete(id);
        if (!success) return NotFound(new { error = "Document type not found" });
        return Ok(new { message = "Document type deleted" });
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

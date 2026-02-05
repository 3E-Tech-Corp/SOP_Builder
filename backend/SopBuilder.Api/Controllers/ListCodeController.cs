using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ListCodeController : ControllerBase
{
    private readonly ListCodeService _listCodeService;

    public ListCodeController(ListCodeService listCodeService)
    {
        _listCodeService = listCodeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var codes = await _listCodeService.GetAll();
        return Ok(codes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var code = await _listCodeService.GetById(id);
        if (code == null) return NotFound(new { error = "List code not found" });
        return Ok(code);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateListCodeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required" });

        try
        {
            var code = await _listCodeService.Create(request);
            return Ok(code);
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate") || ex.Message.Contains("UNIQUE"))
        {
            return BadRequest(new { error = "A list code with that name already exists" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateListCodeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var code = await _listCodeService.Update(id, request);
        if (code == null) return NotFound(new { error = "List code not found" });
        return Ok(code);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _listCodeService.Delete(id);
        if (!success) return NotFound(new { error = "List code not found" });
        return Ok(new { message = "List code deleted" });
    }

    // ── Item endpoints ──

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AddItem(int id, [FromBody] ListCodeItemRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Value) || string.IsNullOrWhiteSpace(request.Label))
            return BadRequest(new { error = "Value and Label are required" });

        try
        {
            var item = await _listCodeService.AddItem(id, request);
            return Ok(item);
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate") || ex.Message.Contains("UNIQUE"))
        {
            return BadRequest(new { error = "An item with that value already exists in this list code" });
        }
    }

    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> UpdateItem(int itemId, [FromBody] ListCodeItemRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var item = await _listCodeService.UpdateItem(itemId, request);
        if (item == null) return NotFound(new { error = "Item not found" });
        return Ok(item);
    }

    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> DeleteItem(int itemId)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _listCodeService.DeleteItem(itemId);
        if (!success) return NotFound(new { error = "Item not found" });
        return Ok(new { message = "Item deleted" });
    }

    /// <summary>
    /// Get items for a list code by name (for Object Tester / external consumers)
    /// </summary>
    [HttpGet("by-name/{name}/items")]
    public async Task<IActionResult> GetItemsByName(string name)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var items = await _listCodeService.GetItemsByListCodeName(name);
        return Ok(items);
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

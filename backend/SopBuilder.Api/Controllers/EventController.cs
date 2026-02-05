using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class EventController : ControllerBase
{
    private readonly EventService _eventService;

    public EventController(EventService eventService)
    {
        _eventService = eventService;
    }

    // ── Event Types ──

    [HttpGet("types")]
    public async Task<IActionResult> GetAllEventTypes()
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var types = await _eventService.GetAllEventTypes();
        return Ok(types);
    }

    [HttpGet("types/{id}")]
    public async Task<IActionResult> GetEventTypeById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var type = await _eventService.GetEventTypeById(id);
        if (type == null) return NotFound(new { error = "Event type not found" });
        return Ok(type);
    }

    [HttpPost("types")]
    public async Task<IActionResult> CreateEventType([FromBody] CreateEventTypeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Code and Name are required" });

        try
        {
            var type = await _eventService.CreateEventType(request);
            return Ok(type);
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate") || ex.Message.Contains("UNIQUE"))
        {
            return BadRequest(new { error = "An event type with that code already exists" });
        }
    }

    [HttpPut("types/{id}")]
    public async Task<IActionResult> UpdateEventType(int id, [FromBody] UpdateEventTypeRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var type = await _eventService.UpdateEventType(id, request);
        if (type == null) return NotFound(new { error = "Event type not found" });
        return Ok(type);
    }

    [HttpDelete("types/{id}")]
    public async Task<IActionResult> DeleteEventType(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _eventService.DeleteEventType(id);
        if (!success) return NotFound(new { error = "Event type not found" });
        return Ok(new { message = "Event type deleted" });
    }

    // ── Notification Rules ──

    [HttpGet("rules")]
    public async Task<IActionResult> GetAllNotificationRules([FromQuery] string? eventTypeCode = null)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var rules = await _eventService.GetAllNotificationRules(eventTypeCode);
        return Ok(rules);
    }

    [HttpGet("rules/{id}")]
    public async Task<IActionResult> GetNotificationRuleById(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var rule = await _eventService.GetNotificationRuleById(id);
        if (rule == null) return NotFound(new { error = "Notification rule not found" });
        return Ok(rule);
    }

    [HttpPost("rules")]
    public async Task<IActionResult> CreateNotificationRule([FromBody] CreateNotificationRuleRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.EventTypeCode) || string.IsNullOrWhiteSpace(request.Channel))
            return BadRequest(new { error = "EventTypeCode and Channel are required" });

        var rule = await _eventService.CreateNotificationRule(request);
        return Ok(rule);
    }

    [HttpPut("rules/{id}")]
    public async Task<IActionResult> UpdateNotificationRule(int id, [FromBody] UpdateNotificationRuleRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var rule = await _eventService.UpdateNotificationRule(id, request);
        if (rule == null) return NotFound(new { error = "Notification rule not found" });
        return Ok(rule);
    }

    [HttpDelete("rules/{id}")]
    public async Task<IActionResult> DeleteNotificationRule(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var success = await _eventService.DeleteNotificationRule(id);
        if (!success) return NotFound(new { error = "Notification rule not found" });
        return Ok(new { message = "Notification rule deleted" });
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

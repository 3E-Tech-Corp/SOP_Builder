namespace SopBuilder.Api.Models;

// ── Database entities ──

public class EventType
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class NotificationRule
{
    public int Id { get; set; }
    public string EventTypeCode { get; set; } = "";
    public string Channel { get; set; } = "";
    public string Template { get; set; } = "";
    public string Recipients { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

// ── Request DTOs ──

public class CreateEventTypeRequest
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
}

public class UpdateEventTypeRequest
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}

public class CreateNotificationRuleRequest
{
    public string EventTypeCode { get; set; } = "";
    public string Channel { get; set; } = "";
    public string Template { get; set; } = "";
    public string Recipients { get; set; } = "";
}

public class UpdateNotificationRuleRequest
{
    public string? EventTypeCode { get; set; }
    public string? Channel { get; set; }
    public string? Template { get; set; }
    public string? Recipients { get; set; }
    public bool? IsActive { get; set; }
}

// ── Response DTOs ──

public class EventTypeDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int RuleCount { get; set; }
}

public class NotificationRuleDto
{
    public int Id { get; set; }
    public string EventTypeCode { get; set; } = "";
    public string? EventTypeName { get; set; }
    public string Channel { get; set; } = "";
    public string Template { get; set; } = "";
    public string Recipients { get; set; } = "";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

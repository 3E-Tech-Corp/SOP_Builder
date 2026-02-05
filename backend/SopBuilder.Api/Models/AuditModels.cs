namespace SopBuilder.Api.Models;

// ── Database entity ──

public class AuditTrailEntry
{
    public long Id { get; set; }
    public int ObjectId { get; set; }
    public int SopId { get; set; }
    public string? FromNodeId { get; set; }
    public string? FromStatus { get; set; }
    public string? ActionEdgeId { get; set; }
    public string? ActionName { get; set; }
    public string? ToNodeId { get; set; }
    public string? ToStatus { get; set; }
    public int? ActorUserId { get; set; }
    public int? ActorApiKeyId { get; set; }
    public string? ActorRole { get; set; }
    public string? PropertiesSnapshot { get; set; }
    public string? DocumentsAttached { get; set; }
    public string? NotificationsSent { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Response DTOs ──

public class AuditEntryDto
{
    public long Id { get; set; }
    public int ObjectId { get; set; }
    public int SopId { get; set; }
    public string? ObjectName { get; set; }
    public string? SopName { get; set; }
    public string? FromNodeId { get; set; }
    public string? FromStatus { get; set; }
    public string? ActionEdgeId { get; set; }
    public string? ActionName { get; set; }
    public string? ToNodeId { get; set; }
    public string? ToStatus { get; set; }
    public int? ActorUserId { get; set; }
    public string? ActorName { get; set; }
    public string? ActorRole { get; set; }
    public string? PropertiesSnapshot { get; set; }
    public string? DocumentsAttached { get; set; }
    public string? NotificationsSent { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Query params ──

public record AuditQueryParams
{
    public int? SopId { get; set; }
    public int? ObjectId { get; set; }
    public string? Action { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

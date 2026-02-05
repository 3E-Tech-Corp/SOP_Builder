namespace SopBuilder.Api.Models;

// ── Database entity ──

public class SopObject
{
    public int Id { get; set; }
    public int SopId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = "";
    public string? Type { get; set; }
    public string CurrentNodeId { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public string? PropertiesJson { get; set; }
    public bool IsComplete { get; set; }
    public int? CreatedBy { get; set; }
    public int? ApiKeyId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ObjectDocument
{
    public int Id { get; set; }
    public int ObjectId { get; set; }
    public string? ActionEdgeId { get; set; }
    public string FileName { get; set; } = "";
    public string? FileType { get; set; }
    public string? FilePath { get; set; }
    public long? FileSize { get; set; }
    public int? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; }
}

// ── Request DTOs ──

public class CreateObjectRequest
{
    public string Name { get; set; } = "";
    public string? ExternalId { get; set; }
    public string? Type { get; set; }
    public Dictionary<string, object>? Properties { get; set; }
}

public class ExecuteActionRequest
{
    public Dictionary<string, object>? Properties { get; set; }
    public List<ActionDocumentDto>? Documents { get; set; }
    public string? Notes { get; set; }
    public string? ActorRole { get; set; }
}

public class ActionDocumentDto
{
    public string Name { get; set; } = "";
    public string? Type { get; set; }
    public string? FileName { get; set; }
}

// ── Response DTOs ──

public class ObjectListDto
{
    public int Id { get; set; }
    public int SopId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = "";
    public string? Type { get; set; }
    public string CurrentNodeId { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public bool IsComplete { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ObjectDetailDto
{
    public int Id { get; set; }
    public int SopId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = "";
    public string? Type { get; set; }
    public string CurrentNodeId { get; set; } = "";
    public string CurrentStatus { get; set; } = "";
    public Dictionary<string, object>? Properties { get; set; }
    public bool IsComplete { get; set; }
    public List<ObjectDocumentDto>? Documents { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ObjectDocumentDto
{
    public int Id { get; set; }
    public string? ActionEdgeId { get; set; }
    public string FileName { get; set; } = "";
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ExecuteActionResponse
{
    public ObjectDetailDto Object { get; set; } = new();
    public AuditEntryDto AuditEntry { get; set; } = new();
    public List<NotificationPreview>? Notifications { get; set; }
}

public class NotificationPreview
{
    public string Channel { get; set; } = "";
    public string Recipient { get; set; } = "";
    public string Template { get; set; } = "";
}

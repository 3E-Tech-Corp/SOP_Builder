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

/// <summary>
/// Links a SOP object to an uploaded Asset (via the Asset Management pattern).
/// No file paths stored here — the Asset table owns storage details.
/// </summary>
public class ObjectDocument
{
    public int Id { get; set; }
    public int ObjectId { get; set; }
    public int AssetId { get; set; }
    public string? ActionEdgeId { get; set; }
    public string? DocumentType { get; set; }
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
    /// <summary>
    /// List of asset IDs (already uploaded via /asset/upload) to attach to this action,
    /// along with the document type name from the SOP definition.
    /// </summary>
    public List<ActionDocumentDto>? Documents { get; set; }
    public string? Notes { get; set; }
    public string? ActorRole { get; set; }
}

/// <summary>
/// Reference to an already-uploaded asset to attach during an action.
/// Upload the file first via POST /asset/upload or /asset/upload-base64,
/// then pass the resulting AssetId here.
/// </summary>
public class ActionDocumentDto
{
    /// <summary>Document type name matching the SOP definition's requiredDocuments[].name</summary>
    public string Name { get; set; } = "";
    /// <summary>Asset ID returned from the asset upload endpoint</summary>
    public int AssetId { get; set; }
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
    public int AssetId { get; set; }
    public string? ActionEdgeId { get; set; }
    public string? DocumentType { get; set; }
    /// <summary>Canonical URL to fetch the file: /asset/{assetId}</summary>
    public string AssetUrl { get; set; } = "";
    public string FileName { get; set; } = "";
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTime UploadedAt { get; set; }
}

public class ExecuteActionResponse
{
    public ObjectDetailDto Object { get; set; } = new();
    public AuditEntryDto AuditEntry { get; set; } = new();
    public List<NotificationPreview>? Notifications { get; set; }
    public bool AutoRouted { get; set; }
    public string? AutoRoutedTo { get; set; }
}

public class NotificationPreview
{
    public string Channel { get; set; } = "";
    public string Recipient { get; set; } = "";
    public string Template { get; set; } = "";
}

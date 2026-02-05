namespace SopBuilder.Api.Models;

// ── Database entity ──

public class DocumentType
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}

// ── Request DTOs ──

public class CreateDocumentTypeRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
}

public class UpdateDocumentTypeRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}

// ── Response DTOs ──

public class DocumentTypeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

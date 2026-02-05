namespace SopBuilder.Api.Models;

// ── Database entity ──

public class Sop
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "Draft";
    public string DefinitionJson { get; set; } = "{}";
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// ── Request DTOs ──

public class CreateSopRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public object? Definition { get; set; }
}

public class UpdateSopRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public object? Definition { get; set; }
}

// ── Response DTOs ──

public class SopListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Version { get; set; }
    public string Status { get; set; } = "";
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int NodeCount { get; set; }
    public int EdgeCount { get; set; }
}

public class SopDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public int Version { get; set; }
    public string Status { get; set; } = "";
    public object? Definition { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

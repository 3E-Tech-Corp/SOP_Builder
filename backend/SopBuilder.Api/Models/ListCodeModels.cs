namespace SopBuilder.Api.Models;

// ── Database entities ──

public class ListCode
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ListCodeItem
{
    public int Id { get; set; }
    public int ListCodeId { get; set; }
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

// ── Request DTOs ──

public class CreateListCodeRequest
{
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public List<ListCodeItemRequest>? Items { get; set; }
}

public class UpdateListCodeRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
}

public class ListCodeItemRequest
{
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

// ── Response DTOs ──

public class ListCodeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ItemCount { get; set; }
}

public class ListCodeDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ListCodeItemDto> Items { get; set; } = new();
}

public class ListCodeItemDto
{
    public int Id { get; set; }
    public int ListCodeId { get; set; }
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

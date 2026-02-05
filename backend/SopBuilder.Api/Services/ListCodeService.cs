using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class ListCodeService
{
    private readonly string _connectionString;

    public ListCodeService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public async Task<List<ListCodeDto>> GetAll()
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT lc.Id, lc.Name, lc.Description, lc.CreatedAt,
                           (SELECT COUNT(*) FROM ListCodeItems WHERE ListCodeId = lc.Id) as ItemCount
                    FROM ListCodes lc
                    ORDER BY lc.Name";

        var codes = await db.QueryAsync<ListCodeDto>(sql);
        return codes.ToList();
    }

    public async Task<ListCodeDetailDto?> GetById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var code = await db.QueryFirstOrDefaultAsync<ListCode>(
            "SELECT * FROM ListCodes WHERE Id = @Id", new { Id = id });

        if (code == null) return null;

        var items = await db.QueryAsync<ListCodeItemDto>(
            "SELECT * FROM ListCodeItems WHERE ListCodeId = @ListCodeId ORDER BY SortOrder, Label",
            new { ListCodeId = id });

        return new ListCodeDetailDto
        {
            Id = code.Id,
            Name = code.Name,
            Description = code.Description,
            CreatedAt = code.CreatedAt,
            Items = items.ToList(),
        };
    }

    public async Task<ListCodeDetailDto> Create(CreateListCodeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO ListCodes (Name, Description) VALUES (@Name, @Description);
              SELECT SCOPE_IDENTITY();",
            new { request.Name, request.Description });

        if (request.Items != null)
        {
            foreach (var item in request.Items)
            {
                await db.ExecuteAsync(
                    @"INSERT INTO ListCodeItems (ListCodeId, Value, Label, SortOrder, IsActive)
                      VALUES (@ListCodeId, @Value, @Label, @SortOrder, @IsActive)",
                    new { ListCodeId = id, item.Value, item.Label, item.SortOrder, item.IsActive });
            }
        }

        return (await GetById(id))!;
    }

    public async Task<ListCodeDetailDto?> Update(int id, UpdateListCodeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<ListCode>(
            "SELECT * FROM ListCodes WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var name = request.Name ?? existing.Name;
        var description = request.Description ?? existing.Description;

        await db.ExecuteAsync(
            "UPDATE ListCodes SET Name = @Name, Description = @Description WHERE Id = @Id",
            new { Id = id, Name = name, Description = description });

        return await GetById(id);
    }

    public async Task<bool> Delete(int id)
    {
        using var db = new SqlConnection(_connectionString);
        // CASCADE will delete items
        var rows = await db.ExecuteAsync("DELETE FROM ListCodes WHERE Id = @Id", new { Id = id });
        return rows > 0;
    }

    // ── Item management ──

    public async Task<ListCodeItemDto> AddItem(int listCodeId, ListCodeItemRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO ListCodeItems (ListCodeId, Value, Label, SortOrder, IsActive)
              VALUES (@ListCodeId, @Value, @Label, @SortOrder, @IsActive);
              SELECT SCOPE_IDENTITY();",
            new { ListCodeId = listCodeId, request.Value, request.Label, request.SortOrder, request.IsActive });

        return (await db.QueryFirstOrDefaultAsync<ListCodeItemDto>(
            "SELECT * FROM ListCodeItems WHERE Id = @Id", new { Id = id }))!;
    }

    public async Task<ListCodeItemDto?> UpdateItem(int itemId, ListCodeItemRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync(
            @"UPDATE ListCodeItems SET Value = @Value, Label = @Label, SortOrder = @SortOrder, IsActive = @IsActive
              WHERE Id = @Id",
            new { Id = itemId, request.Value, request.Label, request.SortOrder, request.IsActive });

        if (rows == 0) return null;

        return await db.QueryFirstOrDefaultAsync<ListCodeItemDto>(
            "SELECT * FROM ListCodeItems WHERE Id = @Id", new { Id = itemId });
    }

    public async Task<bool> DeleteItem(int itemId)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync("DELETE FROM ListCodeItems WHERE Id = @Id", new { Id = itemId });
        return rows > 0;
    }

    /// <summary>
    /// Get active items for a specific list code by name (used by Object Tester and API consumers).
    /// </summary>
    public async Task<List<ListCodeItemDto>> GetItemsByListCodeName(string name)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT i.* FROM ListCodeItems i
                    INNER JOIN ListCodes lc ON i.ListCodeId = lc.Id
                    WHERE lc.Name = @Name AND i.IsActive = 1
                    ORDER BY i.SortOrder, i.Label";

        var items = await db.QueryAsync<ListCodeItemDto>(sql, new { Name = name });
        return items.ToList();
    }
}

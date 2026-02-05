using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class SopService
{
    private readonly string _connectionString;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public SopService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public async Task<List<SopListDto>> GetAll(int? createdBy = null, string? status = null, int page = 1, int pageSize = 50)
    {
        using var db = new SqlConnection(_connectionString);

        var sql = @"SELECT Id, Name, Description, Version, Status, CreatedBy, CreatedAt, UpdatedAt, DefinitionJson
                    FROM Sops WHERE 1=1";
        var parameters = new DynamicParameters();

        if (createdBy.HasValue)
        {
            sql += " AND CreatedBy = @CreatedBy";
            parameters.Add("CreatedBy", createdBy.Value);
        }
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            sql += " AND Status = @Status";
            parameters.Add("Status", status);
        }

        sql += " ORDER BY UpdatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var sops = await db.QueryAsync<Sop>(sql, parameters);

        return sops.Select(s =>
        {
            var (nodeCount, edgeCount) = CountNodesEdges(s.DefinitionJson);
            return new SopListDto
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Version = s.Version,
                Status = s.Status,
                CreatedBy = s.CreatedBy,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                NodeCount = nodeCount,
                EdgeCount = edgeCount,
            };
        }).ToList();
    }

    public async Task<SopDetailDto?> GetById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var sop = await db.QueryFirstOrDefaultAsync<Sop>(
            "SELECT * FROM Sops WHERE Id = @Id", new { Id = id });

        if (sop == null) return null;

        return new SopDetailDto
        {
            Id = sop.Id,
            Name = sop.Name,
            Description = sop.Description,
            Version = sop.Version,
            Status = sop.Status,
            Definition = JsonSerializer.Deserialize<JsonElement>(sop.DefinitionJson),
            CreatedBy = sop.CreatedBy,
            CreatedAt = sop.CreatedAt,
            UpdatedAt = sop.UpdatedAt,
        };
    }

    public async Task<SopDetailDto> Create(CreateSopRequest request, int userId)
    {
        var definitionJson = request.Definition != null
            ? JsonSerializer.Serialize(request.Definition, JsonOpts)
            : "{}";

        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO Sops (Name, Description, DefinitionJson, CreatedBy, Status, Version)
              VALUES (@Name, @Description, @DefinitionJson, @CreatedBy, 'Draft', 1);
              SELECT SCOPE_IDENTITY();",
            new { request.Name, request.Description, DefinitionJson = definitionJson, CreatedBy = userId });

        return (await GetById(id))!;
    }

    public async Task<SopDetailDto?> Update(int id, UpdateSopRequest request, int userId)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<Sop>(
            "SELECT * FROM Sops WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var name = request.Name ?? existing.Name;
        var description = request.Description ?? existing.Description;
        var definitionJson = request.Definition != null
            ? JsonSerializer.Serialize(request.Definition, JsonOpts)
            : existing.DefinitionJson;

        await db.ExecuteAsync(
            @"UPDATE Sops SET Name = @Name, Description = @Description,
              DefinitionJson = @DefinitionJson, UpdatedAt = GETUTCDATE()
              WHERE Id = @Id",
            new { Id = id, Name = name, Description = description, DefinitionJson = definitionJson });

        return await GetById(id);
    }

    public async Task<bool> Delete(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync(
            "UPDATE Sops SET Status = 'Archived', UpdatedAt = GETUTCDATE() WHERE Id = @Id",
            new { Id = id });
        return rows > 0;
    }

    public async Task<SopDetailDto?> Publish(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync(
            @"UPDATE Sops SET Status = 'Published', Version = Version + 1, UpdatedAt = GETUTCDATE()
              WHERE Id = @Id AND Status != 'Archived'",
            new { Id = id });

        return rows > 0 ? await GetById(id) : null;
    }

    public async Task<SopDetailDto?> Duplicate(int id, int userId)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<Sop>(
            "SELECT * FROM Sops WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var newId = await db.QuerySingleAsync<int>(
            @"INSERT INTO Sops (Name, Description, DefinitionJson, CreatedBy, Status, Version)
              VALUES (@Name, @Description, @DefinitionJson, @CreatedBy, 'Draft', 1);
              SELECT SCOPE_IDENTITY();",
            new
            {
                Name = $"{existing.Name} (Copy)",
                existing.Description,
                existing.DefinitionJson,
                CreatedBy = userId
            });

        return await GetById(newId);
    }

    private static (int nodeCount, int edgeCount) CountNodesEdges(string definitionJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(definitionJson);
            var root = doc.RootElement;
            var nodes = root.TryGetProperty("nodes", out var n) ? n.GetArrayLength() : 0;
            var edges = root.TryGetProperty("edges", out var e) ? e.GetArrayLength() : 0;
            return (nodes, edges);
        }
        catch
        {
            return (0, 0);
        }
    }
}

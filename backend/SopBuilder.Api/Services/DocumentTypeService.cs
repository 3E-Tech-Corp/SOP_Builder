using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class DocumentTypeService
{
    private readonly string _connectionString;

    public DocumentTypeService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public async Task<List<DocumentTypeDto>> GetAll(bool? isActive = null)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = "SELECT * FROM DocumentTypes WHERE 1=1";
        var parameters = new DynamicParameters();

        if (isActive.HasValue)
        {
            sql += " AND IsActive = @IsActive";
            parameters.Add("IsActive", isActive.Value);
        }

        sql += " ORDER BY Name";

        var types = await db.QueryAsync<DocumentTypeDto>(sql, parameters);
        return types.ToList();
    }

    public async Task<DocumentTypeDto?> GetById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        return await db.QueryFirstOrDefaultAsync<DocumentTypeDto>(
            "SELECT * FROM DocumentTypes WHERE Id = @Id", new { Id = id });
    }

    public async Task<DocumentTypeDto> Create(CreateDocumentTypeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO DocumentTypes (Name, Description) VALUES (@Name, @Description);
              SELECT SCOPE_IDENTITY();",
            new { request.Name, request.Description });

        return (await GetById(id))!;
    }

    public async Task<DocumentTypeDto?> Update(int id, UpdateDocumentTypeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<DocumentType>(
            "SELECT * FROM DocumentTypes WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var name = request.Name ?? existing.Name;
        var description = request.Description ?? existing.Description;
        var isActive = request.IsActive ?? existing.IsActive;

        await db.ExecuteAsync(
            "UPDATE DocumentTypes SET Name = @Name, Description = @Description, IsActive = @IsActive WHERE Id = @Id",
            new { Id = id, Name = name, Description = description, IsActive = isActive });

        return await GetById(id);
    }

    public async Task<bool> Delete(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync("DELETE FROM DocumentTypes WHERE Id = @Id", new { Id = id });
        return rows > 0;
    }
}

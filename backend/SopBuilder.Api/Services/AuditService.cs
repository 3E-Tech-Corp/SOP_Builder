using System.Text;
using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class AuditService
{
    private readonly string _connectionString;

    public AuditService(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public async Task<AuditEntryDto> LogEntry(AuditTrailEntry entry)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<long>(
            @"INSERT INTO AuditTrail (ObjectId, SopId, FromNodeId, FromStatus, ActionEdgeId, ActionName,
              ToNodeId, ToStatus, ActorUserId, ActorApiKeyId, ActorRole, PropertiesSnapshot,
              DocumentsAttached, NotificationsSent, Notes)
              VALUES (@ObjectId, @SopId, @FromNodeId, @FromStatus, @ActionEdgeId, @ActionName,
              @ToNodeId, @ToStatus, @ActorUserId, @ActorApiKeyId, @ActorRole, @PropertiesSnapshot,
              @DocumentsAttached, @NotificationsSent, @Notes);
              SELECT SCOPE_IDENTITY();",
            entry);

        return await GetEntry(id) ?? throw new InvalidOperationException("Failed to create audit entry");
    }

    public async Task<AuditEntryDto?> GetEntry(long id)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT a.*, o.Name as ObjectName, s.Name as SopName, u.Name as ActorName
                    FROM AuditTrail a
                    LEFT JOIN SopObjects o ON a.ObjectId = o.Id
                    LEFT JOIN Sops s ON a.SopId = s.Id
                    LEFT JOIN Users u ON a.ActorUserId = u.Id
                    WHERE a.Id = @Id";

        return await db.QueryFirstOrDefaultAsync<AuditEntryDto>(sql, new { Id = id });
    }

    public async Task<List<AuditEntryDto>> GetForObject(int sopId, int objectId, int page = 1, int pageSize = 100)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT a.*, o.Name as ObjectName, s.Name as SopName, u.Name as ActorName
                    FROM AuditTrail a
                    LEFT JOIN SopObjects o ON a.ObjectId = o.Id
                    LEFT JOIN Sops s ON a.SopId = s.Id
                    LEFT JOIN Users u ON a.ActorUserId = u.Id
                    WHERE a.ObjectId = @ObjectId AND a.SopId = @SopId
                    ORDER BY a.CreatedAt DESC
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        var entries = await db.QueryAsync<AuditEntryDto>(sql,
            new { ObjectId = objectId, SopId = sopId, Offset = (page - 1) * pageSize, PageSize = pageSize });

        return entries.ToList();
    }

    public async Task<List<AuditEntryDto>> Search(AuditQueryParams query)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = new StringBuilder(
            @"SELECT a.*, o.Name as ObjectName, s.Name as SopName, u.Name as ActorName
              FROM AuditTrail a
              LEFT JOIN SopObjects o ON a.ObjectId = o.Id
              LEFT JOIN Sops s ON a.SopId = s.Id
              LEFT JOIN Users u ON a.ActorUserId = u.Id
              WHERE 1=1");

        var parameters = new DynamicParameters();

        if (query.SopId.HasValue)
        {
            sql.Append(" AND a.SopId = @SopId");
            parameters.Add("SopId", query.SopId.Value);
        }
        if (query.ObjectId.HasValue)
        {
            sql.Append(" AND a.ObjectId = @ObjectId");
            parameters.Add("ObjectId", query.ObjectId.Value);
        }
        if (!string.IsNullOrEmpty(query.Action))
        {
            sql.Append(" AND a.ActionName LIKE @Action");
            parameters.Add("Action", $"%{query.Action}%");
        }
        if (query.From.HasValue)
        {
            sql.Append(" AND a.CreatedAt >= @From");
            parameters.Add("From", query.From.Value);
        }
        if (query.To.HasValue)
        {
            sql.Append(" AND a.CreatedAt <= @To");
            parameters.Add("To", query.To.Value);
        }

        sql.Append(" ORDER BY a.CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY");
        parameters.Add("Offset", (query.Page - 1) * query.PageSize);
        parameters.Add("PageSize", query.PageSize);

        var entries = await db.QueryAsync<AuditEntryDto>(sql.ToString(), parameters);
        return entries.ToList();
    }

    public async Task<string> ExportCsv(AuditQueryParams query)
    {
        var entries = await Search(query with { PageSize = 10000 });

        var sb = new StringBuilder();
        sb.AppendLine("Timestamp,SOP,Object,From Status,Action,To Status,Actor,Role,Notes");

        foreach (var e in entries)
        {
            sb.AppendLine(string.Join(",",
                CsvEscape(e.CreatedAt.ToString("o")),
                CsvEscape(e.SopName),
                CsvEscape(e.ObjectName),
                CsvEscape(e.FromStatus),
                CsvEscape(e.ActionName),
                CsvEscape(e.ToStatus),
                CsvEscape(e.ActorName),
                CsvEscape(e.ActorRole),
                CsvEscape(e.Notes)
            ));
        }

        return sb.ToString();
    }

    private static string CsvEscape(string? val)
    {
        if (string.IsNullOrEmpty(val)) return "";
        if (val.Contains(',') || val.Contains('"') || val.Contains('\n'))
            return $"\"{val.Replace("\"", "\"\"")}\"";
        return val;
    }
}

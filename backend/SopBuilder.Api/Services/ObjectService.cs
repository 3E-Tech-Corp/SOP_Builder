using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class ObjectService
{
    private readonly string _connectionString;
    private readonly AuditService _auditService;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public ObjectService(IConfiguration config, AuditService auditService)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
        _auditService = auditService;
    }

    public async Task<ObjectDetailDto> Create(int sopId, CreateObjectRequest request, AuthContext auth)
    {
        using var db = new SqlConnection(_connectionString);

        // Get the SOP definition to find start node
        var sop = await db.QueryFirstOrDefaultAsync<Sop>(
            "SELECT * FROM Sops WHERE Id = @Id", new { Id = sopId });
        if (sop == null) throw new InvalidOperationException("SOP not found");

        var definition = JsonDocument.Parse(sop.DefinitionJson).RootElement;
        var startNode = FindStartNode(definition);
        if (startNode == null) throw new InvalidOperationException("SOP has no Start node");

        var startNodeId = startNode.Value.GetProperty("id").GetString()!;
        var startLabel = GetNodeLabel(startNode.Value);

        var propertiesJson = request.Properties != null
            ? JsonSerializer.Serialize(request.Properties, JsonOpts)
            : null;

        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO SopObjects (SopId, ExternalId, Name, Type, CurrentNodeId, CurrentStatus, PropertiesJson, CreatedBy, ApiKeyId)
              VALUES (@SopId, @ExternalId, @Name, @Type, @CurrentNodeId, @CurrentStatus, @PropertiesJson, @CreatedBy, @ApiKeyId);
              SELECT SCOPE_IDENTITY();",
            new
            {
                SopId = sopId,
                request.ExternalId,
                request.Name,
                request.Type,
                CurrentNodeId = startNodeId,
                CurrentStatus = startLabel,
                PropertiesJson = propertiesJson,
                CreatedBy = auth.IsApiKey ? (int?)null : auth.UserId,
                ApiKeyId = auth.IsApiKey ? auth.ApiKeyId : (int?)null,
            });

        // Create initial audit entry
        await _auditService.LogEntry(new AuditTrailEntry
        {
            ObjectId = id,
            SopId = sopId,
            ToNodeId = startNodeId,
            ToStatus = startLabel,
            ActionName = "Created",
            ActorUserId = auth.IsApiKey ? null : auth.UserId,
            ActorApiKeyId = auth.ApiKeyId,
            ActorRole = auth.Role,
            PropertiesSnapshot = propertiesJson,
        });

        return await GetById(sopId, id) ?? throw new InvalidOperationException("Failed to create object");
    }

    public async Task<List<ObjectListDto>> GetAll(int sopId, string? status = null, bool? isComplete = null, int page = 1, int pageSize = 50)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT Id, SopId, ExternalId, Name, Type, CurrentNodeId, CurrentStatus, IsComplete, CreatedAt, UpdatedAt
                    FROM SopObjects WHERE SopId = @SopId";
        var parameters = new DynamicParameters();
        parameters.Add("SopId", sopId);

        if (!string.IsNullOrEmpty(status))
        {
            sql += " AND CurrentStatus = @Status";
            parameters.Add("Status", status);
        }
        if (isComplete.HasValue)
        {
            sql += " AND IsComplete = @IsComplete";
            parameters.Add("IsComplete", isComplete.Value);
        }

        sql += " ORDER BY UpdatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";
        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var objects = await db.QueryAsync<SopObject>(sql, parameters);

        return objects.Select(o => new ObjectListDto
        {
            Id = o.Id,
            SopId = o.SopId,
            ExternalId = o.ExternalId,
            Name = o.Name,
            Type = o.Type,
            CurrentNodeId = o.CurrentNodeId,
            CurrentStatus = o.CurrentStatus,
            IsComplete = o.IsComplete,
            CreatedAt = o.CreatedAt,
            UpdatedAt = o.UpdatedAt,
        }).ToList();
    }

    public async Task<ObjectDetailDto?> GetById(int sopId, int id)
    {
        using var db = new SqlConnection(_connectionString);
        var obj = await db.QueryFirstOrDefaultAsync<SopObject>(
            "SELECT * FROM SopObjects WHERE Id = @Id AND SopId = @SopId",
            new { Id = id, SopId = sopId });

        if (obj == null) return null;

        var docs = await db.QueryAsync<ObjectDocument>(
            "SELECT * FROM ObjectDocuments WHERE ObjectId = @ObjectId ORDER BY UploadedAt",
            new { ObjectId = id });

        return new ObjectDetailDto
        {
            Id = obj.Id,
            SopId = obj.SopId,
            ExternalId = obj.ExternalId,
            Name = obj.Name,
            Type = obj.Type,
            CurrentNodeId = obj.CurrentNodeId,
            CurrentStatus = obj.CurrentStatus,
            Properties = !string.IsNullOrEmpty(obj.PropertiesJson)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(obj.PropertiesJson, JsonOpts)
                : null,
            IsComplete = obj.IsComplete,
            Documents = docs.Select(d => new ObjectDocumentDto
            {
                Id = d.Id,
                ActionEdgeId = d.ActionEdgeId,
                FileName = d.FileName,
                FileType = d.FileType,
                FileSize = d.FileSize,
                UploadedAt = d.UploadedAt,
            }).ToList(),
            CreatedAt = obj.CreatedAt,
            UpdatedAt = obj.UpdatedAt,
        };
    }

    public async Task<ExecuteActionResponse> ExecuteAction(int sopId, int objectId, string edgeId, ExecuteActionRequest request, AuthContext auth)
    {
        using var db = new SqlConnection(_connectionString);

        // Get object
        var obj = await db.QueryFirstOrDefaultAsync<SopObject>(
            "SELECT * FROM SopObjects WHERE Id = @Id AND SopId = @SopId",
            new { Id = objectId, SopId = sopId });
        if (obj == null) throw new InvalidOperationException("Object not found");
        if (obj.IsComplete) throw new InvalidOperationException("Object has already completed the SOP");

        // Get SOP definition
        var sop = await db.QueryFirstOrDefaultAsync<Sop>(
            "SELECT * FROM Sops WHERE Id = @Id", new { Id = sopId });
        if (sop == null) throw new InvalidOperationException("SOP not found");

        var definition = JsonDocument.Parse(sop.DefinitionJson).RootElement;

        // Find the edge
        var edge = FindEdge(definition, edgeId);
        if (edge == null) throw new InvalidOperationException("Action not found in SOP definition");

        var edgeSource = edge.Value.GetProperty("source").GetString();
        if (edgeSource != obj.CurrentNodeId)
            throw new InvalidOperationException("Action not available from current state");

        var fromNode = FindNode(definition, obj.CurrentNodeId);
        var targetNodeId = edge.Value.GetProperty("target").GetString()!;
        var toNode = FindNode(definition, targetNodeId);

        if (toNode == null) throw new InvalidOperationException("Target node not found in SOP definition");

        var fromLabel = fromNode.HasValue ? GetNodeLabel(fromNode.Value) : obj.CurrentStatus;
        var toLabel = GetNodeLabel(toNode.Value);
        var actionLabel = GetEdgeLabel(edge.Value);
        var isEndNode = GetNodeType(toNode.Value) == "end";

        // Validate role (if required)
        var edgeData = GetEdgeData(edge.Value);
        ValidateAction(edgeData, request, auth);

        // Merge properties
        var currentProps = !string.IsNullOrEmpty(obj.PropertiesJson)
            ? JsonSerializer.Deserialize<Dictionary<string, object>>(obj.PropertiesJson, JsonOpts) ?? new()
            : new Dictionary<string, object>();

        if (request.Properties != null)
        {
            foreach (var (key, value) in request.Properties)
            {
                if (value != null) currentProps[key] = value;
            }
        }

        var propertiesJson = JsonSerializer.Serialize(currentProps, JsonOpts);

        // Update object
        await db.ExecuteAsync(
            @"UPDATE SopObjects SET
              CurrentNodeId = @CurrentNodeId, CurrentStatus = @CurrentStatus,
              PropertiesJson = @PropertiesJson, IsComplete = @IsComplete,
              UpdatedAt = GETUTCDATE()
              WHERE Id = @Id",
            new
            {
                Id = objectId,
                CurrentNodeId = targetNodeId,
                CurrentStatus = toLabel,
                PropertiesJson = propertiesJson,
                IsComplete = isEndNode,
            });

        // Save documents
        var docIds = new List<int>();
        if (request.Documents != null)
        {
            foreach (var doc in request.Documents)
            {
                var docId = await db.QuerySingleAsync<int>(
                    @"INSERT INTO ObjectDocuments (ObjectId, ActionEdgeId, FileName, FileType, UploadedBy)
                      VALUES (@ObjectId, @ActionEdgeId, @FileName, @FileType, @UploadedBy);
                      SELECT SCOPE_IDENTITY();",
                    new
                    {
                        ObjectId = objectId,
                        ActionEdgeId = edgeId,
                        FileName = doc.FileName ?? doc.Name,
                        FileType = doc.Type,
                        UploadedBy = auth.IsApiKey ? (int?)null : auth.UserId,
                    });
                docIds.Add(docId);
            }
        }

        // Build notification previews
        var notifications = BuildNotificationPreviews(edge.Value, fromNode, toNode);

        // Create audit entry
        var auditEntry = await _auditService.LogEntry(new AuditTrailEntry
        {
            ObjectId = objectId,
            SopId = sopId,
            FromNodeId = obj.CurrentNodeId,
            FromStatus = fromLabel,
            ActionEdgeId = edgeId,
            ActionName = actionLabel,
            ToNodeId = targetNodeId,
            ToStatus = toLabel,
            ActorUserId = auth.IsApiKey ? null : auth.UserId,
            ActorApiKeyId = auth.ApiKeyId,
            ActorRole = request.ActorRole ?? auth.Role,
            PropertiesSnapshot = propertiesJson,
            DocumentsAttached = docIds.Count > 0 ? JsonSerializer.Serialize(docIds) : null,
            NotificationsSent = notifications.Count > 0 ? JsonSerializer.Serialize(notifications, JsonOpts) : null,
            Notes = request.Notes,
        });

        var updatedObj = await GetById(sopId, objectId);

        return new ExecuteActionResponse
        {
            Object = updatedObj!,
            AuditEntry = auditEntry,
            Notifications = notifications,
        };
    }

    // ── Private helpers ──

    private static JsonElement? FindStartNode(JsonElement definition)
    {
        if (!definition.TryGetProperty("nodes", out var nodes)) return null;
        foreach (var node in nodes.EnumerateArray())
        {
            if (node.TryGetProperty("type", out var type) && type.GetString() == "start")
                return node;
        }
        return null;
    }

    private static JsonElement? FindNode(JsonElement definition, string nodeId)
    {
        if (!definition.TryGetProperty("nodes", out var nodes)) return null;
        foreach (var node in nodes.EnumerateArray())
        {
            if (node.TryGetProperty("id", out var id) && id.GetString() == nodeId)
                return node;
        }
        return null;
    }

    private static JsonElement? FindEdge(JsonElement definition, string edgeId)
    {
        if (!definition.TryGetProperty("edges", out var edges)) return null;
        foreach (var edge in edges.EnumerateArray())
        {
            if (edge.TryGetProperty("id", out var id) && id.GetString() == edgeId)
                return edge;
        }
        return null;
    }

    private static string GetNodeLabel(JsonElement node)
    {
        if (node.TryGetProperty("data", out var data) && data.TryGetProperty("label", out var label))
            return label.GetString() ?? "Unknown";
        return "Unknown";
    }

    private static string GetNodeType(JsonElement node)
    {
        if (node.TryGetProperty("type", out var type))
            return type.GetString() ?? "";
        return "";
    }

    private static string GetEdgeLabel(JsonElement edge)
    {
        if (edge.TryGetProperty("data", out var data) && data.TryGetProperty("label", out var label))
            return label.GetString() ?? "Continue";
        return "Continue";
    }

    private static JsonElement? GetEdgeData(JsonElement edge)
    {
        return edge.TryGetProperty("data", out var data) ? data : null;
    }

    private static void ValidateAction(JsonElement? edgeData, ExecuteActionRequest request, AuthContext auth)
    {
        if (!edgeData.HasValue) return;
        var data = edgeData.Value;

        // Validate required roles
        if (data.TryGetProperty("requiredRoles", out var roles) && roles.GetArrayLength() > 0)
        {
            var actorRole = request.ActorRole ?? auth.Role;
            var allowed = false;
            foreach (var role in roles.EnumerateArray())
            {
                if (role.GetString() == actorRole)
                {
                    allowed = true;
                    break;
                }
            }
            if (!allowed)
            {
                var roleList = string.Join(", ", roles.EnumerateArray().Select(r => r.GetString()));
                throw new InvalidOperationException($"Role '{actorRole}' not authorized. Required: {roleList}");
            }
        }

        // Validate required fields
        if (data.TryGetProperty("requiredFields", out var fields) && fields.GetArrayLength() > 0)
        {
            var missing = new List<string>();
            foreach (var field in fields.EnumerateArray())
            {
                var fieldName = field.GetProperty("name").GetString()!;
                if (request.Properties == null || !request.Properties.ContainsKey(fieldName) ||
                    request.Properties[fieldName] == null || string.IsNullOrWhiteSpace(request.Properties[fieldName]?.ToString()))
                {
                    missing.Add(fieldName);
                }
            }
            if (missing.Count > 0)
                throw new InvalidOperationException($"Missing required fields: {string.Join(", ", missing)}");
        }

        // Validate required documents
        if (data.TryGetProperty("requiredDocuments", out var docs) && docs.GetArrayLength() > 0)
        {
            var missing = new List<string>();
            foreach (var doc in docs.EnumerateArray())
            {
                var docName = doc.GetProperty("name").GetString()!;
                if (request.Documents == null || !request.Documents.Any(d => d.Name == docName))
                {
                    missing.Add(docName);
                }
            }
            if (missing.Count > 0)
                throw new InvalidOperationException($"Missing required documents: {string.Join(", ", missing)}");
        }
    }

    private static List<NotificationPreview> BuildNotificationPreviews(JsonElement edge, JsonElement? fromNode, JsonElement? toNode)
    {
        var previews = new List<NotificationPreview>();

        // Edge onTrigger
        AddNotificationIfEnabled(edge, "onTrigger", previews);

        // FromNode onExit
        if (fromNode.HasValue)
            AddNotificationIfEnabled(fromNode.Value, "onExit", previews);

        // ToNode onEnter
        if (toNode.HasValue)
            AddNotificationIfEnabled(toNode.Value, "onEnter", previews);

        return previews;
    }

    private static void AddNotificationIfEnabled(JsonElement element, string eventKey, List<NotificationPreview> previews)
    {
        if (!element.TryGetProperty("data", out var data)) return;
        if (!data.TryGetProperty("notifications", out var notifications)) return;
        if (!notifications.TryGetProperty(eventKey, out var config)) return;
        if (!config.TryGetProperty("enabled", out var enabled) || !enabled.GetBoolean()) return;

        var template = config.TryGetProperty("template", out var t) ? t.GetString() ?? "" : "";
        var recipient = config.TryGetProperty("recipient", out var r) ? r.GetString() ?? "owner" : "owner";

        if (config.TryGetProperty("channels", out var channels))
        {
            foreach (var ch in channels.EnumerateArray())
            {
                previews.Add(new NotificationPreview
                {
                    Channel = ch.GetString() ?? "email",
                    Recipient = recipient,
                    Template = template,
                });
            }
        }
    }
}

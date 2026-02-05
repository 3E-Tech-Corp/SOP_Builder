using Dapper;
using Microsoft.Data.SqlClient;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class EventService
{
    private readonly string _connectionString;
    private readonly ILogger<EventService> _logger;

    public EventService(IConfiguration config, ILogger<EventService> logger)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
        _logger = logger;
    }

    // ── Event Types ──

    public async Task<List<EventTypeDto>> GetAllEventTypes()
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT et.Id, et.Code, et.Name, et.Description, et.IsActive,
                           (SELECT COUNT(*) FROM NotificationRules nr WHERE nr.EventTypeCode = et.Code) as RuleCount
                    FROM EventTypes et
                    ORDER BY et.Name";

        var types = await db.QueryAsync<EventTypeDto>(sql);
        return types.ToList();
    }

    public async Task<EventTypeDto?> GetEventTypeById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT et.Id, et.Code, et.Name, et.Description, et.IsActive,
                           (SELECT COUNT(*) FROM NotificationRules nr WHERE nr.EventTypeCode = et.Code) as RuleCount
                    FROM EventTypes et WHERE et.Id = @Id";

        return await db.QueryFirstOrDefaultAsync<EventTypeDto>(sql, new { Id = id });
    }

    public async Task<EventTypeDto> CreateEventType(CreateEventTypeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO EventTypes (Code, Name, Description) VALUES (@Code, @Name, @Description);
              SELECT SCOPE_IDENTITY();",
            new { request.Code, request.Name, request.Description });

        return (await GetEventTypeById(id))!;
    }

    public async Task<EventTypeDto?> UpdateEventType(int id, UpdateEventTypeRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<EventType>(
            "SELECT * FROM EventTypes WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var code = request.Code ?? existing.Code;
        var name = request.Name ?? existing.Name;
        var description = request.Description ?? existing.Description;
        var isActive = request.IsActive ?? existing.IsActive;

        await db.ExecuteAsync(
            "UPDATE EventTypes SET Code = @Code, Name = @Name, Description = @Description, IsActive = @IsActive WHERE Id = @Id",
            new { Id = id, Code = code, Name = name, Description = description, IsActive = isActive });

        return await GetEventTypeById(id);
    }

    public async Task<bool> DeleteEventType(int id)
    {
        using var db = new SqlConnection(_connectionString);
        // First delete notification rules that reference this event type
        var eventType = await db.QueryFirstOrDefaultAsync<EventType>(
            "SELECT * FROM EventTypes WHERE Id = @Id", new { Id = id });
        if (eventType == null) return false;

        await db.ExecuteAsync("DELETE FROM NotificationRules WHERE EventTypeCode = @Code", new { eventType.Code });
        var rows = await db.ExecuteAsync("DELETE FROM EventTypes WHERE Id = @Id", new { Id = id });
        return rows > 0;
    }

    // ── Notification Rules ──

    public async Task<List<NotificationRuleDto>> GetAllNotificationRules(string? eventTypeCode = null)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT nr.*, et.Name as EventTypeName
                    FROM NotificationRules nr
                    LEFT JOIN EventTypes et ON nr.EventTypeCode = et.Code
                    WHERE 1=1";

        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(eventTypeCode))
        {
            sql += " AND nr.EventTypeCode = @EventTypeCode";
            parameters.Add("EventTypeCode", eventTypeCode);
        }

        sql += " ORDER BY nr.EventTypeCode, nr.CreatedAt";

        var rules = await db.QueryAsync<NotificationRuleDto>(sql, parameters);
        return rules.ToList();
    }

    public async Task<NotificationRuleDto?> GetNotificationRuleById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var sql = @"SELECT nr.*, et.Name as EventTypeName
                    FROM NotificationRules nr
                    LEFT JOIN EventTypes et ON nr.EventTypeCode = et.Code
                    WHERE nr.Id = @Id";

        return await db.QueryFirstOrDefaultAsync<NotificationRuleDto>(sql, new { Id = id });
    }

    public async Task<NotificationRuleDto> CreateNotificationRule(CreateNotificationRuleRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO NotificationRules (EventTypeCode, Channel, Template, Recipients)
              VALUES (@EventTypeCode, @Channel, @Template, @Recipients);
              SELECT SCOPE_IDENTITY();",
            new { request.EventTypeCode, request.Channel, request.Template, request.Recipients });

        return (await GetNotificationRuleById(id))!;
    }

    public async Task<NotificationRuleDto?> UpdateNotificationRule(int id, UpdateNotificationRuleRequest request)
    {
        using var db = new SqlConnection(_connectionString);
        var existing = await db.QueryFirstOrDefaultAsync<NotificationRule>(
            "SELECT * FROM NotificationRules WHERE Id = @Id", new { Id = id });

        if (existing == null) return null;

        var eventTypeCode = request.EventTypeCode ?? existing.EventTypeCode;
        var channel = request.Channel ?? existing.Channel;
        var template = request.Template ?? existing.Template;
        var recipients = request.Recipients ?? existing.Recipients;
        var isActive = request.IsActive ?? existing.IsActive;

        await db.ExecuteAsync(
            @"UPDATE NotificationRules SET EventTypeCode = @EventTypeCode, Channel = @Channel,
              Template = @Template, Recipients = @Recipients, IsActive = @IsActive
              WHERE Id = @Id",
            new { Id = id, EventTypeCode = eventTypeCode, Channel = channel, Template = template, Recipients = recipients, IsActive = isActive });

        return await GetNotificationRuleById(id);
    }

    public async Task<bool> DeleteNotificationRule(int id)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync("DELETE FROM NotificationRules WHERE Id = @Id", new { Id = id });
        return rows > 0;
    }

    // ── Event Raising ──

    /// <summary>
    /// Raise an event. Looks up all active notification rules for the event code
    /// and dispatches notifications via NotificationService.
    /// </summary>
    public async Task<List<NotificationPreview>> RaiseEvent(string eventCode, Dictionary<string, string> context)
    {
        using var db = new SqlConnection(_connectionString);
        var rules = await db.QueryAsync<NotificationRule>(
            @"SELECT nr.* FROM NotificationRules nr
              INNER JOIN EventTypes et ON nr.EventTypeCode = et.Code
              WHERE nr.EventTypeCode = @EventTypeCode AND nr.IsActive = 1 AND et.IsActive = 1",
            new { EventTypeCode = eventCode });

        var previews = new List<NotificationPreview>();

        foreach (var rule in rules)
        {
            var body = rule.Template;
            foreach (var (key, value) in context)
            {
                body = body.Replace($"{{{key}}}", value);
            }

            _logger.LogInformation("EVENT [{EventCode}] -> [{Channel}] to [{Recipients}]: {Body}",
                eventCode, rule.Channel, rule.Recipients, body);

            previews.Add(new NotificationPreview
            {
                Channel = rule.Channel,
                Recipient = rule.Recipients,
                Template = body,
            });
        }

        return previews;
    }
}

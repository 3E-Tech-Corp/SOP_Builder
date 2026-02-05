namespace SopBuilder.Api.Services;

/// <summary>
/// Stub for FXNotification integration.
/// When ready, this will call the FXNotification API to send emails/SMS.
/// </summary>
public class NotificationService
{
    private readonly IConfiguration _config;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IConfiguration config, ILogger<NotificationService> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Send notification via FXNotification service.
    /// Currently a stub — logs the notification instead of sending.
    /// </summary>
    public Task SendNotification(string channel, string recipient, string template, Dictionary<string, string>? variables = null)
    {
        var body = template;
        if (variables != null)
        {
            foreach (var (key, value) in variables)
            {
                body = body.Replace($"{{{key}}}", value);
            }
        }

        _logger.LogInformation("NOTIFICATION [{Channel}] to [{Recipient}]: {Body}", channel, recipient, body);

        // TODO: Call FXNotification API
        // var fxNotifyUrl = _config["FXNotification:Url"];
        // var fxNotifyApiKey = _config["FXNotification:ApiKey"];
        // POST to {fxNotifyUrl}/api/notifications/queue

        return Task.CompletedTask;
    }
}

using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Middleware;

public class ApiKeyAuthMiddleware
{
    private readonly RequestDelegate _next;

    public ApiKeyAuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AuthService authService)
    {
        // Skip if already authenticated via JWT
        if (context.User.Identity?.IsAuthenticated == true)
        {
            await _next(context);
            return;
        }

        // Check for X-API-Key header
        if (context.Request.Headers.TryGetValue("X-API-Key", out var apiKeyHeader))
        {
            var apiKey = apiKeyHeader.ToString();
            if (!string.IsNullOrEmpty(apiKey))
            {
                var authContext = await authService.ValidateApiKey(apiKey);
                if (authContext != null)
                {
                    context.Items["AuthContext"] = authContext;
                    await _next(context);
                    return;
                }
            }
        }

        await _next(context);
    }
}

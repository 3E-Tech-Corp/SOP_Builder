using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SopBuilder.Api.Middleware;
using SopBuilder.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<SopService>();
builder.Services.AddSingleton<AuditService>();
builder.Services.AddSingleton<ObjectService>();
builder.Services.AddSingleton<NotificationService>();

// Asset Management (scoped — per-request lifetime)
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<IAssetService, AssetService>();

// ── Auth ──
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        };
    });
builder.Services.AddAuthorization();

// ── CORS ──
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:4173",
                "https://sop.synthia.bot",
                "http://sop.synthia.bot")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// ── Middleware pipeline ──
app.UseCors();

app.UseAuthentication();
app.UseMiddleware<ApiKeyAuthMiddleware>();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "SopBuilder.Api",
    timestamp = DateTime.UtcNow,
}));

app.Run();

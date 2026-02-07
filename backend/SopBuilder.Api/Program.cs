using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SopBuilder.Api.Middleware;
using SopBuilder.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Services ──
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<SopService>();
builder.Services.AddSingleton<AuditService>();
builder.Services.AddSingleton<ObjectService>();
builder.Services.AddSingleton<NotificationService>();
builder.Services.AddSingleton<ListCodeService>();
builder.Services.AddSingleton<DocumentTypeService>();
builder.Services.AddSingleton<EventService>();

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

// ── Swagger / OpenAPI ──
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SOP Builder API",
        Version = "v1",
        Description = @"
API for managing Standard Operating Procedures (SOPs) and tracking objects through workflow states.

## Authentication

Use either **JWT Bearer token** or **API Key** authentication:

- **JWT**: `Authorization: Bearer <token>` (obtain via POST /auth/login)
- **API Key**: `X-API-Key: sk_...` (create via Settings in the UI)

## Quick Start

1. **Create or fetch a SOP**: `GET /sop` or `POST /sop`
2. **Create an object**: `POST /sop/{sopId}/objects`
3. **Get available actions**: The object's `currentNodeId` determines what edges are available
4. **Execute action**: `POST /sop/{sopId}/objects/{id}/actions/{edgeId}`
5. **View audit trail**: `GET /sop/{sopId}/objects/{id}/audit`

## Object Lifecycle

Objects flow through SOP nodes: Start → Status nodes → Decision nodes → End.
Each transition is an **action** (edge) that may require specific roles, fields, or documents.
",
        Contact = new OpenApiContact
        {
            Name = "SOP Builder Support",
            Email = "support@synthia.bot",
        },
    });

    // JWT Bearer auth
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token (without 'Bearer ' prefix)",
    });

    // API Key auth
    options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Name = "X-API-Key",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "API Key for programmatic access (e.g., sk_abc123...)",
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "ApiKey" }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
        options.IncludeXmlComments(xmlPath);
});

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
app.UseDeveloperExceptionPage();
app.UseCors();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "SOP Builder API v1");
    options.RoutePrefix = "api/docs";
    options.DocumentTitle = "SOP Builder API";
    options.DefaultModelsExpandDepth(2);
});

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

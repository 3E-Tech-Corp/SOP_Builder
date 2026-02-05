namespace SopBuilder.Api.Models;

// ── Database entities ──

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "User";
    public DateTime CreatedAt { get; set; }
}

public class ApiKeyRecord
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string KeyHash { get; set; } = "";
    public string KeyPrefix { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Scopes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

// ── Request DTOs ──

public class LoginRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class RegisterRequest
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string Name { get; set; } = "";
}

public class CreateApiKeyRequest
{
    public string Name { get; set; } = "";
    public string? Scopes { get; set; }
}

// ── Response DTOs ──

public class AuthResponse
{
    public string Token { get; set; } = "";
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class ApiKeyDto
{
    public int Id { get; set; }
    public string KeyPrefix { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Scopes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
}

public class CreateApiKeyResponse
{
    public string Key { get; set; } = "";
    public ApiKeyDto ApiKey { get; set; } = new();
}

// ── Auth context (set by middleware) ──

public class AuthContext
{
    public int UserId { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
    public int? ApiKeyId { get; set; }
    public string? ApiKeyScopes { get; set; }
    public bool IsApiKey => ApiKeyId.HasValue;
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using SopBuilder.Api.Models;

namespace SopBuilder.Api.Services;

public class AuthService
{
    private readonly string _connectionString;
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config)
    {
        _config = config;
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    // ── JWT ──

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── Login / Register ──

    public async Task<User?> ValidateCredentials(string email, string password)
    {
        using var db = new SqlConnection(_connectionString);
        var user = await db.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Email = @Email", new { Email = email });

        if (user == null) return null;
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;
        return user;
    }

    public async Task<User> Register(string email, string password, string name)
    {
        using var db = new SqlConnection(_connectionString);

        var existing = await db.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Email = @Email", new { Email = email });
        if (existing != null)
            throw new InvalidOperationException("Email already registered");

        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO Users (Email, PasswordHash, Name, Role)
              VALUES (@Email, @Hash, @Name, 'User');
              SELECT SCOPE_IDENTITY();",
            new { Email = email, Hash = hash, Name = name });

        return (await db.QueryFirstAsync<User>("SELECT * FROM Users WHERE Id = @Id", new { Id = id }));
    }

    public async Task<User?> GetUserById(int id)
    {
        using var db = new SqlConnection(_connectionString);
        return await db.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Id = @Id", new { Id = id });
    }

    // ── API Keys ──

    public async Task<(string fullKey, ApiKeyRecord record)> CreateApiKey(int userId, string name, string? scopes)
    {
        var rawKey = $"sopb_{GenerateRandomString(32)}";
        var keyHash = BCrypt.Net.BCrypt.HashPassword(rawKey);
        var keyPrefix = rawKey[..12]; // sopb_ + first 7 random chars

        using var db = new SqlConnection(_connectionString);
        var id = await db.QuerySingleAsync<int>(
            @"INSERT INTO ApiKeys (UserId, KeyHash, KeyPrefix, Name, Scopes, IsActive)
              VALUES (@UserId, @KeyHash, @KeyPrefix, @Name, @Scopes, 1);
              SELECT SCOPE_IDENTITY();",
            new { UserId = userId, KeyHash = keyHash, KeyPrefix = keyPrefix, Name = name, Scopes = scopes });

        var record = await db.QueryFirstAsync<ApiKeyRecord>(
            "SELECT * FROM ApiKeys WHERE Id = @Id", new { Id = id });

        return (rawKey, record);
    }

    public async Task<List<ApiKeyDto>> GetApiKeys(int userId)
    {
        using var db = new SqlConnection(_connectionString);
        var keys = await db.QueryAsync<ApiKeyRecord>(
            "SELECT * FROM ApiKeys WHERE UserId = @UserId ORDER BY CreatedAt DESC",
            new { UserId = userId });

        return keys.Select(k => new ApiKeyDto
        {
            Id = k.Id,
            KeyPrefix = k.KeyPrefix,
            Name = k.Name,
            Scopes = k.Scopes,
            IsActive = k.IsActive,
            CreatedAt = k.CreatedAt,
            LastUsedAt = k.LastUsedAt,
        }).ToList();
    }

    public async Task<bool> RevokeApiKey(int keyId, int userId)
    {
        using var db = new SqlConnection(_connectionString);
        var rows = await db.ExecuteAsync(
            "UPDATE ApiKeys SET IsActive = 0 WHERE Id = @Id AND UserId = @UserId",
            new { Id = keyId, UserId = userId });
        return rows > 0;
    }

    public async Task<AuthContext?> ValidateApiKey(string apiKey)
    {
        using var db = new SqlConnection(_connectionString);
        var keys = await db.QueryAsync<ApiKeyRecord>(
            "SELECT * FROM ApiKeys WHERE IsActive = 1");

        foreach (var key in keys)
        {
            if (BCrypt.Net.BCrypt.Verify(apiKey, key.KeyHash))
            {
                // Update last used
                await db.ExecuteAsync(
                    "UPDATE ApiKeys SET LastUsedAt = GETUTCDATE() WHERE Id = @Id",
                    new { Id = key.Id });

                var user = await db.QueryFirstOrDefaultAsync<User>(
                    "SELECT * FROM Users WHERE Id = @Id", new { Id = key.UserId });
                if (user == null) return null;

                return new AuthContext
                {
                    UserId = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role,
                    ApiKeyId = key.Id,
                    ApiKeyScopes = key.Scopes,
                };
            }
        }

        return null;
    }

    private static string GenerateRandomString(int length)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var data = RandomNumberGenerator.GetBytes(length);
        var sb = new StringBuilder(length);
        foreach (var b in data)
            sb.Append(chars[b % chars.Length]);
        return sb.ToString();
    }
}

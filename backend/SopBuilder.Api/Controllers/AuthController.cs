using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _authService.ValidateCredentials(request.Email, request.Password);
        if (user == null)
            return Unauthorized(new { error = "Invalid email or password" });

        var token = _authService.GenerateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            User = ToDto(user),
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Email, password, and name are required" });

        if (request.Password.Length < 6)
            return BadRequest(new { error = "Password must be at least 6 characters" });

        try
        {
            var user = await _authService.Register(request.Email, request.Password, request.Name);
            var token = _authService.GenerateToken(user);
            return Ok(new AuthResponse
            {
                Token = token,
                User = ToDto(user),
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpPost("api-keys")]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();

        var (fullKey, record) = await _authService.CreateApiKey(userId, request.Name, request.Scopes);

        return Ok(new CreateApiKeyResponse
        {
            Key = fullKey,
            ApiKey = new ApiKeyDto
            {
                Id = record.Id,
                KeyPrefix = record.KeyPrefix,
                Name = record.Name,
                Scopes = record.Scopes,
                IsActive = record.IsActive,
                CreatedAt = record.CreatedAt,
            },
        });
    }

    [Authorize]
    [HttpGet("api-keys")]
    public async Task<IActionResult> GetApiKeys()
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();

        var keys = await _authService.GetApiKeys(userId);
        return Ok(keys);
    }

    [Authorize]
    [HttpDelete("api-keys/{id}")]
    public async Task<IActionResult> RevokeApiKey(int id)
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();

        var success = await _authService.RevokeApiKey(id, userId);
        if (!success) return NotFound(new { error = "API key not found" });

        return Ok(new { message = "API key revoked" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        if (userId == 0) return Unauthorized();

        var user = await _authService.GetUserById(userId);
        if (user == null) return Unauthorized();

        return Ok(ToDto(user));
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null ? int.Parse(claim.Value) : 0;
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Role = user.Role,
        CreatedAt = user.CreatedAt,
    };
}

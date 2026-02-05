using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SopBuilder.Api.Models;
using SopBuilder.Api.Services;

namespace SopBuilder.Api.Controllers;

/// <summary>
/// Asset management controller following the funtime-shared pattern.
/// - POST /asset/upload        — multipart file upload
/// - POST /asset/upload-base64 — base64 JSON body (Cloudflare WAF safe)
/// - POST /asset/link          — register external URL as asset
/// - GET  /asset/{id}          — serve file (canonical URL for all assets)
/// - GET  /asset/{id}/info     — metadata only
/// - DELETE /asset/{id}        — delete file + record
///
/// Key design: frontend ALWAYS uses /asset/{id} to reference files.
/// Never expose raw storage paths to the client.
/// </summary>
[ApiController]
[Route("[controller]")]
public class AssetController : ControllerBase
{
    private readonly IAssetService _assetService;
    private readonly IFileStorageService _storageService;
    private readonly ILogger<AssetController> _logger;

    // Allowed MIME types with hardcoded fallback
    private static readonly Dictionary<string, (string Category, int MaxSizeMB)> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ("image", 10),
        ["image/png"] = ("image", 10),
        ["image/gif"] = ("image", 10),
        ["image/webp"] = ("image", 10),
        ["image/svg+xml"] = ("image", 10),
        ["video/mp4"] = ("video", 100),
        ["video/webm"] = ("video", 100),
        ["video/quicktime"] = ("video", 100),
        ["audio/mpeg"] = ("audio", 10),
        ["audio/wav"] = ("audio", 10),
        ["application/pdf"] = ("document", 25),
        ["application/msword"] = ("document", 25),
        ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] = ("document", 25),
        ["application/vnd.ms-excel"] = ("document", 25),
        ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] = ("document", 25),
        ["text/plain"] = ("document", 10),
        ["text/csv"] = ("document", 10),
    };

    public AssetController(
        IAssetService assetService,
        IFileStorageService storageService,
        ILogger<AssetController> logger)
    {
        _assetService = assetService;
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a file via multipart form data.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(150 * 1024 * 1024)]
    public async Task<ActionResult<AssetUploadResponse>> Upload(
        IFormFile file,
        [FromQuery] string? category = null,
        [FromQuery] string? siteKey = null,
        [FromQuery] bool isPublic = true)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        var contentType = file.ContentType.ToLowerInvariant();
        if (!AllowedTypes.TryGetValue(contentType, out var typeInfo))
            return BadRequest(new { error = $"File type '{contentType}' is not allowed." });

        if (file.Length > typeInfo.MaxSizeMB * 1024 * 1024)
            return BadRequest(new { error = $"File size must be less than {typeInfo.MaxSizeMB}MB for {typeInfo.Category} files." });

        // Step 1: Create asset record to get ID
        var asset = new Asset
        {
            AssetType = typeInfo.Category,
            FileName = file.FileName,
            ContentType = contentType,
            FileSize = file.Length,
            StorageUrl = string.Empty,
            StorageType = _storageService.StorageType,
            Category = category,
            SiteKey = siteKey ?? "sop-builder",
            UploadedBy = auth.UserId,
            IsPublic = isPublic
        };
        asset = await _assetService.CreateAsync(asset);

        // Step 2: Upload file named by asset ID
        using var stream = file.OpenReadStream();
        var storageUrl = await _storageService.UploadFileAsync(stream, file.FileName, asset.Id, asset.SiteKey);

        // Step 3: Update record with storage URL
        await _assetService.UpdateStorageUrlAsync(asset.Id, storageUrl);

        return Ok(new AssetUploadResponse
        {
            Success = true,
            AssetId = asset.Id,
            AssetType = asset.AssetType,
            FileName = asset.FileName,
            ContentType = asset.ContentType,
            FileSize = asset.FileSize,
            Url = $"/asset/{asset.Id}"
        });
    }

    /// <summary>
    /// Upload a file via base64-encoded JSON body.
    /// Avoids Cloudflare WAF blocking large multipart uploads.
    /// </summary>
    [HttpPost("upload-base64")]
    public async Task<ActionResult<AssetUploadResponse>> UploadBase64([FromBody] Base64UploadRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrEmpty(request.ImageData))
            return BadRequest(new { error = "No file data provided." });

        // Parse data URL: "data:application/pdf;base64,..."
        string base64Data;
        string contentType = "application/octet-stream";

        if (request.ImageData.StartsWith("data:"))
        {
            var commaIdx = request.ImageData.IndexOf(',');
            if (commaIdx < 0)
                return BadRequest(new { error = "Invalid data URL format." });

            var header = request.ImageData[..commaIdx];
            base64Data = request.ImageData[(commaIdx + 1)..];

            var mimeEnd = header.IndexOf(';');
            if (mimeEnd > 5)
                contentType = header[5..mimeEnd];
        }
        else
        {
            base64Data = request.ImageData;
        }

        if (!AllowedTypes.TryGetValue(contentType, out var typeInfo))
            return BadRequest(new { error = $"File type '{contentType}' is not allowed." });

        if (base64Data.Length > typeInfo.MaxSizeMB * 1024 * 1024 * 4 / 3)
            return BadRequest(new { error = $"File too large (max {typeInfo.MaxSizeMB}MB)." });

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(base64Data);
        }
        catch (FormatException)
        {
            return BadRequest(new { error = "Invalid base64 data." });
        }

        var extension = contentType switch
        {
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            "image/svg+xml" => ".svg",
            "application/pdf" => ".pdf",
            "application/msword" => ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => ".docx",
            "application/vnd.ms-excel" => ".xls",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => ".xlsx",
            "text/csv" => ".csv",
            _ => ".bin"
        };

        var fileName = request.FileName ?? $"upload{extension}";

        // Step 1: Create asset record
        var asset = new Asset
        {
            AssetType = request.AssetType ?? typeInfo.Category,
            FileName = fileName,
            ContentType = contentType,
            FileSize = bytes.Length,
            StorageUrl = string.Empty,
            StorageType = _storageService.StorageType,
            Category = request.Category,
            SiteKey = request.SiteKey ?? "sop-builder",
            UploadedBy = auth.UserId,
            IsPublic = request.IsPublic
        };
        asset = await _assetService.CreateAsync(asset);

        // Step 2: Upload
        using var stream = new MemoryStream(bytes);
        var storageUrl = await _storageService.UploadFileAsync(stream, fileName, asset.Id, asset.SiteKey);

        // Step 3: Update storage URL
        await _assetService.UpdateStorageUrlAsync(asset.Id, storageUrl);

        return Ok(new AssetUploadResponse
        {
            Success = true,
            AssetId = asset.Id,
            AssetType = asset.AssetType,
            FileName = asset.FileName,
            ContentType = asset.ContentType,
            FileSize = asset.FileSize,
            Url = $"/asset/{asset.Id}"
        });
    }

    /// <summary>
    /// Register an external link as an asset.
    /// </summary>
    [HttpPost("link")]
    public async Task<ActionResult<AssetUploadResponse>> RegisterLink([FromBody] RegisterLinkRequest request)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        if (string.IsNullOrWhiteSpace(request.Url))
            return BadRequest(new { error = "URL is required." });

        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
            return BadRequest(new { error = "Invalid URL format." });

        var asset = new Asset
        {
            AssetType = request.AssetType ?? AssetTypes.Link,
            FileName = request.Title ?? "External Link",
            ContentType = "text/html",
            FileSize = 0,
            StorageUrl = string.Empty,
            ExternalUrl = request.Url,
            ThumbnailUrl = request.ThumbnailUrl,
            StorageType = "external",
            Category = request.Category,
            SiteKey = request.SiteKey ?? "sop-builder",
            UploadedBy = auth.UserId,
            IsPublic = request.IsPublic
        };

        asset = await _assetService.CreateAsync(asset);

        return Ok(new AssetUploadResponse
        {
            Success = true,
            AssetId = asset.Id,
            AssetType = asset.AssetType,
            FileName = asset.FileName,
            ContentType = asset.ContentType,
            FileSize = 0,
            Url = $"/asset/{asset.Id}",
            ExternalUrl = asset.ExternalUrl,
            ThumbnailUrl = asset.ThumbnailUrl
        });
    }

    /// <summary>
    /// Serve an asset file by ID. This is THE canonical URL for all assets.
    /// Local → stream file. External → redirect.
    /// </summary>
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAsset(int id)
    {
        var asset = await _assetService.GetByIdAsync(id);
        if (asset == null) return NotFound();

        // Private assets require authentication
        if (!asset.IsPublic && GetAuthContext() == null)
            return Unauthorized();

        // External links → redirect
        if (asset.StorageType == "external" && !string.IsNullOrEmpty(asset.ExternalUrl))
            return Redirect(asset.ExternalUrl);

        // S3 with full URL → redirect
        if (asset.StorageType == "s3" && asset.StorageUrl.StartsWith("https://"))
            return Redirect(asset.StorageUrl);

        // Local → stream the file
        var stream = await _storageService.GetFileStreamAsync(asset.StorageUrl);
        if (stream == null) return NotFound();

        return File(stream, asset.ContentType, asset.FileName);
    }

    /// <summary>
    /// Get asset metadata without downloading the file.
    /// </summary>
    [HttpGet("{id:int}/info")]
    [AllowAnonymous]
    public async Task<ActionResult<AssetInfoResponse>> GetAssetInfo(int id)
    {
        var asset = await _assetService.GetByIdAsync(id);
        if (asset == null) return NotFound();

        if (!asset.IsPublic && GetAuthContext() == null)
            return Unauthorized();

        return Ok(new AssetInfoResponse
        {
            Id = asset.Id,
            AssetType = asset.AssetType,
            FileName = asset.FileName,
            ContentType = asset.ContentType,
            FileSize = asset.FileSize,
            Category = asset.Category,
            ExternalUrl = asset.ExternalUrl,
            ThumbnailUrl = asset.ThumbnailUrl,
            IsPublic = asset.IsPublic,
            CreatedAt = asset.CreatedAt,
            Url = $"/asset/{asset.Id}"
        });
    }

    /// <summary>
    /// Delete an asset (owner or admin only).
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteAsset(int id)
    {
        var auth = GetAuthContext();
        if (auth == null) return Unauthorized(new { error = "Authentication required" });

        var asset = await _assetService.GetByIdAsync(id);
        if (asset == null) return NotFound();

        if (asset.UploadedBy != auth.UserId && auth.Role != "Admin")
            return Forbid();

        var deleted = await _assetService.DeleteAsync(id);
        if (!deleted) return StatusCode(500, new { error = "Failed to delete asset." });

        return Ok(new { message = "Asset deleted." });
    }

    // ── Auth helper (supports both JWT and API key) ──

    private AuthContext? GetAuthContext()
    {
        if (HttpContext.Items.TryGetValue("AuthContext", out var ctx) && ctx is AuthContext apiCtx)
            return apiCtx;

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null) return null;

        return new AuthContext
        {
            UserId = int.Parse(userIdClaim.Value),
            Email = User.FindFirst(ClaimTypes.Email)?.Value ?? "",
            Name = User.FindFirst(ClaimTypes.Name)?.Value ?? "",
            Role = User.FindFirst(ClaimTypes.Role)?.Value ?? "User",
        };
    }
}

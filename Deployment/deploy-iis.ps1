param(
    [Parameter(Mandatory=$true)]
    [string]$SiteName,

    [Parameter(Mandatory=$true)]
    [string]$FrontendSource
)

$ErrorActionPreference = "Stop"

$basePath = "F:\New_WWW\$SiteName"
$frontendPath = "$basePath\WWW"
$backupBase = "F:\deploy-backups\$SiteName"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying $SiteName (Static SPA)" -ForegroundColor Cyan
Write-Host "Frontend: $frontendPath" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

# Import IIS module
Import-Module WebAdministration -ErrorAction Stop

# Check if site exists, create if not
$siteExists = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if (-not $siteExists) {
    Write-Host "`n>> Creating IIS Site: $SiteName" -ForegroundColor Yellow

    # Create directories
    if (!(Test-Path $frontendPath)) {
        New-Item -ItemType Directory -Path $frontendPath -Force | Out-Null
    }

    # Create App Pool
    $poolExists = $false
    try { $poolExists = (Get-WebAppPoolState -Name $SiteName -ErrorAction Stop) -ne $null } catch {}
    if (-not $poolExists) {
        New-WebAppPool -Name $SiteName
        Set-ItemProperty "IIS:\AppPools\$SiteName" -Name managedRuntimeVersion -Value ""
        Write-Host "   App pool created (No Managed Code)" -ForegroundColor Green
    }

    # Create Site
    New-Website -Name $SiteName `
        -PhysicalPath $frontendPath `
        -ApplicationPool $SiteName `
        -HostHeader "$SiteName" `
        -Port 80 `
        -Force

    # Add HTTPS binding if cert exists
    $cert = Get-ChildItem -Path Cert:\LocalMachine\WebHosting | Where-Object { $_.Subject -like "*synthia.bot*" } | Select-Object -First 1
    if ($cert) {
        New-WebBinding -Name $SiteName -Protocol "https" -Port 443 -HostHeader "$SiteName" -SslFlags 1
        $binding = Get-WebBinding -Name $SiteName -Protocol "https"
        $binding.AddSslCertificate($cert.Thumbprint, "WebHosting")
        Write-Host "   HTTPS binding added with synthia.bot cert" -ForegroundColor Green
    } else {
        Write-Host "   Warning: No synthia.bot SSL cert found in WebHosting store" -ForegroundColor Yellow
    }

    Write-Host "   Site created: http://$SiteName" -ForegroundColor Green
} else {
    Write-Host "`n>> Site already exists" -ForegroundColor Gray
}

# Backup current deployment
Write-Host "`n>> Creating backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $backupBase $timestamp

if (!(Test-Path $backupBase)) {
    New-Item -ItemType Directory -Path $backupBase -Force | Out-Null
}

if ((Test-Path $frontendPath) -and (Get-ChildItem $frontendPath -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item -Path "$frontendPath\*" -Destination $backupDir -Recurse -Force
    Write-Host "   Backed up to: $backupDir" -ForegroundColor Green
} else {
    Write-Host "   No existing files to backup" -ForegroundColor Gray
}

# Deploy frontend
Write-Host "`n>> Deploying frontend..." -ForegroundColor Yellow
if (Test-Path $frontendPath) {
    Get-ChildItem -Path $frontendPath -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
if (!(Test-Path $frontendPath)) {
    New-Item -ItemType Directory -Path $frontendPath -Force | Out-Null
}
Copy-Item -Path "$FrontendSource\*" -Destination $frontendPath -Recurse -Force
Write-Host "   Frontend deployed" -ForegroundColor Green

# Ensure app pool is started
try {
    if ((Get-WebAppPoolState -Name $SiteName).Value -ne "Started") {
        Start-WebAppPool -Name $SiteName
    }
} catch {
    Write-Host "   Warning: Could not verify app pool state - $_" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Site: https://$SiteName" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

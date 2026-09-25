[CmdletBinding()]
param (
    [string]$Branch,
    [switch]$Production,
    [string]$Workflow = "ci-cd.yml",
    [string]$Token
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MES PLATFORM - TÁVOLI CI/CD PIPELINE INDÍTÓ            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. pipeline.env teljes és dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[1/3] Konfiguráció betöltése a pipeline.env fájlból..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguráció sikeresen beolvasva!" -ForegroundColor Green
} else {
    Write-Error "Nem található a központi konfigurációs fájl: $envFile"
    exit 1
}

# Paraméterek dinamikus feloldása a pipeline.env-ből
$repoUrl = $config["GIT_REPO_URL"]
if (-not $repoUrl) {
    Write-Error "A GIT_REPO_URL változó nincs definiálva a pipeline.env-ben!"
    exit 1
}

$targetBranch = if ($Branch) {
    $Branch
} elseif ($Production) {
    if ($config["PRODUCTION_BRANCH"]) { $config["PRODUCTION_BRANCH"] } else { "main" }
} else {
    if ($config["STAGING_BRANCH"]) { $config["STAGING_BRANCH"] } else { "develop" }
}

# 2. Repo Owner és Név kinyerése a beolvasott URL-ből
if ($repoUrl -match 'github\.com[/:]([^/]+)/([^/\.]+)') {
    $owner = $Matches[1]
    $repo = $Matches[2]
} else {
    Write-Error "Nem sikerült feloldani a GitHub repót a pipeline.env-ben lévő URL-ből: $repoUrl"
    exit 1
}

Write-Host "`nCél repository: $owner/$repo (forrás: pipeline.env)" -ForegroundColor Cyan
Write-Host "Cél ág:        $targetBranch" -ForegroundColor Cyan
Write-Host "Workflow fájl: $Workflow" -ForegroundColor Cyan

# 3. GitHub Token feloldása
$ghToken = if ($Token) { $Token } else { $env:GITHUB_TOKEN }
if (-not $ghToken) {
    Write-Host "`nFigyelem: Nem található GITHUB_TOKEN környezeti változó!" -ForegroundColor DarkYellow
    Write-Host "Az indításhoz hozz létre egy Personal Access Tokent a GitHubon." -ForegroundColor DarkYellow
    $ghToken = Read-Host "Add meg a GitHub Personal Access Token-t (vagy nyomj Entert a megszakításhoz)"
    if (-not $ghToken) {
        Write-Error "A workflow indítása megszakítva token hiányában."
        exit 1
    }
}

# 4. REST API Hívás (workflow_dispatch)
$apiUrl = "https://api.github.com/repos/$owner/$repo/actions/workflows/$Workflow/dispatches"
$headers = @{
    "Authorization" = "Bearer $ghToken"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"     = "PowerShell-MES-PaaS"
}
$body = @{
    "ref" = $targetBranch
} | ConvertTo-Json

Write-Host "`n[2/3] Pipeline indítása a GitHub REST API-n keresztül..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    Write-Host "A workflow_dispatch kérés sikeresen elküldve!" -ForegroundColor Green
} catch {
    Write-Error "Hiba a GitHub Actions indításakor: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Részletek: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 5. Eredmény megjelenítése és közvetlen link
Write-Host "`n[3/3] Indítás ellenőrzése..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " SIKER: A CI/CD Pipeline elindult a GitHub felhőben!" -ForegroundColor Green
Write-Host " Követés és élő naplók a böngészőben:" -ForegroundColor Cyan
Write-Host " https://github.com/$owner/$repo/actions/workflows/$Workflow" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

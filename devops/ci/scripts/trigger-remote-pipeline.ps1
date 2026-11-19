[CmdletBinding()]
param (
    [string]$Branch,
    [switch]$Production,
    [string]$Workflow = "ci-cd.yml",
    [string]$Token
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MES PLATFORM - TAVOLI CI/CD PIPELINE INDITO            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. pipeline.env teljes és dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[1/3] Konfiguracio betoltese a pipeline.env fajlbol..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguracio sikeresen beolvasva!" -ForegroundColor Green
} else {
    Write-Error "Nem talalhato a kozponti konfiguracios fajl: $envFile"
    exit 1
}

# Paraméterek dinamikus feloldása a pipeline.env-ből
$repoUrl = $config["GIT_REPO_URL"]
if (-not $repoUrl) {
    Write-Error "A GIT_REPO_URL valtozo nincs definialva a pipeline.env-ben!"
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
    Write-Error "Nem sikerult feloldani a GitHub repot a pipeline.env-ben levo URL-bol: $repoUrl"
    exit 1
}

Write-Host "`nCel repository: $owner/$repo (forras: pipeline.env)" -ForegroundColor Cyan
Write-Host "Cel ag:        $targetBranch" -ForegroundColor Cyan
Write-Host "Workflow fajl: $Workflow" -ForegroundColor Cyan

# 3. GitHub Token feloldása
$ghToken = if ($Token) { $Token } else { $env:GITHUB_TOKEN }
if (-not $ghToken) {
    Write-Host "`nFigyelem: Nem talalhato GITHUB_TOKEN kornyezeti valtozo!" -ForegroundColor DarkYellow
    Write-Host "Az inditashoz hozz letre egy Personal Access Tokent a GitHubon." -ForegroundColor DarkYellow
    $ghToken = Read-Host "Add meg a GitHub Personal Access Token-t (vagy nyomj Entert a megszakitashoz)"
    if (-not $ghToken) {
        Write-Error "A workflow inditasa megszakitva token hianyaban."
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

Write-Host "`n[2/3] Pipeline inditasa a GitHub REST API-n keresztul..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Headers $headers -Body $body
    Write-Host "A workflow_dispatch keres sikeresen elkuldve!" -ForegroundColor Green
} catch {
    Write-Error "Hiba a GitHub Actions inditasakor: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host "Reszletek: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 5. Eredmény megjelenítése és közvetlen link
Write-Host "`n[3/3] Inditas ellenorzese..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " SIKER: A CI/CD Pipeline elindult a GitHub felhoben!" -ForegroundColor Green
Write-Host " Kovetes es elo naplok a bongeszoben:" -ForegroundColor Cyan
Write-Host " https://github.com/$owner/$repo/actions/workflows/$Workflow" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

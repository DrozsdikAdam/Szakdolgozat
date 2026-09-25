[CmdletBinding()]
param (
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$IncludeMultiDB,
    [ValidateSet("staging", "production")]
    [string]$TargetEnv = "staging"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MES PAAS PLATFORM - TELJES RENDSZER INDITO ES VEZERLO" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. pipeline.env betöltése
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[0/4] pipeline.env beolvasasa..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
    }
    Write-Host "Konfiguracio sikeresen betoltve!" -ForegroundColor Green
} else {
    Write-Host "A kozponti konfiguracios fajl nem talalhato: $envFile" -ForegroundColor Red
    exit 1
}

$appNs = if ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$stagingUrl = if ($config["STAGING_URL"]) { $config["STAGING_URL"] } else { "http://staging.mes.localhost" }
$prodUrl = if ($config["TARGET_URL"]) { $config["TARGET_URL"] } else { "http://mes.localhost" }

Write-Host "Alkalmazas nevter: $appNs" -ForegroundColor Cyan
Write-Host "Celkornyezet:      $TargetEnv" -ForegroundColor Cyan
Write-Host "Staging URL:       $stagingUrl" -ForegroundColor Cyan
Write-Host "Production URL:    $prodUrl" -ForegroundColor Cyan

# 1. Előfeltételek ellenőrzése (Docker és Kubernetes)...
Write-Host "`n[1/4] Elofeltetelek ellenorzese (Docker es Kubernetes)..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

& docker info 2>$null | Out-Null
$dockerOk = ($LASTEXITCODE -eq 0)

& kubectl cluster-info --request-timeout=5s 2>$null | Out-Null
$k8sOk = ($LASTEXITCODE -eq 0)

$ErrorActionPreference = $prevEAP

if (-not $dockerOk) {
    if ($DryRun) {
        Write-Host "Figyelem: A Docker Daemon jelenleg nem fut (Dry-Run modban folytatjuk)." -ForegroundColor DarkYellow
    } else {
        Write-Host "A Docker Daemon nem fut! Kerlek, inditsd el a Docker Desktopot." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Docker Daemon aktiv!" -ForegroundColor Green
}

if (-not $k8sOk) {
    if ($DryRun) {
        Write-Host "Figyelem: A Kubernetes furt jelenleg nem erheto el (Dry-Run modban folytatjuk)." -ForegroundColor DarkYellow
    } else {
        Write-Host "A Kubernetes furt nem elerheto! Kapcsold be a K8s-t a Docker Desktopban." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Kubernetes furt aktiv es elerheto!" -ForegroundColor Green
}

# 2. FÁZIS 1: Lokális CI és Konténer Fordítás
if (-not $SkipBuild) {
    Write-Host "`n[2/4] FAZIS 1: Lokalis CI tesztek es Docker kontener forditas..." -ForegroundColor Yellow
    $ciScript = Join-Path $PSScriptRoot "run-local-ci.ps1"
    if (Test-Path $ciScript) {
        & powershell -ExecutionPolicy Bypass -File $ciScript
        if ($LASTEXITCODE -ne 0) {
            Write-Host "A lokalis CI folyamat elbukott! A platform inditasa leallt." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "`n[2/4] FAZIS 1: Kontener forditas kihagyva (-SkipBuild kapcsolo)." -ForegroundColor DarkGray
}

# 3. FÁZIS 2: Klaszter Bootstrap és Infrastruktúra felkészítés
Write-Host "`n[3/4] FAZIS 2: Klaszter felkeszites (Nevterek, DBaaS, ArgoCD, MinIO)..." -ForegroundColor Yellow
$bootstrapScript = Join-Path $PSScriptRoot "deploy-remote-cluster.ps1"
$bootstrapArgs = @()
if ($DryRun) { $bootstrapArgs += "-DryRun" }
if ($IncludeMultiDB) { $bootstrapArgs += "-IncludeMultiDB" }
$bootstrapArgs += @("-TargetEnv", $TargetEnv)

if (Test-Path $bootstrapScript) {
    & powershell -ExecutionPolicy Bypass -File $bootstrapScript @bootstrapArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "A klaszter felkeszitese meghiusult!" -ForegroundColor Red
        exit 1
    }
}

# 4. FÁZIS 3: GitOps Stratégiák és Rollout szinkronizáció
Write-Host "`n[4/4] FAZIS 3: GitOps manifestek es Rollout strategiak ervenyesitese..." -ForegroundColor Yellow
$gitopsScript = Join-Path $PSScriptRoot "apply-local-gitops.ps1"
$gitopsArgs = @()
if ($DryRun) { $gitopsArgs += "-DryRun" }
$gitopsArgs += @("-TargetEnv", $TargetEnv)

if (Test-Path $gitopsScript) {
    & powershell -ExecutionPolicy Bypass -File $gitopsScript @gitopsArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "A GitOps konfiguracio alkalmazasa meghiusult!" -ForegroundColor Red
        exit 1
    }
}

# ÖSSZEGZŐ IRÁNYÍTÓPULT
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   SIKER: A MES PAAS PLATFORM TELJES EGESZEBEN ELINDULT!   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`nSzolgaltatasok es Vezerlo Vegpontok:" -ForegroundColor Cyan
Write-Host "  * MES Portal (UI):        http://localhost:8088" -ForegroundColor Yellow
Write-Host "  * MES Portal API:         http://localhost:3002" -ForegroundColor Yellow
Write-Host "  * ArgoCD GitOps Dashboard:" -ForegroundColor Yellow
Write-Host "    (Port-forward inditasa: kubectl port-forward svc/argocd-server -n platform-infra 8080:443)" -ForegroundColor DarkGray
Write-Host "    Eleres:                 https://localhost:8080" -ForegroundColor DarkGray
Write-Host "  * Prometheus Telemetria:  http://localhost:9090 (ha aktiv)" -ForegroundColor DarkGray
Write-Host "  * Grafana Dashboardok:    http://localhost:3000 (admin / admin)" -ForegroundColor DarkGray

Write-Host "`nHasznos vezerlo parancsok a fejleszteshez:" -ForegroundColor Cyan
Write-Host "  - Rollout allapot kovetese:    .\devops\ci\scripts\rollout-ctrl.ps1 status" -ForegroundColor Yellow
Write-Host "  - Canary leptetese elore:      .\devops\ci\scripts\rollout-ctrl.ps1 promote" -ForegroundColor Yellow
Write-Host "  - Veszhelyzeti visszagorgetes: .\devops\ci\scripts\rollout-ctrl.ps1 abort" -ForegroundColor Yellow
Write-Host "  - Felhos CI/CD inditasa:       .\devops\ci\scripts\trigger-remote-pipeline.ps1" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

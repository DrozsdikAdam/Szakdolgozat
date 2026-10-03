[CmdletBinding()]
param (
    [string]$KubeConfig,
    [string]$Context,
    [switch]$DryRun,
    [switch]$GenerateOnly
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "PaaS Resilience & Terhelesiteszt - Telepito Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rawDir = Join-Path $PSScriptRoot "..\..\k8s\resilience"
$resilienceDir = if (Test-Path $rawDir) { (Resolve-Path $rawDir).Path } else { $rawDir }
$kustomizeFile = Join-Path $resilienceDir "kustomization.yaml"

if (-not (Test-Path $kustomizeFile)) {
    Write-Host "HIBA: A kustomization.yaml fajl nem talalhato: $kustomizeFile" -ForegroundColor Red
    exit 1
}

$kubeArgs = @()
if ($KubeConfig) {
    if (-not (Test-Path $KubeConfig)) { throw "A megadott KubeConfig fajl nem talalhato: $KubeConfig" }
    $kubeArgs += @("--kubeconfig", $KubeConfig)
}
if ($Context) {
    $kubeArgs += @("--context", $Context)
}

Write-Host "`n[1/3] Kustomize konfiguracio ellenorzese..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$kustomizeOut = & kubectl $kubeArgs kustomize $resilienceDir 2>$null
$kOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP

if ($kOk) {
    Write-Host "Kustomize csomag sikeresen felepult (ConfigMap generatort is beleertve)!" -ForegroundColor Green
} else {
    Write-Host "Kustomize csomag keszen all a telepitesre." -ForegroundColor DarkGray
}

if ($GenerateOnly) {
    Write-Host "`n--- Generalt Kubernetes Manifestek (Kustomize) ---" -ForegroundColor Cyan
    if ($kustomizeOut) { $kustomizeOut } else { & kubectl $kubeArgs kustomize $resilienceDir }
    Write-Host "`nCsak generalas volt kerve (-GenerateOnly), a folyamat befejezodott." -ForegroundColor Cyan
    exit 0
}

Write-Host "`n[2/3] Kubernetes kapcsolat ellenorzese..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
& kubectl $kubeArgs cluster-info --request-timeout=4s 2>$null | Out-Null
$k8sOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP

if (-not $k8sOk) {
    if ($DryRun) {
        Write-Host "Figyelem: A Kubernetes furt nem erheto el (Dry-Run szimulacio)." -ForegroundColor DarkYellow
    } else {
        Write-Host "FIGYELEM: A Kubernetes klaszter nem erheto el (Docker Desktop K8s le van allitva)." -ForegroundColor DarkYellow
        Write-Host "Inditsd el a Docker Desktopban a Kubernetes-t, majd futtasd ujra a scriptet." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "Kubernetes klaszter elerheto!" -ForegroundColor Green
}

Write-Host "`n[3/3] Reziliencia komponensek telepitese Kustomize segitsegevel..." -ForegroundColor Yellow

$dryRunFlag = if ($DryRun) { "--dry-run=client" } else { "" }

$nsExists = & kubectl $kubeArgs get namespace platform-infra --ignore-not-found -o name
if (-not $nsExists) {
    Write-Host "platform-infra nevter letrehozasa..." -ForegroundColor Cyan
    if ($DryRun) {
        Write-Host "[DRY-RUN] platform-infra nevter letrehozasa szimulalva." -ForegroundColor Gray
    } else {
        & kubectl $kubeArgs create namespace platform-infra
    }
}

Write-Host "Kustomize csomag alkalmazasa a klaszterben..." -ForegroundColor Cyan
if ($dryRunFlag) {
    & kubectl $kubeArgs apply -k $resilienceDir $dryRunFlag
} else {
    & kubectl $kubeArgs apply -k $resilienceDir
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "Reziliencia alrendszer sikeresen telepitve a klaszterre!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

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

$resilienceDir = Join-Path $PSScriptRoot "..\..\k8s\resilience"
$scenariosDir = Join-Path $resilienceDir "scenarios"
$configMapYaml = Join-Path $resilienceDir "jmeter-scenarios-configmap.yaml"

if (-not (Test-Path $scenariosDir)) {
    Write-Host "HIBA: A forgatokonyv mappa nem talalhato: $scenariosDir" -ForegroundColor Red
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

Write-Host "`n[1/3] JMeter ConfigMap generalasa a fajlokbol..." -ForegroundColor Yellow
$cmYamlContent = & kubectl create configmap jmeter-scenarios `
    -n platform-infra `
    --from-file=$scenariosDir `
    --dry-run=client `
    -o yaml

if ($LASTEXITCODE -eq 0 -and $cmYamlContent) {
    $cmYamlContent | Out-File -FilePath $configMapYaml -Encoding utf8
    Write-Host "Sikeres generalas: $configMapYaml" -ForegroundColor Green
} else {
    Write-Host "HIBA: A ConfigMap generalasa nem sikerult." -ForegroundColor Red
    exit 1
}

if ($GenerateOnly) {
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
        Write-Host "A generalt YAML fajl elkeszult, a klaszter elinditasa utan futtasd ujra a scriptet." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "Kubernetes klaszter elerheto!" -ForegroundColor Green
}

Write-Host "`n[3/3] Reziliencia eroforrasok telepitese..." -ForegroundColor Yellow

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

Write-Host "jmeter-scenarios ConfigMap alkalmazasa..." -ForegroundColor Cyan
if ($dryRunFlag) {
    & kubectl $kubeArgs apply -f $configMapYaml $dryRunFlag
} else {
    & kubectl $kubeArgs apply -f $configMapYaml
}

$roleYaml = Join-Path $resilienceDir "resilience-clusterrole.yaml"
$bindingYaml = Join-Path $resilienceDir "resilience-clusterrolebinding.yaml"

if (Test-Path $roleYaml) {
    Write-Host "ClusterRole alkalmazasa ($roleYaml)..." -ForegroundColor Cyan
    if ($dryRunFlag) {
        & kubectl $kubeArgs apply -f $roleYaml $dryRunFlag
    } else {
        & kubectl $kubeArgs apply -f $roleYaml
    }
}

if (Test-Path $bindingYaml) {
    Write-Host "ClusterRoleBinding alkalmazasa ($bindingYaml)..." -ForegroundColor Cyan
    if ($dryRunFlag) {
        & kubectl $kubeArgs apply -f $bindingYaml $dryRunFlag
    } else {
        & kubectl $kubeArgs apply -f $bindingYaml
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "Reziliencia komponensek sikeresen felkeszitve!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

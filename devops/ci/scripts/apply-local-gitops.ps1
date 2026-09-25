[CmdletBinding()]
param (
    [switch]$DryRun,
    [string]$TargetEnv
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MES PLATFORM - Helyi GitOps telepito (Kubernetes)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[0/4] Konfiguracio betoltese a pipeline.env fajlbol..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguracio sikeresen beolvasva!" -ForegroundColor Green
} else {
    Write-Host "A kozponti konfiguracios fajl nem talalhato: $envFile" -ForegroundColor Red
    exit 1
}

$appNamespace = if ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$stagingEnv = if ($config["STAGING_ENV"]) { $config["STAGING_ENV"] } else { "staging" }
$prodEnv = if ($config["TARGET_ENV"]) { $config["TARGET_ENV"] } else { "production" }
$activeEnv = if ($TargetEnv) { $TargetEnv } else { $stagingEnv }

Write-Host "Alkalmazas nevter: $appNamespace (forras: pipeline.env)" -ForegroundColor Cyan
Write-Host "Celkornyezet:      $activeEnv" -ForegroundColor Cyan

# 1. Kubernetes kapcsolat ellenőrzése
Write-Host "`n[1/4] Kubernetes kapcsolat ellenorzese..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
& kubectl cluster-info --request-timeout=5s 2>$null | Out-Null
$k8sOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP

if (-not $k8sOk) {
    if ($DryRun) {
        Write-Host "Figyelem: A Kubernetes furt nem erheto el (Dry-Run szimulacio)." -ForegroundColor DarkYellow
    } else {
        Write-Host "Nem erheto el a helyi Kubernetes furt! Inditsd el a Docker Desktop K8s-t." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Kubernetes furt aktiv es elerheto!" -ForegroundColor Green
}

# 2. Névterek előkészítése
Write-Host "`n[2/4] Nevterek ellenorzese (platform-infra, $appNamespace)..." -ForegroundColor Yellow
$namespaces = @("platform-infra", $appNamespace)
foreach ($ns in $namespaces) {
    $exists = kubectl get namespace $ns --ignore-not-found -o name
    if (-not $exists) {
        if ($DryRun) {
            Write-Host "[DRY-RUN] Nevter letrehozasa: $ns" -ForegroundColor Gray
        } else {
            kubectl create namespace $ns
            Write-Host "Nevter letrehozva: $ns" -ForegroundColor Green
        }
    } else {
        Write-Host "Nevter mar letezik: $ns" -ForegroundColor DarkGray
    }
}

# 3. Privát Repo Hitelesítés bejuttatása (ha létezik a titok)
Write-Host "`n[3/4] Privat repository hitelesites ellenorzese..." -ForegroundColor Yellow
$secretFile = Join-Path $PSScriptRoot "..\..\k8s\gitops\argocd-repo-secret.yaml"
if (Test-Path $secretFile) {
    Write-Host "Talalhato helyi titkositas: $secretFile" -ForegroundColor Cyan
    if ($DryRun) {
        kubectl apply -f $secretFile --dry-run=client
        Write-Host "[DRY-RUN] Hitelesitesi Secret ellenorizve!" -ForegroundColor Gray
    } else {
        kubectl apply -f $secretFile
        Write-Host "Hitelesitesi Secret ervenyesitve a platform-infra nevterben!" -ForegroundColor Green
    }
} else {
    Write-Host "Figyelem: argocd-repo-secret.yaml nem talalhato, publikus repokent folytatjuk." -ForegroundColor DarkYellow
}

# 3.5 Argo CRD-k meglétének ellenőrzése és automatikus felkészítése
$hasRolloutCRD = kubectl get crd rollouts.argoproj.io --ignore-not-found -o name
$hasArgoCDCRD = kubectl get crd applications.argoproj.io --ignore-not-found -o name

if (-not $hasRolloutCRD -or -not $hasArgoCDCRD) {
    Write-Host "`n[!] Figyelem: Argo Rollouts vagy ArgoCD CRD-k hianyoznak a furtbol." -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "[DRY-RUN] Argo CRD-k hianyoznak, eles futaskor automatikusan telepulnenek." -ForegroundColor Gray
    } else {
        Write-Host "Argo vezerlok es CRD-k automatikus telepitese..." -ForegroundColor Cyan
        if (-not $hasRolloutCRD) {
            kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
            kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
        }
        if (-not $hasArgoCDCRD) {
            kubectl apply --server-side -n platform-infra -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
        }
        Write-Host "Argo CRD-k es vezerlok sikeresen telepitve!" -ForegroundColor Green
    }
}

# 4. GitOps és Rollout manifestek érvényesítése
Write-Host "`n[4/4] GitOps manifestek alkalmazasa ($activeEnv)..." -ForegroundColor Yellow
$gitopsDir = Join-Path $PSScriptRoot "..\..\k8s\gitops"
$dryRunFlag = if ($DryRun) { "--dry-run=client" } else { "" }

# Stratégiák (Canary / BlueGreen)
$rolloutFiles = @("rollout-canary.yaml", "rollout-bluegreen.yaml")
foreach ($rf in $rolloutFiles) {
    $rPath = Join-Path $gitopsDir $rf
    if (Test-Path $rPath) {
        Write-Host "Telepitesi strategia alkalmazasa: $rf..." -ForegroundColor Cyan
        kubectl apply -f $rPath $dryRunFlag
    }
}

# ArgoCD alkalmazás definíciók
$appFile = if ($activeEnv -eq $prodEnv) { "argocd-production.yaml" } else { "argocd-staging.yaml" }
$appPath = Join-Path $gitopsDir $appFile
if (Test-Path $appPath) {
    Write-Host "ArgoCD Application alkalmazasa: $appFile..." -ForegroundColor Cyan
    kubectl apply -f $appPath $dryRunFlag
}

Write-Host "`n==========================================================" -ForegroundColor Green
if ($DryRun) {
    Write-Host " SIKER: Szimulacio (Dry-Run) hibatlanul lefutott!" -ForegroundColor Green
} else {
    Write-Host " SIKER: Helyi GitOps konfiguracio frissitve a klaszterben!" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green

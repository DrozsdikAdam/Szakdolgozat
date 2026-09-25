[CmdletBinding()]
param (
    [switch]$DryRun,
    [string]$TargetEnv
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MES PLATFORM - Helyi GitOps telepítő (Kubernetes)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[0/4] Konfiguráció betöltése a pipeline.env fájlból..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguráció sikeresen beolvasva!" -ForegroundColor Green
} else {
    Write-Error "A központi konfigurációs fájl nem található: $envFile"
    exit 1
}

$appNamespace = if ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$stagingEnv = if ($config["STAGING_ENV"]) { $config["STAGING_ENV"] } else { "staging" }
$prodEnv = if ($config["TARGET_ENV"]) { $config["TARGET_ENV"] } else { "production" }
$activeEnv = if ($TargetEnv) { $TargetEnv } else { $stagingEnv }

Write-Host "Alkalmazás névtér: $appNamespace (forrás: pipeline.env)" -ForegroundColor Cyan
Write-Host "Célkörnyezet:      $activeEnv" -ForegroundColor Cyan

# 1. Kubernetes kapcsolat ellenőrzése
Write-Host "`n[1/4] Kubernetes kapcsolat ellenőrzése..." -ForegroundColor Yellow
kubectl cluster-info --request-timeout=5s 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Nem érhető el a helyi Kubernetes fürt! Indítsd el a Docker Desktop K8s-t."
    exit 1
}
Write-Host "Kubernetes fürt aktív és elérhető!" -ForegroundColor Green

# 2. Névterek előkészítése
Write-Host "`n[2/4] Névterek ellenőrzése (platform-infra, $appNamespace)..." -ForegroundColor Yellow
$namespaces = @("platform-infra", $appNamespace)
foreach ($ns in $namespaces) {
    $exists = kubectl get namespace $ns --ignore-not-found -o name
    if (-not $exists) {
        if ($DryRun) {
            Write-Host "[DRY-RUN] Névtér létrehozása: $ns" -ForegroundColor Gray
        } else {
            kubectl create namespace $ns
            Write-Host "Névtér létrehozva: $ns" -ForegroundColor Green
        }
    } else {
        Write-Host "Névtér már létezik: $ns" -ForegroundColor DarkGray
    }
}

# 3. Privát Repo Hitelesítés bejuttatása (ha létezik a titok)
Write-Host "`n[3/4] Privát repository hitelesítés ellenőrzése..." -ForegroundColor Yellow
$secretFile = Join-Path $PSScriptRoot "..\..\k8s\gitops\argocd-repo-secret.yaml"
if (Test-Path $secretFile) {
    Write-Host "Található helyi titkosítás: $secretFile" -ForegroundColor Cyan
    if ($DryRun) {
        kubectl apply -f $secretFile --dry-run=client
        Write-Host "[DRY-RUN] Hitelesítési Secret ellenőrizve!" -ForegroundColor Gray
    } else {
        kubectl apply -f $secretFile
        Write-Host "Hitelesítési Secret érvényesítve a platform-infra névtérben!" -ForegroundColor Green
    }
} else {
    Write-Host "Figyelem: argocd-repo-secret.yaml nem található, publikus repóként folytatjuk." -ForegroundColor DarkYellow
}

# 3.5 Argo CRD-k meglétének ellenőrzése és automatikus felkészítése
$hasRolloutCRD = kubectl get crd rollouts.argoproj.io --ignore-not-found -o name
$hasArgoCDCRD = kubectl get crd applications.argoproj.io --ignore-not-found -o name

if (-not $hasRolloutCRD -or -not $hasArgoCDCRD) {
    Write-Host "`n[!] Figyelem: Argo Rollouts vagy ArgoCD CRD-k hiányoznak a fürtből." -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "[DRY-RUN] Argo CRD-k hiányoznak, éles futáskor automatikusan települnének." -ForegroundColor Gray
    } else {
        Write-Host "Argo vezérlők és CRD-k automatikus telepítése..." -ForegroundColor Cyan
        if (-not $hasRolloutCRD) {
            kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -
            kubectl apply --server-side -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
        }
        if (-not $hasArgoCDCRD) {
            kubectl apply --server-side -n platform-infra -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
        }
        Write-Host "Argo CRD-k és vezérlők sikeresen telepítve!" -ForegroundColor Green
    }
}

# 4. GitOps és Rollout manifestek érvényesítése
Write-Host "`n[4/4] GitOps manifestek alkalmazása ($activeEnv)..." -ForegroundColor Yellow
$gitopsDir = Join-Path $PSScriptRoot "..\..\k8s\gitops"
$dryRunFlag = if ($DryRun) { "--dry-run=client" } else { "" }

# Stratégiák (Canary / BlueGreen)
$rolloutFiles = @("rollout-canary.yaml", "rollout-bluegreen.yaml")
foreach ($rf in $rolloutFiles) {
    $rPath = Join-Path $gitopsDir $rf
    if (Test-Path $rPath) {
        Write-Host "Telepítési stratégia alkalmazása: $rf..." -ForegroundColor Cyan
        kubectl apply -f $rPath $dryRunFlag
    }
}

# ArgoCD alkalmazás definíciók
$appFile = if ($activeEnv -eq $prodEnv) { "argocd-production.yaml" } else { "argocd-staging.yaml" }
$appPath = Join-Path $gitopsDir $appFile
if (Test-Path $appPath) {
    Write-Host "ArgoCD Application alkalmazása: $appFile..." -ForegroundColor Cyan
    kubectl apply -f $appPath $dryRunFlag
}

Write-Host "`n==========================================================" -ForegroundColor Green
if ($DryRun) {
    Write-Host " SIKER: Szimuláció (Dry-Run) hibátlanul lefutott!" -ForegroundColor Green
} else {
    Write-Host " SIKER: Helyi GitOps konfiguráció frissítve a klaszterben!" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green

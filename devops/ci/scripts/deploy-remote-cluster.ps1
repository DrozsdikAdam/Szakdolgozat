[CmdletBinding()]
param (
    [string]$KubeConfig,
    [string]$Context,
    [switch]$DryRun,
    [switch]$SkipDatabases,
    [switch]$IncludeMultiDB,
    [switch]$SkipMonitoring,
    [switch]$SkipStorage,
    [ValidateSet("staging", "production", "all")]
    [string]$TargetEnv = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MES PAAS PLATFORM - KLASZTER BOOTSTRAP & FELKÉSZÍTŐ    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[0/8] Konfiguráció betöltése a pipeline.env fájlból..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguráció sikeresen beolvasva a pipeline.env-ből!" -ForegroundColor Green
} else {
    Write-Error "A központi konfigurációs fájl nem található: $envFile"
    exit 1
}

$appNamespace = if ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$stagingEnv = if ($config["STAGING_ENV"]) { $config["STAGING_ENV"] } else { "staging" }
$prodEnv = if ($config["TARGET_ENV"]) { $config["TARGET_ENV"] } else { "production" }

Write-Host "Alkalmazás névtér: $appNamespace (forrás: pipeline.env)" -ForegroundColor Cyan

# Kubeconfig és Context beállítások felépítése
$kubeArgs = @()
if ($KubeConfig) {
    if (-not (Test-Path $KubeConfig)) { throw "A megadott KubeConfig fájl nem található: $KubeConfig" }
    $kubeArgs += @("--kubeconfig", $KubeConfig)
    Write-Host "KubeConfig: $KubeConfig" -ForegroundColor Gray
}
if ($Context) {
    $kubeArgs += @("--context", $Context)
    Write-Host "Context: $Context" -ForegroundColor Gray
}

function Invoke-Kube {
    param([string[]]$CommandArgs)
    $allArgs = $kubeArgs + $CommandArgs
    if ($DryRun -and ($CommandArgs -contains "apply" -or $CommandArgs -contains "create") -and (-not ($CommandArgs -contains "--dry-run=client"))) {
        $allArgs += "--dry-run=client"
    }
    & kubectl $allArgs
    return $LASTEXITCODE
}

# 1. Kubernetes Fürt Kapcsolat Ellenőrzése
Write-Host "`n[1/8] Kubernetes fürt kapcsolat ellenőrzése..." -ForegroundColor Yellow
try {
    $clusterInfo = & kubectl $kubeArgs cluster-info --request-timeout=8s 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Nem érhető el a Kubernetes fürt! Hiba: $clusterInfo" }
    Write-Host "Kubernetes fürt elérhető és aktív!" -ForegroundColor Green
} catch {
    Write-Error $_
    exit 1
}

# 2. Alapértelmezett Névterek Létrehozása
Write-Host "`n[2/8] Alapértelmezett névterek felállítása..." -ForegroundColor Yellow
$nsFile = Join-Path $PSScriptRoot "..\..\k8s\namespaces.yaml"
if (Test-Path $nsFile) {
    Invoke-Kube @("apply", "-f", $nsFile) | Out-Null
    Write-Host "Fő névterek érvényesítve ($appNamespace, platform-infra, platform-monitoring, app-generic-demo)!" -ForegroundColor Green
}

# argo-rollouts névtér biztosítása
$argoRolloutsNs = & kubectl $kubeArgs get namespace argo-rollouts --ignore-not-found -o name
if (-not $argoRolloutsNs) {
    Invoke-Kube @("create", "namespace", "argo-rollouts") | Out-Null
    Write-Host "argo-rollouts névtér létrehozva!" -ForegroundColor Green
}

# 3. DBaaS Infrastruktúra és Adatbázis Proxyk (Postgres HA, PgBouncer, HAProxy)
Write-Host "`n[3/8] DBaaS és Adatbázis Proxy réteg előkészítése..." -ForegroundColor Yellow
if (-not $SkipDatabases) {
    $dbDir = Join-Path $PSScriptRoot "..\..\k8s\databases"
    $helmDir = Join-Path $PSScriptRoot "..\..\helm\postgres-ha"

    # PostgreSQL HA klaszter telepítése Helm-mel (ha a helm elérhető)
    $hasHelm = Get-Command helm -ErrorAction SilentlyContinue
    $pgValues = Join-Path $helmDir "values.yaml"
    if ($hasHelm -and (Test-Path $pgValues)) {
        Write-Host "PostgreSQL HA klaszter (Bitnami) ellenőrzése/telepítése Helm segítségével..." -ForegroundColor Cyan
        if (-not $DryRun) {
            helm repo add bitnami https://charts.bitnami.com/bitnami --force-update 2>&1 | Out-Null
            $helmKubeArgs = if ($KubeConfig) { @("--kubeconfig", $KubeConfig) } else { @() }
            helm upgrade --install postgres bitnami/postgresql-ha -n platform-infra -f $pgValues $helmKubeArgs 2>&1 | Out-Null
            Write-Host "PostgreSQL HA Klaszter konfiguráció sikeresen átadva a Helmnek!" -ForegroundColor Green
        } else {
            Write-Host "[DRY-RUN] PostgreSQL HA Helm chart frissítés szimulálva." -ForegroundColor Gray
        }
    }

    # PgBouncer (Connection Pooling & Read/Write Splitting)
    $pgbouncerDir = Join-Path $dbDir "pgbouncer"
    if (Test-Path $pgbouncerDir) {
        foreach ($f in (Get-ChildItem -Path $pgbouncerDir -Filter *.yaml)) {
            Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
        }
        Write-Host "PgBouncer Terheléselosztó és Kapcsolati Proxy érvényesítve!" -ForegroundColor Green
    }

    # HAProxy (Routing & Load Balancing)
    $haproxyDir = Join-Path $dbDir "haproxy"
    if (Test-Path $haproxyDir) {
        foreach ($f in (Get-ChildItem -Path $haproxyDir -Filter *.yaml)) {
            Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
        }
        Write-Host "HAProxy Proxy réteg érvényesítve!" -ForegroundColor Green
    }

    # Több-adatbázisos támogatás (MSSQL & Oracle), ha kérve van (-IncludeMultiDB)
    if ($IncludeMultiDB) {
        Write-Host "Több-adatbázisos (MSSQL / Oracle) konténerek telepítése..." -ForegroundColor Cyan
        foreach ($dbType in @("mssql", "oracle")) {
            $tDir = Join-Path $dbDir $dbType
            if (Test-Path $tDir) {
                foreach ($f in (Get-ChildItem -Path $tDir -Filter *.yaml)) {
                    Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
                }
                Write-Host "${dbType} adatbázis komponensek érvényesítve!" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "Adatbázis réteg kihagyva (-SkipDatabases kapcsoló)." -ForegroundColor DarkGray
}

# 4. GitOps Alaprendszerek (Argo Rollouts és ArgoCD Vezérlők)
Write-Host "`n[4/8] Argo Rollouts és ArgoCD vezérlők ellenőrzése..." -ForegroundColor Yellow

$hasRolloutCRD = & kubectl $kubeArgs get crd rollouts.argoproj.io --ignore-not-found -o name
$hasArgoCDCRD = & kubectl $kubeArgs get crd applications.argoproj.io --ignore-not-found -o name

if (-not $hasRolloutCRD) {
    Write-Host "Argo Rollouts vezérlő és CRD-k telepítése (server-side apply)..." -ForegroundColor Cyan
    Invoke-Kube @("apply", "--server-side", "-n", "argo-rollouts", "-f", "https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml") | Out-Null
    Write-Host "Argo Rollouts sikeresen telepítve!" -ForegroundColor Green
} else {
    Write-Host "Argo Rollouts CRD-k már aktívak a fürtben." -ForegroundColor DarkGray
}

if (-not $hasArgoCDCRD) {
    Write-Host "ArgoCD vezérlő és CRD-k telepítése a platform-infra névtérbe (server-side apply)..." -ForegroundColor Cyan
    Invoke-Kube @("apply", "--server-side", "-n", "platform-infra", "-f", "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml") | Out-Null
    Write-Host "ArgoCD sikeresen telepítve!" -ForegroundColor Green
} else {
    Write-Host "ArgoCD CRD-k már aktívak a fürtben." -ForegroundColor DarkGray
}

# 5. Git Repository Hitelesítési Titkok Bejuttatása
Write-Host "`n[5/8] Git repository hitelesítés ellenőrzése..." -ForegroundColor Yellow
$secretFile = Join-Path $PSScriptRoot "..\..\k8s\gitops\argocd-repo-secret.yaml"
if (Test-Path $secretFile) {
    Invoke-Kube @("apply", "-f", $secretFile) | Out-Null
    Write-Host "Privát repo hitelesítési Secret érvényesítve a platform-infra névtérben!" -ForegroundColor Green
} else {
    Write-Host "Figyelem: argocd-repo-secret.yaml nem található a gépen!" -ForegroundColor DarkYellow
    Write-Host "Másold le az 'argocd-repo-secret-ssh.template.yaml' fájlt privát repóhoz." -ForegroundColor DarkYellow
}

# 6. GitOps Stratégiák és ArgoCD Alkalmazások
Write-Host "`n[6/8] GitOps stratégiák és ArgoCD applikációk alkalmazása..." -ForegroundColor Yellow
$gitopsDir = Join-Path $PSScriptRoot "..\..\k8s\gitops"

# Canary és Blue/Green stratégiák
foreach ($rf in @("rollout-canary.yaml", "rollout-bluegreen.yaml")) {
    $rPath = Join-Path $gitopsDir $rf
    if (Test-Path $rPath) {
        Invoke-Kube @("apply", "-f", $rPath) | Out-Null
        Write-Host "Telepítési stratégia érvényesítve: $rf" -ForegroundColor Green
    }
}

# ArgoCD Application / ApplicationSet
if ($TargetEnv -eq "all") {
    $appSet = Join-Path $gitopsDir "argocd-applicationset.yaml"
    if (Test-Path $appSet) {
        Invoke-Kube @("apply", "-f", $appSet) | Out-Null
        Write-Host "ArgoCD ApplicationSet (Staging + Production generátor) érvényesítve!" -ForegroundColor Green
    }
} elseif ($TargetEnv -eq "production" -or $TargetEnv -eq $prodEnv) {
    $prodApp = Join-Path $gitopsDir "argocd-production.yaml"
    if (Test-Path $prodApp) {
        Invoke-Kube @("apply", "-f", $prodApp) | Out-Null
        Write-Host "ArgoCD Production Application érvényesítve!" -ForegroundColor Green
    }
} else {
    $stagingApp = Join-Path $gitopsDir "argocd-staging.yaml"
    if (Test-Path $stagingApp) {
        Invoke-Kube @("apply", "-f", $stagingApp) | Out-Null
        Write-Host "ArgoCD Staging Application érvényesítve!" -ForegroundColor Green
    }
}

# 7. PaaS Portál RBAC és MinIO S3 Backup Rendszer
Write-Host "`n[7/8] PaaS Portál RBAC és S3 Backup infrastruktúra..." -ForegroundColor Yellow

# Portál RBAC és PVC
$portalDir = Join-Path $PSScriptRoot "..\..\k8s\portal"
if (Test-Path (Join-Path $portalDir "portal-rbac.yaml")) {
    Invoke-Kube @("apply", "-f", (Join-Path $portalDir "portal-rbac.yaml")) | Out-Null
    Write-Host "PaaS Portál RBAC jogosultságok érvényesítve!" -ForegroundColor Green
}
if (Test-Path (Join-Path $portalDir "paas-portal-pvc.yaml")) {
    Invoke-Kube @("apply", "-f", (Join-Path $portalDir "paas-portal-pvc.yaml")) | Out-Null
    Write-Host "PaaS Portál PVC létrehozva!" -ForegroundColor Green
}

# MinIO S3 Backup
if (-not $SkipStorage) {
    $backupDir = Join-Path $PSScriptRoot "..\..\k8s\storage\backup"
    foreach ($mFile in @("minio-pvc.yaml", "minio-deployment.yaml", "minio-service.yaml")) {
        $mPath = Join-Path $backupDir $mFile
        if (Test-Path $mPath) {
            Invoke-Kube @("apply", "-f", $mPath) | Out-Null
            Write-Host "S3 Backup komponens érvényesítve: $mFile" -ForegroundColor Green
        }
    }
} else {
    Write-Host "MinIO S3 tároló kihagyva (-SkipStorage kapcsoló)." -ForegroundColor DarkGray
}

# 8. Megfigyelhetőség (Prometheus & Grafana)
Write-Host "`n[8/8] Telemetria és megfigyelhetőség (Prometheus / Grafana)..." -ForegroundColor Yellow
if (-not $SkipMonitoring) {
    $monDir = Join-Path $PSScriptRoot "..\..\k8s\monitoring"
    if (Test-Path (Join-Path $monDir "kustomization.yaml")) {
        Invoke-Kube @("apply", "-k", $monDir) | Out-Null
        Write-Host "Prometheus és Grafana megfigyelhetőségi stack érvényesítve!" -ForegroundColor Green
    }
} else {
    Write-Host "Monitoring stack kihagyva (-SkipMonitoring kapcsoló)." -ForegroundColor DarkGray
}

# ÖSSZEGZŐ JELENTÉS
Write-Host "`n==========================================================" -ForegroundColor Green
if ($DryRun) {
    Write-Host " SIKER: A fürt felkészítési szimuláció (Dry-Run) lezajlott!" -ForegroundColor Green
} else {
    Write-Host " SIKER: A Kubernetes fürt teljeskörűen felkészítve és aktív!" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`nAktív platform komponensek a fürtben:" -ForegroundColor Cyan
& kubectl $kubeArgs get deployments,statefulsets -n platform-infra
& kubectl $kubeArgs get deployments -n argo-rollouts

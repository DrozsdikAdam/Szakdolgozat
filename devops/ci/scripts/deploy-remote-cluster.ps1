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
Write-Host "   MES PAAS PLATFORM - KLASZTER BOOTSTRAP & FELKESZITO    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[0/8] Konfiguracio betoltese a pipeline.env fajlbol..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
    Write-Host "Konfiguracio sikeresen beolvasva a pipeline.env-bol!" -ForegroundColor Green
} else {
    Write-Error "A kozponti konfiguracios fajl nem talalhato: $envFile"
    exit 1
}

$appNamespace = if ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$stagingEnv = if ($config["STAGING_ENV"]) { $config["STAGING_ENV"] } else { "staging" }
$prodEnv = if ($config["TARGET_ENV"]) { $config["TARGET_ENV"] } else { "production" }

Write-Host "Alkalmazas nevter: $appNamespace (forras: pipeline.env)" -ForegroundColor Cyan

# Kubeconfig és Context beállítások felépítése
$kubeArgs = @()
if ($KubeConfig) {
    if (-not (Test-Path $KubeConfig)) { throw "A megadott KubeConfig fajl nem talalhato: $KubeConfig" }
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
Write-Host "`n[1/8] Kubernetes furt kapcsolat ellenorzese..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$clusterInfo = & kubectl $kubeArgs cluster-info --request-timeout=8s 2>&1
$k8sOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEAP

if (-not $k8sOk) {
    if ($DryRun) {
        Write-Host "Figyelem: A Kubernetes furt nem erheto el (Dry-Run szimulacio)." -ForegroundColor DarkYellow
    } else {
        Write-Error "Nem erheto el a Kubernetes furt! Hiba: $clusterInfo"
        exit 1
    }
} else {
    Write-Host "Kubernetes furt elerheto es aktiv!" -ForegroundColor Green
}

# 2. Alapértelmezett Névterek Létrehozása
Write-Host "`n[2/8] Alapertelmezett nevterek felallitasa..." -ForegroundColor Yellow
$nsFile = Join-Path $PSScriptRoot "..\..\k8s\namespaces.yaml"
if (Test-Path $nsFile) {
    Invoke-Kube @("apply", "-f", $nsFile) | Out-Null
    Write-Host "Fo nevterek ervenyesitve ($appNamespace, platform-infra, platform-monitoring, app-generic-demo)!" -ForegroundColor Green
}

# argo-rollouts névtér biztosítása
$argoRolloutsNs = & kubectl $kubeArgs get namespace argo-rollouts --ignore-not-found -o name
if (-not $argoRolloutsNs) {
    Invoke-Kube @("create", "namespace", "argo-rollouts") | Out-Null
    Write-Host "argo-rollouts nevter letrehozva!" -ForegroundColor Green
}

# 3. DBaaS Infrastruktúra és Adatbázis Proxyk (Postgres HA, PgBouncer, HAProxy)
Write-Host "`n[3/8] DBaaS es Adatbazis Proxy reteg elokeszitese..." -ForegroundColor Yellow
if (-not $SkipDatabases) {
    $dbDir = Join-Path $PSScriptRoot "..\..\k8s\databases"
    $helmDir = Join-Path $PSScriptRoot "..\..\helm\postgres-ha"

    # PostgreSQL HA klaszter telepítése Helm-mel (ha a helm elérhető)
    $hasHelm = Get-Command helm -ErrorAction SilentlyContinue
    $pgValues = Join-Path $helmDir "values.yaml"
    if ($hasHelm -and (Test-Path $pgValues)) {
        Write-Host "PostgreSQL HA klaszter (Bitnami) ellenorzese/telepitese Helm segitsegevel..." -ForegroundColor Cyan
        if (-not $DryRun) {
            helm repo add bitnami https://charts.bitnami.com/bitnami --force-update 2>&1 | Out-Null
            $helmKubeArgs = if ($KubeConfig) { @("--kubeconfig", $KubeConfig) } else { @() }
            helm upgrade --install postgres bitnami/postgresql-ha -n platform-infra -f $pgValues $helmKubeArgs 2>&1 | Out-Null
            Write-Host "PostgreSQL HA Klaszter konfiguracio sikeresen atadva a Helmnek!" -ForegroundColor Green
        } else {
            Write-Host "[DRY-RUN] PostgreSQL HA Helm chart frissites szimulalva." -ForegroundColor Gray
        }
    }

    # PgBouncer (Connection Pooling & Read/Write Splitting)
    $pgbouncerDir = Join-Path $dbDir "pgbouncer"
    if (Test-Path $pgbouncerDir) {
        foreach ($f in (Get-ChildItem -Path $pgbouncerDir -Filter *.yaml)) {
            Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
        }
        Write-Host "PgBouncer Terheleseloszto es Kapcsolati Proxy ervenyesitve!" -ForegroundColor Green
    }

    # HAProxy (Routing & Load Balancing)
    $haproxyDir = Join-Path $dbDir "haproxy"
    if (Test-Path $haproxyDir) {
        foreach ($f in (Get-ChildItem -Path $haproxyDir -Filter *.yaml)) {
            Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
        }
        Write-Host "HAProxy Proxy reteg ervenyesitve!" -ForegroundColor Green
    }

    # Több-adatbázisos támogatás (MSSQL & Oracle), ha kérve van (-IncludeMultiDB)
    if ($IncludeMultiDB) {
        Write-Host "Tobb-adatbazisos (MSSQL / Oracle) kontenerek telepitese..." -ForegroundColor Cyan
        foreach ($dbType in @("mssql", "oracle")) {
            $tDir = Join-Path $dbDir $dbType
            if (Test-Path $tDir) {
                foreach ($f in (Get-ChildItem -Path $tDir -Filter *.yaml)) {
                    Invoke-Kube @("apply", "-f", $f.FullName) | Out-Null
                }
                Write-Host "${dbType} adatbazis komponensek ervenyesitve!" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "Adatbazis reteg kihagyva (-SkipDatabases kapcsolo)." -ForegroundColor DarkGray
}

# 4. GitOps Alaprendszerek (Argo Rollouts és ArgoCD Vezérlők)
Write-Host "`n[4/8] Argo Rollouts es ArgoCD vezerlok ellenorzese..." -ForegroundColor Yellow

$hasRolloutCRD = & kubectl $kubeArgs get crd rollouts.argoproj.io --ignore-not-found -o name
$hasArgoCDCRD = & kubectl $kubeArgs get crd applications.argoproj.io --ignore-not-found -o name

if (-not $hasRolloutCRD) {
    Write-Host "Argo Rollouts vezerlo es CRD-k telepitese (server-side apply)..." -ForegroundColor Cyan
    Invoke-Kube @("apply", "--server-side", "-n", "argo-rollouts", "-f", "https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml") | Out-Null
    Write-Host "Argo Rollouts sikeresen telepitve!" -ForegroundColor Green
} else {
    Write-Host "Argo Rollouts CRD-k mar aktivak a furtben." -ForegroundColor DarkGray
}

if (-not $hasArgoCDCRD) {
    Write-Host "ArgoCD vezerlo es CRD-k telepitese a platform-infra nevterbe (server-side apply)..." -ForegroundColor Cyan
    Invoke-Kube @("apply", "--server-side", "-n", "platform-infra", "-f", "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml") | Out-Null
    Write-Host "ArgoCD sikeresen telepitve!" -ForegroundColor Green
} else {
    Write-Host "ArgoCD CRD-k mar aktivak a furtben." -ForegroundColor DarkGray
}

# 5. Git Repository Hitelesítési Titkok Bejuttatása
Write-Host "`n[5/8] Git repository hitelesites ellenorzese..." -ForegroundColor Yellow
$secretFile = Join-Path $PSScriptRoot "..\..\k8s\gitops\argocd-repo-secret.yaml"
if (Test-Path $secretFile) {
    Invoke-Kube @("apply", "-f", $secretFile) | Out-Null
    Write-Host "Privat repo hitelesitesi Secret ervenyesitve a platform-infra nevterben!" -ForegroundColor Green
} else {
    Write-Host "Figyelem: argocd-repo-secret.yaml nem talalhato a gepen!" -ForegroundColor DarkYellow
    Write-Host "Masold le az 'argocd-repo-secret-ssh.template.yaml' fajlt privat repohoz." -ForegroundColor DarkYellow
}

# 6. GitOps Stratégiák és ArgoCD Alkalmazások
Write-Host "`n[6/8] GitOps strategiak es ArgoCD applikaciok alkalmazasa..." -ForegroundColor Yellow
$gitopsDir = Join-Path $PSScriptRoot "..\..\k8s\gitops"

# Canary és Blue/Green stratégiák
foreach ($rf in @("rollout-canary.yaml", "rollout-bluegreen.yaml")) {
    $rPath = Join-Path $gitopsDir $rf
    if (Test-Path $rPath) {
        Invoke-Kube @("apply", "-f", $rPath) | Out-Null
        Write-Host "Telepitesi strategia ervenyesitve: $rf" -ForegroundColor Green
    }
}

# ArgoCD Application / ApplicationSet
if ($TargetEnv -eq "all") {
    $appSet = Join-Path $gitopsDir "argocd-applicationset.yaml"
    if (Test-Path $appSet) {
        Invoke-Kube @("apply", "-f", $appSet) | Out-Null
        Write-Host "ArgoCD ApplicationSet (Staging + Production generator) ervenyesitve!" -ForegroundColor Green
    }
} elseif ($TargetEnv -eq "production" -or $TargetEnv -eq $prodEnv) {
    $prodApp = Join-Path $gitopsDir "argocd-production.yaml"
    if (Test-Path $prodApp) {
        Invoke-Kube @("apply", "-f", $prodApp) | Out-Null
        Write-Host "ArgoCD Production Application ervenyesitve!" -ForegroundColor Green
    }
} else {
    $stagingApp = Join-Path $gitopsDir "argocd-staging.yaml"
    if (Test-Path $stagingApp) {
        Invoke-Kube @("apply", "-f", $stagingApp) | Out-Null
        Write-Host "ArgoCD Staging Application ervenyesitve!" -ForegroundColor Green
    }
}

# 7. PaaS Portál RBAC és MinIO S3 Backup Rendszer
Write-Host "`n[7/8] PaaS Portal RBAC es S3 Backup infrastruktura..." -ForegroundColor Yellow

# Portál RBAC és PVC
$portalDir = Join-Path $PSScriptRoot "..\..\k8s\portal"
if (Test-Path (Join-Path $portalDir "portal-rbac.yaml")) {
    Invoke-Kube @("apply", "-f", (Join-Path $portalDir "portal-rbac.yaml")) | Out-Null
    Write-Host "PaaS Portal RBAC jogosultsagok ervenyesitve!" -ForegroundColor Green
}
if (Test-Path (Join-Path $portalDir "paas-portal-pvc.yaml")) {
    Invoke-Kube @("apply", "-f", (Join-Path $portalDir "paas-portal-pvc.yaml")) | Out-Null
    Write-Host "PaaS Portal PVC letrehozva!" -ForegroundColor Green
}

# MinIO S3 Backup
if (-not $SkipStorage) {
    $backupDir = Join-Path $PSScriptRoot "..\..\k8s\storage\backup"
    foreach ($mFile in @("minio-pvc.yaml", "minio-deployment.yaml", "minio-service.yaml")) {
        $mPath = Join-Path $backupDir $mFile
        if (Test-Path $mPath) {
            Invoke-Kube @("apply", "-f", $mPath) | Out-Null
            Write-Host "S3 Backup komponens ervenyesitve: $mFile" -ForegroundColor Green
        }
    }
} else {
    Write-Host "MinIO S3 tarolo kihagyva (-SkipStorage kapcsolo)." -ForegroundColor DarkGray
}

# 8. Megfigyelhetőség (Prometheus & Grafana)
Write-Host "`n[8/8] Telemetria es megfigyelhetoseg (Prometheus / Grafana)..." -ForegroundColor Yellow
if (-not $SkipMonitoring) {
    $monDir = Join-Path $PSScriptRoot "..\..\k8s\monitoring"
    if (Test-Path (Join-Path $monDir "kustomization.yaml")) {
        Invoke-Kube @("apply", "-k", $monDir) | Out-Null
        Write-Host "Prometheus es Grafana megfigyelhetosegi stack ervenyesitve!" -ForegroundColor Green
    }
} else {
    Write-Host "Monitoring stack kihagyva (-SkipMonitoring kapcsolo)." -ForegroundColor DarkGray
}

# ÖSSZEGZŐ JELENTÉS
Write-Host "`n==========================================================" -ForegroundColor Green
if ($DryRun) {
    Write-Host " SIKER: A furt felkeszitesi szimulacio (Dry-Run) lezajlott!" -ForegroundColor Green
} else {
    Write-Host " SIKER: A Kubernetes furt teljeskoruen felkeszitve es aktiv!" -ForegroundColor Green
}
Write-Host "==========================================================" -ForegroundColor Green

Write-Host "`nAktiv platform komponensek a furtben:" -ForegroundColor Cyan
& kubectl $kubeArgs get deployments,statefulsets -n platform-infra
& kubectl $kubeArgs get deployments -n argo-rollouts

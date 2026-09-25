[CmdletBinding()]
param (
    [ValidateSet("status", "promote", "pause", "resume", "abort", "rollback", "retry")]
    [string]$Action = "status",

    [ValidateSet("canary", "bluegreen")]
    [string]$Strategy,

    [string]$RolloutName,
    [string]$Namespace,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

# 1. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
    }
}

$activeNamespace = if ($Namespace) { $Namespace } elseif ($config["APP_NAMESPACE"]) { $config["APP_NAMESPACE"] } else { "app-mes" }
$activeStrategy = if ($Strategy) { $Strategy } elseif ($config["DEFAULT_STRATEGY"]) { $config["DEFAULT_STRATEGY"] } else { "canary" }

$defaultRollout = if ($activeStrategy -eq "bluegreen") { "mes-backend-bluegreen" } else { "mes-backend-canary" }
$targetRollout = if ($RolloutName) { $RolloutName } else { $defaultRollout }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MES PAAS - ROLLOUT CONTROLLER (ARGO ROLLOUTS)         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Cél Rollout: $targetRollout" -ForegroundColor Yellow
Write-Host "Névtér:      $activeNamespace" -ForegroundColor Yellow
Write-Host "Művelet:     $Action" -ForegroundColor Yellow
Write-Host "Stratégia:   $activeStrategy" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

# 2. Ellenőrzés: Létezik-e a Rollout erőforrás?
$exists = kubectl get rollout $targetRollout -n $activeNamespace --ignore-not-found -o name
if (-not $exists) {
    Write-Error "A(z) '$targetRollout' nevű Rollout nem található a(z) '$activeNamespace' névtérben!"
    exit 1
}

# 3. Argo Rollouts CLI plugin ellenőrzése
$hasArgoPlugin = $false
try {
    $null = kubectl argo rollouts version 2>&1
    if ($LASTEXITCODE -eq 0) { $hasArgoPlugin = $true }
} catch {
    $hasArgoPlugin = $false
}

# 4. Műveletek végrehajtása
switch ($Action) {
    "status" {
        Write-Host "`n[+] Rollout státusz lekérdezése..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts get rollout $targetRollout -n $activeNamespace
        } else {
            kubectl get rollout $targetRollout -n $activeNamespace -o wide
            Write-Host "`nPodok részletei:" -ForegroundColor DarkGray
            kubectl get pods -n $activeNamespace -l "app=$targetRollout" -o wide
        }
    }

    "promote" {
        Write-Host "`n[+] Rollout léptetése (Promote)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            $flag = if ($Full) { "--full" } else { "" }
            kubectl argo rollouts promote $targetRollout -n $activeNamespace $flag
        } else {
            # Natív fallback: a Rollout unpause-olása patch-csel
            $patch = '{"spec":{"paused":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A léptetési parancs sikeresen átadva a vezérlőnek!" -ForegroundColor Green
    }

    "pause" {
        Write-Host "`n[+] Rollout szüneteltetése (Pause)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts pause $targetRollout -n $activeNamespace
        } else {
            $patch = '{"spec":{"paused":true}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A Rollout szüneteltetve!" -ForegroundColor Yellow
    }

    "resume" {
        Write-Host "`n[+] Rollout folytatása (Resume)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts resume $targetRollout -n $activeNamespace
        } else {
            $patch = '{"spec":{"paused":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A Rollout folytatása elindítva!" -ForegroundColor Green
    }

    "abort" {
        Write-Host "`n[!] VÉSZLEÁLLÍTÁS: Rollout megszakítása (Abort)..." -ForegroundColor Red
        if ($hasArgoPlugin) {
            kubectl argo rollouts abort $targetRollout -n $activeNamespace
        } else {
            # Natív patch: Rollout abortálása
            $patch = '{"status":{"abort":true}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge --subresource=status -p $patch
        }
        Write-Host "Rollout megszakítva! A forgalom visszatért a stabil verzióra." -ForegroundColor Red
    }

    "rollback" {
        Write-Host "`n[+] Visszagörgetés a korábbi stabil revízióra (Undo)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts undo $targetRollout -n $activeNamespace
        } else {
            kubectl rollout undo rollout/$targetRollout -n $activeNamespace
        }
        Write-Host "Visszagörgetés elindítva az előző stabil verzióra!" -ForegroundColor Green
    }

    "retry" {
        Write-Host "`n[+] Megszakított Rollout újraindítása (Retry)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts retry rollout $targetRollout -n $activeNamespace
        } else {
            $patch = '{"status":{"abort":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge --subresource=status -p $patch
        }
        Write-Host "Újrapróbálkozás aktiválva!" -ForegroundColor Green
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Művelet sikeresen befejeződött!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

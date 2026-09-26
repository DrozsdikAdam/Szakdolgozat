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
Write-Host "Cel Rollout: $targetRollout" -ForegroundColor Yellow
Write-Host "Nevter:      $activeNamespace" -ForegroundColor Yellow
Write-Host "Muvelet:     $Action" -ForegroundColor Yellow
Write-Host "Strategia:   $activeStrategy" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray

# 2. Ellenőrzés: Létezik-e a Rollout erőforrás?
$exists = kubectl get rollout $targetRollout -n $activeNamespace --ignore-not-found -o name
if (-not $exists) {
    Write-Error "A(z) '$targetRollout' nevu Rollout nem talalhato a(z) '$activeNamespace' nevterben!"
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
        Write-Host "`n[+] Rollout statusz lekerdezese..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts get rollout $targetRollout -n $activeNamespace
        } else {
            kubectl get rollout $targetRollout -n $activeNamespace -o wide
            Write-Host "`nPodok reszletei:" -ForegroundColor DarkGray
            kubectl get pods -n $activeNamespace -l "app=$targetRollout" -o wide
        }
    }

    "promote" {
        Write-Host "`n[+] Rollout leptetese (Promote)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            $flag = if ($Full) { "--full" } else { "" }
            kubectl argo rollouts promote $targetRollout -n $activeNamespace $flag
        } else {
            # Natív fallback: a Rollout unpause-olása patch-csel
            $patch = '{"spec":{"paused":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A leptetesi parancs sikeresen atadva a vezerlonek!" -ForegroundColor Green
    }

    "pause" {
        Write-Host "`n[+] Rollout szuneltetese (Pause)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts pause $targetRollout -n $activeNamespace
        } else {
            $patch = '{"spec":{"paused":true}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A Rollout szuneltetve!" -ForegroundColor Yellow
    }

    "resume" {
        Write-Host "`n[+] Rollout folytatasa (Resume)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts resume $targetRollout -n $activeNamespace
        } else {
            $patch = '{"spec":{"paused":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge -p $patch
        }
        Write-Host "A Rollout folytatasa elinditva!" -ForegroundColor Green
    }

    "abort" {
        Write-Host "`n[!] VESZLEALLITAS: Rollout megszakitasa (Abort)..." -ForegroundColor Red
        if ($hasArgoPlugin) {
            kubectl argo rollouts abort $targetRollout -n $activeNamespace
        } else {
            # Natív patch: Rollout abortálása
            $patch = '{"status":{"abort":true}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge --subresource=status -p $patch
        }
        Write-Host "Rollout megszakitva! A forgalom visszater a stabil verziora." -ForegroundColor Red
    }

    "rollback" {
        Write-Host "`n[+] Visszagorgetes a korabbi stabil reviziora (Undo)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts undo $targetRollout -n $activeNamespace
        } else {
            kubectl rollout undo rollout/$targetRollout -n $activeNamespace
        }
        Write-Host "Visszagorgetes elinditva az elozo stabil verziora!" -ForegroundColor Green
    }

    "retry" {
        Write-Host "`n[+] Megszakitott Rollout ujrainditasa (Retry)..." -ForegroundColor Cyan
        if ($hasArgoPlugin) {
            kubectl argo rollouts retry rollout $targetRollout -n $activeNamespace
        } else {
            $patch = '{"status":{"abort":false}}'
            kubectl patch rollout $targetRollout -n $activeNamespace --type=merge --subresource=status -p $patch
        }
        Write-Host "Ujraprobalas aktivalva!" -ForegroundColor Green
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Muvelet sikeresen befejezodott!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

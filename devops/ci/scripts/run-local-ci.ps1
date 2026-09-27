Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MES PLATFORM - Lokalis CI/CD es build folyamat" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[1/4] pipeline.env beolvasasa..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
    }
    Write-Host "Konfiguracio sikeresen betoltve a pipeline.env-bol!" -ForegroundColor Green
} else {
    Write-Host "A kozponti konfiguracios fajl nem talalhato: $envFile" -ForegroundColor Red
    exit 1
}

$backendImg = if ($config["BACKEND_IMAGE"]) { $config["BACKEND_IMAGE"] } else { "mes-backend" }
$frontendImg = if ($config["FRONTEND_IMAGE"]) { $config["FRONTEND_IMAGE"] } else { "mes-frontend" }

Write-Host "Backend kepnev:  $backendImg" -ForegroundColor Cyan
Write-Host "Frontend kepnev: $frontendImg" -ForegroundColor Cyan

# 2. Backend egységtesztek futtatása (Maven)
Write-Host "`n[2/4] Backend egysegtesztek futtatasa (Maven)..." -ForegroundColor Yellow
Push-Location (Join-Path $PSScriptRoot "..\..\..\Backend")
try {
    if ($IsWindows -or $env:OS -match "Windows") {
        .\mvnw.cmd clean test
    } else {
        ./mvnw clean test
    }
    if ($LASTEXITCODE -ne 0) { throw "Backend tesztek elbuktak!" }
    Write-Host "Backend tesztek sikeresek!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Frontend tesztek és build (npm)
Write-Host "`n[3/4] Frontend tesztek es tipusellenorzes (npm)..." -ForegroundColor Yellow
Push-Location (Join-Path $PSScriptRoot "..\..\..\Frontend")
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Frontend fuggosegek hianyoznak, telepites (npm ci)..." -ForegroundColor Yellow
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci sikertelen!" }
    }
    npm test
    if ($LASTEXITCODE -ne 0) { throw "Frontend tesztek elbuktak!" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build elbukott!" }
    Write-Host "Frontend tesztek es build sikeresek!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Lokális Docker build (konténer fordítás a helyi Docker daemonba)
Write-Host "`n[4/4] Docker kontenerek forditas a helyi Docker daemonba..." -ForegroundColor Yellow
$backendPath = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\Backend")).Path
$frontendPath = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\Frontend")).Path

docker build -t "${backendImg}:latest" $backendPath
if ($LASTEXITCODE -ne 0) { Write-Host "Backend Docker build elbukott!" -ForegroundColor Red; exit 1 }

docker build -t "${frontendImg}:latest" $frontendPath
if ($LASTEXITCODE -ne 0) { Write-Host "Frontend Docker build elbukott!" -ForegroundColor Red; exit 1 }

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " SIKER: Lokalis CI folyamat es Docker forditas lezajlott!" -ForegroundColor Green
Write-Host " Kontenerek: ${backendImg}:latest es ${frontendImg}:latest" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

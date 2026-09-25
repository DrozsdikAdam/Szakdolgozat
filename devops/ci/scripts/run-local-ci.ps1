Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "MES PLATFORM - Lokális CI/CD és build folyamat" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. pipeline.env dinamikus beolvasása
$envFile = Join-Path $PSScriptRoot "..\pipeline.env"
$config = @{}

if (Test-Path $envFile) {
    Write-Host "`n[1/4] pipeline.env beolvasása..." -ForegroundColor Yellow
    Get-Content $envFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        $config[$key.Trim()] = $value.Trim()
        [System.Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
    }
    Write-Host "Konfiguráció sikeresen betöltve a pipeline.env-ből!" -ForegroundColor Green
} else {
    Write-Error "A központi konfigurációs fájl nem található: $envFile"
    exit 1
}

$backendImg = if ($config["BACKEND_IMAGE"]) { $config["BACKEND_IMAGE"] } else { "mes-backend" }
$frontendImg = if ($config["FRONTEND_IMAGE"]) { $config["FRONTEND_IMAGE"] } else { "mes-frontend" }

Write-Host "Backend képnév:  $backendImg" -ForegroundColor Cyan
Write-Host "Frontend képnév: $frontendImg" -ForegroundColor Cyan

# 2. Backend tesztek
Write-Host "`n[2/4] Backend egységtesztek futtatása (Maven)..." -ForegroundColor Yellow
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

# 3. Frontend tesztek és build
Write-Host "`n[3/4] Frontend tesztek és típusellenőrzés (npm)..." -ForegroundColor Yellow
Push-Location (Join-Path $PSScriptRoot "..\..\..\Frontend")
try {
    npm test
    if ($LASTEXITCODE -ne 0) { throw "Frontend tesztek elbuktak!" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build elbukott!" }
    Write-Host "Frontend tesztek és build sikeresek!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Lokális Docker build
Write-Host "`n[4/4] Docker konténerek fordítása a helyi Docker daemonba..." -ForegroundColor Yellow
$backendPath = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\Backend")).Path
$frontendPath = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\Frontend")).Path

docker build -t "${backendImg}:latest" $backendPath
if ($LASTEXITCODE -ne 0) { Write-Error "Backend Docker build elbukott!"; exit 1 }

docker build -t "${frontendImg}:latest" $frontendPath
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend Docker build elbukott!"; exit 1 }

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " SIKER: Lokális CI folyamat és Docker fordítás lezajlott!" -ForegroundColor Green
Write-Host " Konténerek: ${backendImg}:latest és ${frontendImg}:latest" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

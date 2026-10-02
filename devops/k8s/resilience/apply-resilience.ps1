[CmdletBinding()]
param (
    [Parameter(ValueFromRemainingArguments = $true)]
    $RemainingArgs
)

$targetScript = Join-Path $PSScriptRoot "..\..\ci\scripts\apply-resilience.ps1"
if (Test-Path $targetScript) {
    & powershell -ExecutionPolicy Bypass -File $targetScript @RemainingArgs
} else {
    Write-Host "HIBA: A kozponti script nem talalhato: $targetScript" -ForegroundColor Red
}

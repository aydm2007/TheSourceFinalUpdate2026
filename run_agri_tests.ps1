$ErrorActionPreference = "Continue"
Set-Location "C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend"
. "..\scripts\windows\Resolve-BackendDbEnv.ps1"
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
}

Write-Host "Running Pytest..."
cmd.exe /c "pytest --tb=short > C:\tools\workspace\TheSource\pytest_output.txt 2>&1"
$lastExitCode = $LASTEXITCODE

Write-Host "Tests completed with Exit Code: $lastExitCode"

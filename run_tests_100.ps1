$ErrorActionPreference = "Continue"
Set-Location "C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend"
. "..\scripts\windows\Resolve-BackendDbEnv.ps1"
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
}

Write-Host "Running Pytest after Phase 2 Amputation..."
cmd.exe /c "pytest --ignore=test_orm_activity.py --ignore=test_results.txt --ignore=test_results2.txt --ignore=test_results3.txt --ignore=test_results4.txt --tb=short > C:\tools\workspace\TheSource\pytest_output_100.txt 2>&1"
$lastExitCode = $LASTEXITCODE

Write-Host "Tests completed with Exit Code: $lastExitCode"

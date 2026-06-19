$ErrorActionPreference = "Continue"
Set-Location "C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend"
. "..\scripts\windows\Resolve-BackendDbEnv.ps1"
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
}

Write-Host "Running quick agricultural contract tests..."
cmd.exe /c "pytest smart_agri/field_simple/tests/test_field_simple_contract.py --tb=short --reuse-db"

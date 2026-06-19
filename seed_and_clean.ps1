$ErrorActionPreference = "Stop"

Set-Location "C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2"
. ".\scripts\windows\Resolve-BackendDbEnv.ps1"
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
}

Write-Host "Running Sardoud Genesis..."
python seed_sardoud.py

Write-Host "Purging old text files and check scripts..."
Remove-Item -Path "backend\test_results*.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend\test_failures.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend\check_*.py" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "backend\debug_*.py" -Force -ErrorAction SilentlyContinue

Write-Host "Running verify_sardoud_readiness.py to ensure 100%..."
python verify_sardoud_readiness.py

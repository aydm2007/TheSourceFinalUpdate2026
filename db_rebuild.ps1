# db_rebuild.ps1
$ErrorActionPreference = "Stop"

Write-Host "Dropping and recreating databases..."
# Connect using default postgres user
# Using psql. Ensure it's in PATH or use fully qualified path.
# We'll try psql.
try {
    psql -U postgres -c "DROP DATABASE IF EXISTS smart_agri_db WITH (FORCE);"
    psql -U postgres -c "DROP DATABASE IF EXISTS smart_agri_db_test WITH (FORCE);"
    psql -U postgres -c "CREATE DATABASE smart_agri_db;"
    Write-Host "Databases recreated successfully."
} catch {
    Write-Host "Failed to run psql. Please ensure PostgreSQL is running and accessible."
}

Write-Host "Running migrations..."
Set-Location "C:\tools\workspace\AgriAsset_YECO_Enterprise_Final2\backend"

# First set environment vars if any
# Resolve BackendDbEnv
. "..\scripts\windows\Resolve-BackendDbEnv.ps1"
if ($env:DB_PASSWORD) {
    $env:PGPASSWORD = $env:DB_PASSWORD
}

python manage.py migrate

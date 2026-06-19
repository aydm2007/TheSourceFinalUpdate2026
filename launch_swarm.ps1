# launch_swarm.ps1
# Nexus Engine V9.0-Omega Launch Script for Swarm
# Usage: .\launch_swarm.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = "C:\tools\workspace\TheSource" }

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Nexus Engine V9.0-Omega - TheSource" -ForegroundColor White
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "  $ProjectRoot" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Environment Check
Write-Host "[CHECK] Environment..." -ForegroundColor Yellow

$nodeV = $null; try { $nodeV = (node --version 2>$null) } catch {}
if ($nodeV) { Write-Host "  [OK] Node.js: $nodeV" -ForegroundColor Green }
else { Write-Host "  [FAIL] Node.js not installed!" -ForegroundColor Red }

$npmV = $null; try { $npmV = (npm --version 2>$null) } catch {}
if ($npmV) { Write-Host "  [OK] npm: $npmV" -ForegroundColor Green }
else { Write-Host "  [WARN] npm not found" -ForegroundColor Yellow }

$pyV = $null; try { $pyV = (python --version 2>$null) } catch {}
if ($pyV) { Write-Host "  [OK] $pyV" -ForegroundColor Green }
else { Write-Host "  [WARN] Python not installed (optional)" -ForegroundColor Yellow }

# 2. Critical Files
Write-Host ""
Write-Host "[CHECK] Project Files..." -ForegroundColor Yellow

$criticalFiles = @(
    "siliconflow_adapter.js",
    "package\cli.js",
    "package\preload.js",
    ".agents\skills\nexus-core\master.md",
    ".env"
)

$allPresent = $true
foreach ($f in $criticalFiles) {
    $fp = Join-Path $ProjectRoot $f
    if (Test-Path $fp) { Write-Host "  [OK] $f" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $f MISSING!" -ForegroundColor Red; $allPresent = $false }
}

# 3. Skills
Write-Host ""
Write-Host "[CHECK] Skills..." -ForegroundColor Yellow

$skills = @(
    "nexus-core\master.md",
    "django-doctor\SKILL.md",
    "react-surgeon\SKILL.md",
    "flutter-fixer\SKILL.md",
    "security-audit\SKILL.md",
    "db-forensics\SKILL.md",
    "nexus-memory\SKILL.md"
)

$skillCount = 0
foreach ($s in $skills) {
    $fp = Join-Path $ProjectRoot ".agents\skills\$s"
    if (Test-Path $fp) {
        $skillCount++
        $name = ($s -split "\\")[0]
        Write-Host "  [OK] $name" -ForegroundColor Green
    }
}
Write-Host "  Skills: $skillCount/7 active" -ForegroundColor Cyan

# 4. SiliconFlow Health Check
Write-Host ""
Write-Host "[CHECK] SiliconFlow Adapter..." -ForegroundColor Yellow

$healthOutput = $null
try {
    $healthOutput = node -e "const {SiliconFlowAdapter}=require('./siliconflow_adapter.js');const a=new SiliconFlowAdapter();const h=a.healthCheck();console.log(JSON.stringify(h));" 2>$null
} catch {}

if ($healthOutput) {
    try {
        $health = $healthOutput | ConvertFrom-Json
        Write-Host "  [OK] Status: $($health.status)" -ForegroundColor Green
        Write-Host "  Node: $($health.activeNode) | Model: $($health.model)" -ForegroundColor Cyan
    } catch {
        Write-Host "  [WARN] Could not parse health check" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] API key required for health check" -ForegroundColor Yellow
}

# 5. Final Report
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
if ($allPresent -and $skillCount -eq 7) {
    Write-Host "  [READY] Nexus Engine V9.0-Omega" -ForegroundColor Green
    Write-Host "  Antigravity Skill Path:" -ForegroundColor White
    Write-Host "  $ProjectRoot\.agents\skills\nexus-core\master.md" -ForegroundColor Gray
} else {
    Write-Host "  [WARN] System needs fixes - review errors above" -ForegroundColor Yellow
}
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot
Write-Host "Working dir: $ProjectRoot" -ForegroundColor Gray
Write-Host "Quick commands: .\nexus.ps1 test | health | clean | skills" -ForegroundColor Gray
Write-Host ""

# Launch the swarm
Write-Host "Launching the sovereign swarm..." -ForegroundColor Cyan
node .\run_swarm.js

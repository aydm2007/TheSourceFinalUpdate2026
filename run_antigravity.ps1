# run_antigravity.ps1 — Wrapper for Antigravity_Intercept_Eval.ps1
# ---------------------------------------------------------------
# This script searches for Antigravity_Intercept_Eval.ps1 in common locations
# (workspace root, C:\mnt) and runs it with the required ExecutablePath.
# It also validates the model environment variable and falls back to a safe default.

param (
    [Parameter(Mandatory=$true)]
    [string]$ExecutablePath = "C:\Users\ibrahim\AppData\Local\Programs\Antigravity\Antigravity.exe",
    [string]$LogRoot = "C:\Logs\Antigravity"
)

# ---------------------------------------------------------------
# Helper: locate the intercept script
function Find-InterceptScript {
    $candidates = @(
        "C:\mnt\Antigravity_Intercept_Eval.ps1",
        "C:\tools\workspace\TheSource\Antigravity_Intercept_Eval.ps1",
        "C:\tools\workspace\TheSource\src\scripts\Antigravity_Intercept_Eval.ps1"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

$scriptPath = Find-InterceptScript
if (-not $scriptPath) {
    Write-Error "[RUN] Antigravity_Intercept_Eval.ps1 not found in known locations."
    exit 1
}

# ---------------------------------------------------------------
# Validate Aether model – if invalid, force a known good model
$validModels = @(
    "deepseek-ai/DeepSeek-V3",
    "deepseek-ai/DeepSeek-V3",
    "google/gemini-2.5-flash:free",
    "gpt-4o",
    "gpt-4o-mini",
    "deepseek-ai/DeepSeek-V3"
)
if (-not $env:AETHER_MODEL -or $validModels -notcontains $env:AETHER_MODEL) {
    $fallback = "deepseek-ai/DeepSeek-V3"
    Write-Host "[RUN] Invalid or missing AETHER_MODEL. Overriding to $fallback"
    $env:AETHER_MODEL = $fallback
}

# ---------------------------------------------------------------
# Execute the intercept script with supplied arguments
Write-Host "[RUN] Executing $scriptPath with ExecutablePath='$ExecutablePath' and LogRoot='$LogRoot'"
& powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath -ExecutablePath $ExecutablePath -LogRoot $LogRoot

# End of wrapper

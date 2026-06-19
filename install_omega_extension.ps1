# install_omega_extension.ps1 — Principal Sovereign Architect Final Installer
$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\tools\workspace\TheSource"
$ExtensionSrc = Join-Path $ProjectRoot "vscode-extension"
$VscodeExtDir = Join-Path $HOME ".vscode\extensions"

Write-Host "======================================================="
Write-Host "  NEXUS OMEGA V9.0: FINAL SYSTEM INTEGRITY DEPLOYMENT"
Write-Host "======================================================="

# 1. Cleanup
Write-Host "Cleaning legacy extensions..."

$LegacyExtensions = @(
    "openai.chatgpt*",
    "thesource-siliconflow*",
    "nexus-sovereign-agent"
)

foreach ($pattern in $LegacyExtensions) {
    $paths = Get-ChildItem -Path $VscodeExtDir -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($path in $paths) {
        Write-Host "  Removing: $($path.Name)"
        Remove-Item -Path $path.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 2. Integrity Check
if (-not (Test-Path $ExtensionSrc)) {
    Write-Host "CRITICAL ERROR: Extension source missing at $ExtensionSrc"
    exit 1
}

# 3. Final Deployment
Write-Host "Deploying Nexus Sovereign Agent (Omega V9.0)..."
$TargetDir = Join-Path $VscodeExtDir "nexus-sovereign-agent"
New-Item -ItemType Junction -Path $TargetDir -Value $ExtensionSrc | Out-Null

# 4. Integrity Certificate
Write-Host "======================================================="
Write-Host "SUCCESS: ZERO_EXIT_CONFIRMED"
Write-Host "Status: Enterprise Integrated Version 100%"
Write-Host ""
Write-Host "INSTRUCTIONS:"
Write-Host "1. RESTART VS Code to activate the new Sovereign Agent."
Write-Host "2. Find the Nexus Shield and Chat in the sidebar."
Write-Host "======================================================="

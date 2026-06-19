# install_extension.ps1 — Nexus Sovereign Agent One-Click Installer
$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\tools\workspace\TheSource"
$ExtensionSrc = Join-Path $ProjectRoot "vscode-extension"
$VscodeExtDir = Join-Path $HOME ".vscode\extensions"
$TargetDir = Join-Path $VscodeExtDir "nexus-sovereign-agent"

Write-Host "======================================================="
Write-Host "  Nexus Sovereign Agent: Enterprise Installer"
Write-Host "======================================================="

if (-not (Test-Path $ExtensionSrc)) {
    Write-Host "Error: Extension directory not found at $ExtensionSrc"
    exit
}

if (-not (Test-Path $VscodeExtDir)) {
    New-Item -ItemType Directory -Path $VscodeExtDir -Force | Out-Null
}

Write-Host "Installing extension to VS Code..."

if (Test-Path $TargetDir) {
    Remove-Item -Path $TargetDir -Recurse -Force
}

# Link the extension
New-Item -ItemType Junction -Path $TargetDir -Value $ExtensionSrc | Out-Null

Write-Host "SUCCESS: Installation Complete!"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Restart Visual Studio Code."
Write-Host "2. Find the 'Nexus Omega' Shield icon in the Activity Bar."
Write-Host "3. Look for 'Nexus: Atomic Repair' in any open editor's title menu."
Write-Host "======================================================="

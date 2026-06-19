# Secure Ledger OS-Level Lock Script
# Ensures shadow_ledger.jsonl is protected from deletion to maintain forensic immutability.

$targetFile = "$PSScriptRoot\..\.nexus\var\telemetry\shadow_ledger.jsonl"
$targetFile = [System.IO.Path]::GetFullPath($targetFile)

if (-not (Test-Path $targetFile)) {
    Write-Host "[SECURING] Ledger file not found, creating empty ledger..."
    $dir = Split-Path $targetFile
    if (-not (Test-Path $dir)) { New-Item -Path $dir -ItemType Directory -Force | Out-Null }
    New-Item -Path $targetFile -ItemType File -Force | Out-Null
}

try {
    $acl = Get-Acl $targetFile

    # Prevent deletion by the current user to emulate append-only forensic state
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $denyDeleteRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $currentUser, 
        "Delete", 
        "Deny"
    )

    $acl.AddAccessRule($denyDeleteRule)
    Set-Acl -Path $targetFile -AclObject $acl

    Write-Host "[LOCKED] Forensic Shadow Ledger is now secured."
    Write-Host "[INFO] Deletion is DENIED at the OS level for user: $currentUser"
    Write-Host "File: $targetFile"
} catch {
    Write-Error "Failed to apply OS-level lock: $_"
}

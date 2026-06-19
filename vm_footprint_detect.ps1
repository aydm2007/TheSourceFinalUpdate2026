# AETHER-ZENITH SOVEREIGN COMMAND: V15.0-APEX
# VM FOOTPRINT DETECTOR & VSS SNAPSHOT ALIGNMENT CHECKER
# Target OS: Windows Server 2022

[CmdletBinding()]
Param(
    [string]$LogPath = "C:\tools\workspace\TheSource\vm_footprint_report.log"
)

$Output = [System.Collections.Generic.List[string]]::new()
function Add-Log($Text) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "[$Timestamp] $Text"
    Write-Host $Line -ForegroundColor Cyan
    $Output.Add($Line)
}

Add-Log "Initiating VM Footprint Inspection Protocol..."

# 1. Inspect Hardware Identifiers
Add-Log "Analyzing Bios Characteristics..."
$Bios = Get-CimInstance -ClassName Win32_Bios
Add-Log "BIOS Serial Number: $($Bios.SerialNumber)"
Add-Log "BIOS Version: $($Bios.SMBIOSBIOSVersion)"

if ($Bios.SerialNumber -like "*VMware*" -or $Bios.SMBIOSBIOSVersion -like "*VMware*") {
    Add-Log "Host detected as VMware virtual platform."
} elseif ($Bios.SerialNumber -like "*Hyper-V*" -or $Bios.Manufacturer -like "*Microsoft*") {
    Add-Log "Host detected as Microsoft Hyper-V virtual platform."
} else {
    Add-Log "Physical server hardware or non-standard virtualization footprint."
}

# 2. Check VMware VSS Snapshot Provider state and conflicts
Add-Log "Checking VSS Writer States for Backup operations stability..."
$VssWriters = vssadmin list writers
$HungWriters = 0
if ($null -ne $VssWriters) {
    $CurrentWriter = ""
    foreach ($Line in $VssWriters) {
        if ($Line -match "Writer name:\s+'(.+)'") {
            $CurrentWriter = $Matches[1]
        }
        if ($Line -match "State:\s+\[\d+\]\s+(.+)") {
            $State = $Matches[1]
            if ($State -ne "Stable") {
                Add-Log "VSS Writer Conflict detected! Writer '$CurrentWriter' in state '$State'"
                $HungWriters++
            }
        }
    }
}
Add-Log "VSS Health Check: Total unstable VSS writers found = $HungWriters"

# 3. Check VM Services status (VMTools / Hyper-V Guest Services)
Add-Log "Verifying Hypervisor Guest Integration Services..."
$VmServices = Get-Service -Name "VMTools", "vmvss", "vmicguestvc", "vmicheartbeat" -ErrorAction SilentlyContinue
foreach ($Svc in $VmServices) {
    Add-Log "Service: $($Svc.Name) ($($Svc.DisplayName)) | Status: $($Svc.Status)"
}

# Output reports
$Output | Out-File -FilePath $LogPath -Force
Add-Log "Inspection completed. Results recorded in $LogPath"

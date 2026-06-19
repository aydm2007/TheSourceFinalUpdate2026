# AETHER-ZENITH SOVEREIGN COMMAND: V15.0-APEX
# FORENSIC PERFORMANCE DIAGNOSTIC AND MITIGATION SCRIPT
# target: Windows Server 2022 (VMware / Hyper-V Guest)

[CmdletBinding()]
Param(
    [string]$LogPath = "C:\tools\workspace\TheSource\perf_diagnostic_report.log",
    [switch]$AutoMitigate
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🛡️ AETHER-ZENITH: VM Kernel & Performance Diagnostics Engine" -ForegroundColor Yellow
Write-Host "  Target Host: $env:COMPUTERNAME | OS: Windows Server 2022" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$Report = [System.Collections.Generic.List[string]]::new()
function Log-Info($Msg) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "[$Timestamp] [INFO] $Msg"
    Write-Host $Line -ForegroundColor Green
    $Report.Add($Line)
}

function Log-Warn($Msg) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "[$Timestamp] [WARNING] $Msg"
    Write-Host $Line -ForegroundColor Yellow
    $Report.Add($Line)
}

function Log-Error($Msg) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Line = "[$Timestamp] [ERROR] $Msg"
    Write-Host $Line -ForegroundColor Red
    $Report.Add($Line)
}

# 1. Check Hypervisor Type
Log-Info "Checking Hypervisor presence..."
$ComputerSystem = Get-CimInstance -ClassName Win32_ComputerSystem
Log-Info "Manufacturer: $($ComputerSystem.Manufacturer)"
Log-Info "Model: $($ComputerSystem.Model)"

# 2. Check Storage Controllers (PVSCSI / LSI Logic / Storport)
Log-Info "Scanning Storage Controllers for PVSCSI / Hyper-V storage bottlenecks..."
$StorageControllers = Get-CimInstance -ClassName Win32_PnPSignedDriver | Where-Object { $_.DeviceClass -eq "SCSIAdapter" }
foreach ($Dev in $StorageControllers) {
    Log-Info "Driver: $($Dev.DeviceName) | Provider: $($Dev.DriverProviderName) | Version: $($Dev.DriverVersion)"
    if ($Dev.DeviceName -like "*PVSCSI*") {
        Log-Info "PVSCSI SCSI Controller detected. Optimizing Registry parameters (RequestRingPages / MaxQueueDepth)..."
        # Reference: VMware KB 2053145 (Registry tweaks for high throughput PVSCSI)
        $RegistryPath = "HKLM:\SYSTEM\CurrentControlSet\Services\pvscsi\Parameters\Device"
        if (Test-Path $RegistryPath) {
            $MaxQueueDepth = Get-ItemProperty -Path $RegistryPath -Name "MaxQueueDepth" -ErrorAction SilentlyContinue
            if ($null -eq $MaxQueueDepth) {
                Log-Warn "MaxQueueDepth parameter is not set. Defaulting to standard adapter depth."
                if ($AutoMitigate) {
                    New-ItemProperty -Path $RegistryPath -Name "MaxQueueDepth" -Value 254 -PropertyType DWORD -Force
                    Log-Info "Successfully set MaxQueueDepth to 254 (VMware Best Practices)."
                }
            } else {
                Log-Info "MaxQueueDepth set to: $($MaxQueueDepth.MaxQueueDepth)"
            }
        } else {
            Log-Warn "PVSCSI registry path parameters missing or custom driver used."
        }
    }
}

# 3. Analyze Zombie Processes and EDR / Antivirus Interference
Log-Info "Analyzing active execution paths & seeking Zombie Processes (hung state)..."
# Zombie processes in Windows typically appear as processes with 0 thread activity, in suspended states, or with I/O hung due to EDR kernel hooks.
$Processes = Get-Process
$ZombieCount = 0
foreach ($P in $Processes) {
    try {
        if ($P.Threads.Count -eq 0 -or $P.Responding -eq $false) {
            Log-Warn "Process detected in hung / zombie state: PID $($P.Id) ($($P.Name))"
            $ZombieCount++
            if ($AutoMitigate) {
                Stop-Process -Id $P.Id -Force
                Log-Info "Terminated Zombie process PID $($P.Id) ($($P.Name)) successfully."
            }
        }
    } catch {
        # Access denied is normal for system kernel threads (e.g. System, Idle)
    }
}
Log-Info "Total zombie or hung processes identified: $ZombieCount"

# 4. CPU Ready Time & Co-stop Diagnostics (Theoretical Analysis via Performance Counters)
Log-Info "Validating VM CPU Scheduler indicators via Performance Counters..."
$CpuCounters = Get-Counter -Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 2
$CpuVal = ($CpuCounters.CounterSamples | Measure-Object -Property CookedValue -Average).Average
Log-Info "Average CPU Utilization: [ $CpuVal % ]"
if ($CpuVal -gt 90) {
    Log-Warn "High CPU utilization detected. Risk of high CPU Ready Time on ESXi host side if CPU overcommitment is present."
} else {
    Log-Info "CPU utilization within acceptable bounds."
}

# 5. Check EDR / Antivirus Mini-Filter Driver Conflicts
Log-Info "Scanning System Mini-Filter Drivers (EDR/AV hooks) that might cause I/O locks..."
$Filters = fltmc filters
if ($null -ne $Filters) {
    Log-Info "Active Mini-Filters list loaded successfully:"
    foreach ($F in $Filters) {
        if ($F -match "(\w+)\s+(\d+)\s+(\d+)\s+(\w+)") {
            Log-Info "Filter Driver: $($Matches[1]) | Instances: $($Matches[2]) | Altitude: $($Matches[3])"
        }
    }
} else {
    Log-Warn "Unable to retrieve filter driver stack. Ensure script is running with administrative privileges."
}

# Write log to disk
$Report | Out-File -FilePath $LogPath -Force
Log-Info "Diagnostic completed. Results written to $LogPath"
Write-Host "======================================================================" -ForegroundColor Cyan

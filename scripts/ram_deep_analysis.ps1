# ═══════════════════════════════════════════════════════════════════
# AETHER-ZENITH SOVEREIGN COMMAND — RAM FORENSIC DEEP ANALYSIS
# Target: VMware 7,1 | Windows Server 2022 Standard | 8GB RAM
# ═══════════════════════════════════════════════════════════════════

$ErrorActionPreference = "SilentlyContinue"
$ReportPath = "C:\tools\workspace\TheSource\ram_analysis_output.txt"

$Lines = @()
function Out($msg) { $Lines += $msg; Write-Host $msg }

Out "============================================================"
Out "  AETHER-ZENITH: RAM FORENSIC DEEP ANALYSIS ENGINE"
Out "  Host: $env:COMPUTERNAME | Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Out "============================================================"

# 1. Physical Memory Baseline
Out "`n--- [1] PHYSICAL MEMORY BASELINE ---"
$os = Get-CimInstance Win32_OperatingSystem
$cs = Get-CimInstance Win32_ComputerSystem
$totalGB = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
$freeGB = [math]::Round($os.FreePhysicalMemory * 1KB / 1GB, 2)
$usedGB = [math]::Round($totalGB - $freeGB, 2)
$usedPct = [math]::Round(($usedGB / $totalGB) * 100, 1)
Out "Total Physical RAM: $totalGB GB"
Out "Used RAM: $usedGB GB ($usedPct%)"
Out "Free RAM: $freeGB GB"
Out "Manufacturer: $($cs.Manufacturer)"
Out "Model: $($cs.Model)"
Out "vCPUs: $($cs.NumberOfLogicalProcessors)"

# 2. Virtual Memory / Page File
Out "`n--- [2] VIRTUAL MEMORY & PAGE FILE ---"
$totalVirtGB = [math]::Round($os.TotalVirtualMemorySize * 1KB / 1GB, 2)
$freeVirtGB = [math]::Round($os.FreeVirtualMemory * 1KB / 1GB, 2)
Out "Total Virtual Memory: $totalVirtGB GB"
Out "Free Virtual Memory: $freeVirtGB GB"

$pf = Get-CimInstance Win32_PageFileUsage
foreach ($p in $pf) {
    Out "PageFile: $($p.Name) | Allocated: $($p.AllocatedBaseSize) MB | Used: $($p.CurrentUsage) MB | Peak: $($p.PeakUsage) MB"
}

# 3. Memory Registry Configuration
Out "`n--- [3] MEMORY MANAGEMENT REGISTRY ---"
$mmPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management"
$mm = Get-ItemProperty -Path $mmPath
Out "DisablePagingExecutive: $($mm.DisablePagingExecutive)"
Out "LargeSystemCache: $($mm.LargeSystemCache)"
Out "PagingFiles: $($mm.PagingFiles -join ', ')"
Out "ClearPageFileAtShutdown: $($mm.ClearPageFileAtShutdown)"
Out "NonPagedPoolSize: $($mm.NonPagedPoolSize)"
Out "PagedPoolSize: $($mm.PagedPoolSize)"
Out "SessionPoolSize: $($mm.SessionPoolSize)"

# 4. Top 20 Memory Consumers
Out "`n--- [4] TOP 20 MEMORY CONSUMERS ---"
$procs = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20
foreach ($proc in $procs) {
    $wsMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
    $privMB = [math]::Round($proc.PrivateMemorySize64 / 1MB, 1)
    Out "PID $($proc.Id) | $($proc.Name) | WorkingSet: ${wsMB}MB | Private: ${privMB}MB"
}

# 5. Running Services Count
Out "`n--- [5] RUNNING SERVICES INVENTORY ---"
$runSvc = Get-Service | Where-Object { $_.Status -eq 'Running' }
$stopSvc = Get-Service | Where-Object { $_.Status -eq 'Stopped' }
Out "Running Services: $($runSvc.Count)"
Out "Stopped Services: $($stopSvc.Count)"

# Identify heavy non-essential services
$nonEssential = @('SysMain','DiagTrack','WSearch','MapsBroker','dmwappushservice','RemoteRegistry','Fax','XblAuthManager','XblGameSave','RetailDemo','WMPNetworkSvc','lfsvc','wisvc')
Out "`nPotentially Stoppable Services (RAM Recovery Candidates):"
foreach ($svcName in $nonEssential) {
    $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq 'Running') {
        Out "  ACTIVE: $svcName ($($svc.DisplayName)) - CAN BE STOPPED"
    }
}

# 6. Standby List / Cache Analysis
Out "`n--- [6] MEMORY COMPRESSION & STANDBY ---"
$memProc = Get-Process -Name "Memory Compression" -ErrorAction SilentlyContinue
if ($memProc) {
    $compMB = [math]::Round($memProc.WorkingSet64 / 1MB, 1)
    Out "Memory Compression Process Active: YES | Working Set: ${compMB} MB"
} else {
    Out "Memory Compression Process: NOT FOUND or INTEGRATED"
}

# 7. VMware Tools & Balloon Driver
Out "`n--- [7] VMWARE TOOLS & BALLOON DRIVER ---"
$vmtools = Get-Service -Name "VMTools" -ErrorAction SilentlyContinue
if ($vmtools) {
    Out "VMware Tools Service: $($vmtools.Status)"
}
$balloon = Get-CimInstance -ClassName Win32_PnPSignedDriver | Where-Object { $_.DeviceName -like "*balloon*" -or $_.DeviceName -like "*VMware*mem*" }
if ($balloon) {
    foreach ($b in $balloon) {
        Out "Balloon Driver: $($b.DeviceName) | Version: $($b.DriverVersion)"
    }
} else {
    Out "VMware Memory Balloon Driver: NOT DETECTED (potential expansion vector)"
}

# 8. NUMA Topology
Out "`n--- [8] NUMA TOPOLOGY ---"
$numa = Get-CimInstance -ClassName Win32_Processor
foreach ($n in $numa) {
    Out "Processor: $($n.Name) | Cores: $($n.NumberOfCores) | Threads: $($n.NumberOfLogicalProcessors) | L2Cache: $($n.L2CacheSize)KB | L3Cache: $($n.L3CacheSize)KB"
}

# 9. Scheduled Tasks consuming memory
Out "`n--- [9] ASSESSMENT SCORE ---"
$score = 100
$issues = @()

if ($usedPct -gt 80) { $score -= 15; $issues += "HIGH: RAM usage above 80% ($usedPct%)" }
elseif ($usedPct -gt 60) { $score -= 5; $issues += "MODERATE: RAM usage at $usedPct%" }

if ($mm.DisablePagingExecutive -eq 0) { $score -= 5; $issues += "Kernel paging executive NOT locked in RAM" }
if ($mm.LargeSystemCache -eq 0) { $score -= 5; $issues += "Large System Cache DISABLED" }

$pfUsedPct = 0
if ($pf -and $pf.AllocatedBaseSize -gt 0) {
    $pfUsedPct = [math]::Round(($pf.CurrentUsage / $pf.AllocatedBaseSize) * 100, 1)
}
if ($pfUsedPct -gt 50) { $score -= 10; $issues += "Page file usage HIGH at $pfUsedPct%" }

if (-not $balloon) { $score -= 5; $issues += "VMware Balloon driver not active - expansion possible" }

foreach ($issue in $issues) {
    Out "  FINDING: $issue"
}
Out "`nCURRENT SYSTEM MEMORY OPTIMIZATION SCORE: $score / 100"
Out "============================================================"

$Lines | Out-File -FilePath $ReportPath -Force -Encoding UTF8
Write-Host "`nReport saved to: $ReportPath"

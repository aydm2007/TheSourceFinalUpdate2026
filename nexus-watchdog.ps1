# Nexus Watchdog V2.0 - Optimized for Stability
$ProjectRoot = "C:\tools\workspace\TheSource"
$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = $ProjectRoot
$Watcher.Filter = "*.ts"
$Watcher.IncludeSubdirectories = $true
$Watcher.EnableRaisingEvents = $true

Write-Host "👁️‍🗨️ [Sovereign-Watcher] Active. Monitoring: $ProjectRoot" -ForegroundColor Cyan

$Action = {
    Write-Host "`n⚙️ [!] Change detected: $($Event.SourceEventArgs.Name). Recompiling..." -ForegroundColor Yellow
    
    # استخدام cmd /c لاستدعاء npm بشكل مباشر لتجنب أخطاء Win32
    cmd /c "npm run build"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ [Sovereign-Kernel] Compilation 100%. State Synced." -ForegroundColor Green
    } else {
        Write-Host "❌ [Sovereign-Kernel] Build Failed. Manual Review Required." -ForegroundColor Red
    }
}

Register-ObjectEvent $Watcher "Changed" -Action $Action | Out-Null
Register-ObjectEvent $Watcher "Created" -Action $Action | Out-Null

# إبقاء السكربت يعمل
while ($true) { Start-Sleep -Seconds 1 }
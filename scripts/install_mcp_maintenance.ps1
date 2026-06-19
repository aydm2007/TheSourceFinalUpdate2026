$TaskName = "SovereignMCP_Maintenance"
$TaskDescription = "Weekly silent restart of the Sovereign MCP Daemon to prevent memory accumulation (OOM) and refresh states."

# Define the action: Stop the service, then start it again.
$WorkspaceRoot = (Resolve-Path "..\").Path
$StopScript = Join-Path $WorkspaceRoot "stop_mcp_service.cmd"
$StartScript = Join-Path $WorkspaceRoot "sovereign_mcp_service.cmd"

# The command will run cmd.exe /c "stop.cmd && start.cmd"
$ActionCmd = "cmd.exe"
$ActionArgs = "/c `"$StopScript`" && start `"`" `"$StartScript`""

$Action = New-ScheduledTaskAction -Execute $ActionCmd -Argument $ActionArgs -WorkingDirectory $WorkspaceRoot

# Define the trigger: Every Sunday at 3:00 AM
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM

# Define settings: Run hidden, allow start if on batteries
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Hidden

Write-Host "Registering Scheduled Task: $TaskName..."
try {
    # Unregister if exists
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    # Register the new task
    Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName $TaskName -Description $TaskDescription -Settings $Settings -Force
    Write-Host "Successfully registered $TaskName. It will run every Sunday at 3:00 AM."
} catch {
    Write-Host "Failed to register task. Please run this script as Administrator." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

@echo off
rem ------------------------------------------------------------
rem Watchdog for policy_alert_monitor background job
rem ------------------------------------------------------------

set "PID_FILE=C:\\tools\\workspace\\TheSource\\logs\\policy_alert_monitor.pid"

:LOOP
if exist "%PID_FILE%" (
  set /p MONITOR_PID=<"%PID_FILE%"
  tasklist /FI "PID eq %MONITOR_PID%" | findstr /I "%MONITOR_PID%" >nul
  if errorlevel 1 (
    echo Policy alert monitor not running – restarting…
    powershell -ExecutionPolicy Bypass -File C:\\tools\\workspace\\TheSource\\scripts\\policy_alert_monitor.ps1 > C:\\tools\\workspace\\TheSource\\logs\\policy_alert_monitor.log 2>&1 & echo %! > "%PID_FILE%"
  )
) else (
  echo PID file missing – starting monitor…
  powershell -ExecutionPolicy Bypass -File C:\\tools\\workspace\\TheSource\\scripts\\policy_alert_monitor.ps1 > C:\\tools\\workspace\\TheSource\\logs\\policy_alert_monitor.log 2>&1 & echo %! > "%PID_FILE%"
)

rem Wait 60 seconds before next check
timeout /t 60 >nul
goto LOOP
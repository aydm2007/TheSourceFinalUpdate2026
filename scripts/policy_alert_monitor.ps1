@echo off
rem ------------------------------------------------------------
rem Policy Alert Monitor – watches the policy monitor log for failures
rem ------------------------------------------------------------

set LOG_PATH=C:\tools\workspace\TheSource\logs\policy_monitor.bat

:LOOP
if not exist "%LOG_PATH%" (
  timeout /t 10 >nul
  goto LOOP
)

for /f "delims=" %%L in ('type "%LOG_PATH%" ^| findstr /i "FAIL"') do (
  echo Detected failure in policy monitor log: %%L
  rem Send alert via MCP SwarmBroadcast
  powershell -Command "Invoke-RestMethod -Method Post -Uri http://localhost:3847/mcp/tools/SwarmBroadcast -Headers @{'Content-Type'='application/json'} -Body '{\"channel\":\"alerts\",\"payload\":{\"message\":\"Policy monitor failure detected\",\"log\":\"%%L\"},\"sender\":\"policy-monitor\"}'"; echo $PID > C:\tools\workspace\TheSource\logs\policy_alert_monitor.pid
)

rem Wait before next check (30 seconds)
timeout /t 30 >nul
goto LOOP
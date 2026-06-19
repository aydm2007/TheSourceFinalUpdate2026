@echo off
title AgriAsset Alpha-Synapse Bootloader
color 0A

echo =======================================================================
echo [SOVEREIGN SWARM] Booting Alpha-Synapse Peripheral Nervous System...
echo =======================================================================
echo.

echo [1/3] Verifying environment and clearing ports...
cd /d "%~dp0"
powershell -Command "try { $p = Get-NetTCPConnection -LocalPort 9999 -ErrorAction SilentlyContinue; if ($p) { Stop-Process -Id $p.OwningProcess -Force; echo 'Port 9999 cleared.' } } catch {}"

echo [2/3] Launching Nervous System Server (Port 9999)...
start "Alpha-Synapse Server" /B node nervous_system_server.js

echo.
echo =======================================================================
echo [SUCCESS] The Peripheral Nervous System is now ACTIVE in the background.
echo.
echo NEXT STEPS:
echo 1. VSCode is launching automatically...
echo 2. Inside the new VSCode window, press [F5] to start the extension debugger.
echo 3. The IDE will automatically connect to Port 9999 and link with the MCP.
echo =======================================================================
echo.

echo [3/3] Opening VSCode IDE Extension...
powershell -Command "& 'C:\Users\ibrahim\AppData\Local\Programs\Microsoft VS Code\Code.exe' 'C:\tools\workspace\TheSource\ide-extension'"

pause

@echo off
:: ====================================================================
:: Sovereign Architecture — PM2 Background Launcher
:: Professional Invisible Mode
:: ====================================================================

if "%~1"=="-Hidden" goto :Main
:: Self-elevation to invisible window
powershell -WindowStyle Hidden -Command "Start-Process cmd.exe -ArgumentList '/c \"%~f0\" -Hidden' -WindowStyle Hidden"
exit

:Main
cd /d "%~dp0"

:: [1/3] Preparing Environment
:: (All manual 'start' commands have been moved to ecosystem.config.js for professional lifecycle management)

:: [2/3] Auto-configuring Cursor IDE MCP connection
powershell -Command "$cursorDir = Join-Path $env:USERPROFILE '.cursor'; if (-not (Test-Path $cursorDir)) { New-Item -ItemType Directory -Path $cursorDir -Force >$null }; $mcpPath = Join-Path $cursorDir 'mcp.json'; if (-not (Test-Path $mcpPath)) { '{ \"mcpServers\": { \"thesource-sovereign-http\": { \"url\": \"http://localhost:3847/mcp\", \"headers\": { \"Authorization\": \"Bearer sovereign_nexus_key_2026\" } } } }' | Set-Content -Path $mcpPath -Encoding UTF8; }"

:: [3/3] Launching Background Services via PM2
call pm2 start ecosystem.config.js --update-env >nul 2>&1
call pm2 save >nul 2>&1

:: Open Dashboard in the default browser
start http://localhost:3851/

exit
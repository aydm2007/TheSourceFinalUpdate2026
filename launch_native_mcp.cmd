@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title Sovereign MCP Server Launcher

echo =======================================================
echo   Sovereign Native MCP Launcher - TheSource
echo   Date: %date% %time%
echo =======================================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js is not installed or not in PATH.
    echo Install Node.js from https://nodejs.org/ and retry.
    pause
    exit /b 1
)
for /f "delims=" %%v in ('node --version') do set NODE_VERSION=%%v
echo   [OK] Node.js %NODE_VERSION%

echo.
echo [2/4] Reading local MCP state...
set ACTIVE_SKILL=unknown
if exist ".nexus\sessions\local_skill.json" (
    for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "try { (Get-Content '.nexus\sessions\local_skill.json' -Raw | ConvertFrom-Json).activeSkill } catch { 'unknown' }"`) do set ACTIVE_SKILL=%%s
)
if "%ACTIVE_SKILL%"=="unknown" if exist "active_skill.json" (
    for /f "usebackq delims=" %%s in (`powershell -NoProfile -Command "try { (Get-Content 'active_skill.json' -Raw | ConvertFrom-Json).activeSkill } catch { 'unknown' }"`) do set ACTIVE_SKILL=%%s
)
for /f "usebackq delims=" %%t in (`node -e "const fs=require('fs');const b=JSON.parse(fs.readFileSync('bridge.json','utf8'));console.log((b.allowed_tools||[]).length)"`) do set TOOL_COUNT=%%t
echo   Active Skill: %ACTIVE_SKILL%
echo   Declared Allowed Tools: %TOOL_COUNT%

echo.
echo [3/4] Checking Port 3847 availability...
netstat -ano | findstr :3847 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo   [WARN] Port 3847 is already occupied.
    if "%AETHER_MCP_CLEAR_PORT%"=="1" (
        echo   AETHER_MCP_CLEAR_PORT=1 detected. Clearing the port explicitly.
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3847 ^| findstr LISTENING') do (
            echo   Killing process PID: %%a
            taskkill /F /PID %%a >nul 2>&1
        )
        ping 127.0.0.1 -n 3 >nul
        netstat -ano | findstr :3847 | findstr LISTENING >nul
        if %errorlevel% equ 0 (
            echo   [FAIL] Could not clear port 3847.
            echo   Free the port manually or run with administrator permissions.
            pause
            exit /b 1
        )
    ) else (
        echo   [INFO] Existing listener preserved. Set AETHER_MCP_CLEAR_PORT=1 to clear it.
        echo.
        echo =======================================================
        echo   Native MCP endpoint may already be running.
        echo   Local Endpoint:   http://localhost:3847/mcp
        echo   Metrics Endpoint: http://localhost:3847/metrics
        echo   Verify:           npm run native-mcp:verify
        echo =======================================================
        exit /b 0
    )
)
echo   [OK] Port 3847 is ready.

echo.
echo [4/4] Starting Remote MCP Server...
if "%AETHER_MCP_INLINE%"=="1" (
    echo   Inline mode enabled. Press Ctrl+C to stop the server.
    echo.
    node mcp_remote_server.js
    exit /b %errorlevel%
)

start "Sovereign MCP Server (Port 3847)" cmd /k "node mcp_remote_server.js"

echo.
echo =======================================================
echo   SUCCESS: Sovereign MCP Server launch requested.
echo =======================================================
echo   Local Endpoint:   http://localhost:3847/mcp
echo   Metrics Endpoint: http://localhost:3847/metrics
echo   Active Skill:     %ACTIVE_SKILL%
echo   Tool Count:       %TOOL_COUNT%
echo   Verify:           npm run native-mcp:verify
echo =======================================================
echo.
ping 127.0.0.1 -n 6 >nul

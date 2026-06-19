@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Sovereign MCP Daemon - Stop

echo Stopping Sovereign MCP Service...
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Sovereign MCP Daemon*" >nul 2>&1
taskkill /F /IM node.exe /FI "COMMANDLINE eq *mcp_remote_server.js*" >nul 2>&1

echo Force clearing port 3847...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3847 ^| findstr LISTENING') do (
    echo Killing node process PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo MCP Service stopped.
pause

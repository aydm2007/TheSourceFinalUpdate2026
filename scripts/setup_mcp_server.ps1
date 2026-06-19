<#
.SYNOPSIS
    Nexus Bridge MCP Remote Server Deployment Script
.DESCRIPTION
    This script automates the deployment of the MCP remote server on a new Windows machine.
    It performs the following:
    1. Opens Windows Firewall for inbound traffic on port 3847.
    2. Uses PM2 (via npx) to start the server as a background daemon running 24/7.
    3. Saves the PM2 process list so it can be restored on reboot.
#>

$ErrorActionPreference = "Stop"

$Port = 3847
$ServiceName = "mcp-server"
$ScriptPath = "mcp_remote_server.js"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🌐 Nexus Bridge MCP Remote Server Setup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Open Windows Firewall Port
Write-Host "[1/3] Checking Windows Firewall rules..." -ForegroundColor Yellow
$RuleName = "Allow MCP Server Port $Port"

$ExistingRule = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue

if ($ExistingRule) {
    Write-Host "      ✓ Firewall rule already exists for port $Port." -ForegroundColor Green
} else {
    Write-Host "      -> Adding new inbound firewall rule for port $Port (TCP)..." -ForegroundColor Yellow
    try {
        New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null
        Write-Host "      ✓ Firewall rule added successfully!" -ForegroundColor Green
    } catch {
        Write-Host "      [!] Failed to add firewall rule. Please run this script as Administrator." -ForegroundColor Red
        Exit
    }
}

# 2. Check if the script file exists in current directory
if (-Not (Test-Path $ScriptPath)) {
    Write-Host "[!] Could not find '$ScriptPath' in the current directory." -ForegroundColor Red
    Write-Host "    Please ensure you run this script from the project root folder (TheSource)." -ForegroundColor Red
    Exit
}

# 3. Deploy via PM2
Write-Host "[2/3] Starting the MCP Server via PM2 (24/7 Background Daemon)..." -ForegroundColor Yellow

# First check if it's already running to restart or just start
$PM2List = npx pm2 jlist 2>$null
if ($PM2List -match "`"$ServiceName`"") {
    Write-Host "      -> Server already exists in PM2, restarting..." -ForegroundColor Yellow
    npx pm2 restart $ServiceName | Out-Null
} else {
    Write-Host "      -> Starting new PM2 instance..." -ForegroundColor Yellow
    npx pm2 start $ScriptPath --name $ServiceName | Out-Null
}

Write-Host "      ✓ MCP Server started successfully." -ForegroundColor Green

# 4. Save PM2 State
Write-Host "[3/3] Saving PM2 state for persistence..." -ForegroundColor Yellow
npx pm2 save | Out-Null
Write-Host "      ✓ PM2 state saved." -ForegroundColor Green

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your MCP Server is now running 24/7 on port $Port."
Write-Host ""
Write-Host "To check logs, run:         npx pm2 logs $ServiceName"
Write-Host "To see running servers, run: npx pm2 list"
Write-Host ""
Write-Host "Don't forget to use your Public IP and the API Key from MCP_API_KEY or MCP_ADMIN_API_KEY when connecting remotely."
Write-Host "Example:"
Write-Host "Use Authorization: Bearer <MCP_API_KEY> with x-mcp-hmac for production remote access."
Write-Host "==========================================================" -ForegroundColor Cyan

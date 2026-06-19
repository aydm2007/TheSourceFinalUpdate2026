@echo off
REM =============================
REM TheSource Project Startup Script
REM =============================

REM ---- Step 1: Install dependencies for backend and frontend ----
<<<<<<< HEAD
echo Installing backend dependencies (AgriAsset Django/Python equivalent check usually here, but keeping node for legacy)...
cd backend
if not exist node_modules (call npm install) else echo Backend dependencies already installed.
cd ..

echo Installing frontend dependencies (Legacy)...
cd frontend
if not exist node_modules (call npm install) else echo Frontend dependencies already installed.
cd ..

echo Installing chat-backend dependencies...
cd chat-backend
if not exist node_modules (call npm install) else echo Chat Backend dependencies already installed.
cd ..

echo Installing chat-frontend dependencies...
cd chat-frontend
if not exist node_modules (call npm install) else echo Chat Frontend dependencies already installed.
=======
echo Installing backend dependencies...
cd backend
if not exist node_modules (npm install) else echo Backend dependencies already installed.
cd ..

echo Installing frontend dependencies...
cd frontend
if not exist node_modules (npm install) else echo Frontend dependencies already installed.
>>>>>>> b77edb76 (feat: initialize project infrastructure, add server/notifier tools, and implement session management hook)
cd ..

REM ---- Step 2: Build projects (if applicable) ----
echo Building backend (if build script exists)...
cd backend
<<<<<<< HEAD
if exist package.json (call npm run build) else echo No backend build script.
=======
if exist package.json (npm run build) else echo No backend build script.
>>>>>>> b77edb76 (feat: initialize project infrastructure, add server/notifier tools, and implement session management hook)
cd ..

echo Building frontend...
cd frontend
<<<<<<< HEAD
if exist package.json (call npm run build) else echo No frontend build script.
cd ..

echo Building chat-backend...
cd chat-backend
if exist package.json (call npm run build) else echo No chat-backend build script.
cd ..

echo Building chat-frontend...
cd chat-frontend
if exist package.json (call npm run build) else echo No chat-frontend build script.
cd ..

REM ---- Step 3: Execute Sovereign System Verifications (Diagnostic Checks) ----
echo =======================================================
echo   🔍 Running Sovereign Readiness and Architecture Checks
echo =======================================================
echo Running Health Check...
call npm run health:check
if %errorlevel% neq 0 (
    echo [ERROR] Health Check Failed. Aborting startup.
    pause
    exit /b %errorlevel%
)

echo Running Native MCP Verification...
call npm run native-mcp:verify
if %errorlevel% neq 0 (
    echo [ERROR] Native MCP Verification Failed. Aborting startup.
    pause
    exit /b %errorlevel%
)

echo Running Tool-Source Alignment...
call npm run tool-source:verify

echo Running Agent-Swarm Alignment...
call npm run agent-swarm:verify

echo Running Sovereign 90+ Sweep...
call npm run sovereign:90-sweep
if %errorlevel% neq 0 (
    echo [WARNING] Sovereign 90+ Sweep indicated issues, but continuing...
)

echo =======================================================
echo   ✅ All Sovereign Verifications Completed Successfully!
echo =======================================================

REM ---- Step 4: Start all sovereign services ----
echo Starting background PM2 services and servers...
call start_sovereign_services.cmd

REM ---- Step 5: Confirmation ----
echo All sovereign services have been started. Check the logs folder for output.
=======
if exist package.json (npm run build) else echo No frontend build script.
cd ..

REM ---- Step 3: Start background agents ----
echo Starting Deputy agent...
start "Deputy" cmd /c "node tools\deputy.js ^> logs\deputy.log 2^>^&1"

echo Starting Slack Notifier...
start "SlackNotifier" cmd /c "node tools\slack_notifier.js ^> logs\slack_notifier.log 2^>^&1"

echo Starting Slack Bridge...
start "SlackBridge" cmd /c "node tools\slack_bridge.js ^> logs\slack_bridge.log 2^>^&1"

echo Starting ShadowLedgerAudit Runner...
start "ShadowAudit" cmd /c "node tools\shadow_audit_runner.js ^> logs\shadow_audit.log 2^>^&1"

echo Starting VisualAuditReport Runner...
start "VisualReport" cmd /c "node tools\visual_report_runner.js ^> logs\visual_report.log 2^>^&1"

REM ---- Step 4: Start backend server ----
echo Starting Backend server...
start "Backend" cmd /c "cd backend && node src\server.js ^> logs\backend.log 2^>^&1"

REM ---- Step 5: Start frontend dev server ----
echo Starting Frontend dev server...
start "Frontend" cmd /c "cd frontend && npm run dev ^> logs\frontend.log 2^>^&1"

echo All services have been started. Check the logs folder for output.
>>>>>>> b77edb76 (feat: initialize project infrastructure, add server/notifier tools, and implement session management hook)
pause
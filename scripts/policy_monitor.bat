@echo off
rem ------------------------------------------------------------
rem Al‑Masdar Policy Monitor – runs every 5 minutes
rem ------------------------------------------------------------

cd C:/tools/workspace/AgriAsset_YECO_Enterprise2026/.al-masdar/worktrees
if errorlevel 1 exit /b 1

rem Create a temporary worktree
git worktree add sandbox-monitor-001 HEAD
if errorlevel 1 exit /b 1

cd sandbox-monitor-001
if errorlevel 1 exit /b 1

rem Execute bridge‑only test suite
npm run test:bridge
if errorlevel 1 exit /b 1

rem Clean up
cd ..
git worktree prune
if errorlevel 1 exit /b 1

exit /b 0
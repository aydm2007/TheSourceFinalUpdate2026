@echo off
:: ═══════════════════════════════════════════════════════════
::  TheSource — Nexus Engine V9.0-Omega — Warp Launcher
::  نقر مزدوج لفتح المشروع في Warp Terminal
:: ═══════════════════════════════════════════════════════════

set "WARP=C:\Users\ibrahim\AppData\Local\Programs\Warp\warp.exe"
set "PROJECT=C:\tools\workspace\TheSource"

:: تحقق من وجود Warp
if exist "%WARP%" (
    start "" "%WARP%" --cwd "%PROJECT%"
) else (
    :: Fallback: Windows Terminal أو PowerShell
    echo Warp غير موجود — فتح PowerShell بدلاً منه...
    start powershell -NoExit -Command "Set-Location '%PROJECT%'; .\launch.ps1"
)

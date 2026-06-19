@echo off
:: =====================================================================
:: AETHER-ZENITH V15.0-APEX — Unified VS Code VSIX Bundler & Deployer
:: =====================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

set "PROJECT_ROOT=%~dp0"
set "CLIENT_DIR=%PROJECT_ROOT%sovereign-vscode-client"
set "AGENT_DIR=%PROJECT_ROOT%vscode-extension"
set "SYNAPSE_DIR=%PROJECT_ROOT%ide-extension"

set "CLIENT_VSIX=sovereign-vscode-client-1.0.0.vsix"
set "AGENT_VSIX=nexus-sovereign-agent-16.4.0.vsix"
set "SYNAPSE_VSIX=agriasset-synapse-1.0.0.vsix"

echo =====================================================================
echo    AETHER-ZENITH V15.0-APEX — Unified VSIX Bundler
echo =====================================================================
echo.

if not "%1"=="" (
    set "choice=%1"
    goto check_args
)

echo [1] حزم كلا الملحقين (العميل البصري + لوحة التحكم السيادية)
echo [2] حزم وتثبيت كلا الملحقين تلقائياً في VS Code المحلي
echo [3] تثبيت الملحقات الموجودة مسبقاً في VS Code
echo [4] خروج
echo.
set /p choice="أدخل رقم الاختيار [1-4]: "

:check_args
if "%choice%"=="1" goto package_all
if "%choice%"=="--package" goto package_all
if "%choice%"=="2" goto package_and_install_all
if "%choice%"=="--install" goto package_and_install_all
if "%choice%"=="3" goto install_existing_all
if "%choice%"=="4" exit
goto error_choice

:package_all
echo.
echo [+] التحقق من وجود Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] خطأ: يجب تثبيت Node.js لتعبئة وبناء الملحقات.
    pause
    exit /b 1
)

:: 1. Build and Package Sovereign VSCode Client (المساعد البصري)
echo =====================================================================
echo [+] جاري بناء المساعد البصري (Sovereign VSCode Client)...
echo =====================================================================
cd /d "%CLIENT_DIR%"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [!] خطأ أثناء تثبيت اعتماديات المساعد البصري.
    pause
    exit /b 1
)
call npm run compile
if %errorlevel% neq 0 (
    echo [!] خطأ أثناء تجميع TypeScript للمساعد البصري.
    pause
    exit /b 1
)
call npx vsce package --no-yarn --allow-star-activation
if %errorlevel% neq 0 (
    echo [!] فشل حزم المساعد البصري عبر vsce.
    pause
    exit /b 1
)

:: 2. Build and Package Nexus Sovereign Agent (لوحة التحكم السيادية)
echo =====================================================================
echo [+] جاري بناء لوحة التحكم السيادية (Nexus Sovereign Agent)...
echo =====================================================================
cd /d "%AGENT_DIR%"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [!] خطأ أثناء تثبيت اعتماديات لوحة التحكم السيادية.
    pause
    exit /b 1
)
call npx vsce package --no-yarn
if %errorlevel% neq 0 (
    echo [!] فشل حزم لوحة التحكم السيادية عبر vsce.
    pause
    exit /b 1
)

:: 3. Build and Package AgriAsset Synapse (الجهاز العصبي الطرفي)
echo =====================================================================
echo [+] جاري بناء جهاز تشغيل السياسة الطرفي (AgriAsset Synapse)...
echo =====================================================================
cd /d "%SYNAPSE_DIR%"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [!] خطأ أثناء تثبيت اعتماديات الجهاز الطرفي.
    pause
    exit /b 1
)
call npx vsce package --no-yarn
if %errorlevel% neq 0 (
    echo [!] فشل حزم الجهاز الطرفي عبر vsce.
    pause
    exit /b 1
)

:: Copy packages to distribution directory
echo =====================================================================
echo [+] جاري نسخ الحزم إلى المجلد الرئيسي للمشروع...
echo =====================================================================
cd /d "%PROJECT_ROOT%"
if not exist "dist" mkdir "dist"
copy /y "%CLIENT_DIR%\%CLIENT_VSIX%" "%PROJECT_ROOT%dist\%CLIENT_VSIX%"
copy /y "%AGENT_DIR%\%AGENT_VSIX%" "%PROJECT_ROOT%dist\%AGENT_VSIX%"
copy /y "%SYNAPSE_DIR%\%SYNAPSE_VSIX%" "%PROJECT_ROOT%dist\%SYNAPSE_VSIX%"

echo.
echo [✓] تم تجميع وحزم الملحقات بنجاح!
echo [✓] الحزم متوفرة في مجلد dist:
echo    - %PROJECT_ROOT%dist\%CLIENT_VSIX% (المساعد البصري)
echo    - %PROJECT_ROOT%dist\%AGENT_VSIX% (لوحة التحكم السيادية)
echo    - %PROJECT_ROOT%dist\%SYNAPSE_VSIX% (الجهاز العصبي الطرفي)
echo.
pause
exit /b 0

:package_and_install_all
echo.
echo [+] جاري حزم الملحقات أولاً...
call :package_sub_all
if %errorlevel% neq 0 exit /b %errorlevel%

echo [+] جاري التحقق من وجود VS Code في نظام التشغيل...
code -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] لم يتم العثور على أمر 'code' في مسار النظام (Path).
    pause
    exit /b 1
)

echo [+] جاري تثبيت الملحقات في VS Code المحلي...
call code --install-extension "%CLIENT_DIR%\%CLIENT_VSIX%" --force
call code --install-extension "%AGENT_DIR%\%AGENT_VSIX%" --force
call code --install-extension "%SYNAPSE_DIR%\%SYNAPSE_VSIX%" --force
if %errorlevel% neq 0 (
    echo [!] فشل تثبيت الملحقات في VS Code.
    pause
    exit /b 1
)

echo.
echo [✓] تم حزم الملحقات وتثبيتها بنجاح في VS Code المحلي!
echo.
pause
exit /b 0

:install_existing_all
echo.
if not exist "%CLIENT_DIR%\%CLIENT_VSIX%" (
    echo [!] خطأ: ملف VSIX الخاص بالمساعد البصري غير موجود. يرجى الحزم أولاً.
    pause
    exit /b 1
)
if not exist "%AGENT_DIR%\%AGENT_VSIX%" (
    echo [!] خطأ: ملف VSIX الخاص بلوحة التحكم غير موجود. يرجى الحزم أولاً.
    pause
    exit /b 1
)
if not exist "%SYNAPSE_DIR%\%SYNAPSE_VSIX%" (
    echo [!] خطأ: ملف VSIX الخاص بالجهاز العصبي الطرفي غير موجود. يرجى الحزم أولاً.
    pause
    exit /b 1
)

echo [+] جاري التحقق من وجود VS Code...
code -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] لم يتم العثور على أمر 'code' في مسار النظام.
    pause
    exit /b 1
)

echo [+] جاري تثبيت الحزم الموجودة...
call code --install-extension "%CLIENT_DIR%\%CLIENT_VSIX%" --force
call code --install-extension "%AGENT_DIR%\%AGENT_VSIX%" --force
call code --install-extension "%SYNAPSE_DIR%\%SYNAPSE_VSIX%" --force

echo.
echo [✓] تم تثبيت الملحقات بنجاح!
echo.
pause
exit /b 0

:package_sub_all
node -v >nul 2>&1
if %errorlevel% neq 0 exit /b 1
cd /d "%CLIENT_DIR%"
call npm install --no-audit --no-fund && call npm run compile && call npx vsce package --no-yarn --allow-star-activation
if %errorlevel% neq 0 exit /b 1
cd /d "%AGENT_DIR%"
call npm install --no-audit --no-fund && call npx vsce package --no-yarn
if %errorlevel% neq 0 exit /b 1
cd /d "%SYNAPSE_DIR%"
call npm install --no-audit --no-fund && call npx vsce package --no-yarn
if %errorlevel% neq 0 exit /b 1
exit /b 0

:error_choice
echo [!] اختيار غير صحيح.
pause
exit /b 1

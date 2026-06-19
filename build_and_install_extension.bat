@echo off
:: =====================================================================
:: AETHER-ZENITH V15.0-APEX VS Code Extension Builder & Installer
:: =====================================================================
chcp 65001 >nul
setlocal enabledelayedexpansion

set "EXT_DIR=%~dp0vscode-extension"
set "VSIX_NAME=nexus-sovereign-agent-16.4.0.vsix"

echo =====================================================================
echo    AETHER-ZENITH V15.0-APEX - VS Code Extension Management Desk
echo =====================================================================
echo.
echo [1] حزم الملحق فقط (توليد ملف VSIX)
echo [2] حزم الملحق وتثبيته تلقائياً في VS Code المحلي
echo [3] تثبيت ملف VSIX الموجود مسبقاً في VS Code
echo [4] خروج
echo.
set /p choice="أدخل رقم الاختيار [1-4]: "

if "%choice%"=="1" goto package_only
if "%choice%"=="2" goto package_and_install
if "%choice%"=="3" goto install_existing
if "%choice%"=="4" exit
goto error_choice

:package_only
echo.
echo [+] جاري التحقق من وجود Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] خطأ: يجب تثبيت Node.js لتعبئة الملحق.
    pause
    exit /b 1
)

echo [+] جاري الانتقال إلى مجلد الملحق: %EXT_DIR%
cd /d "%EXT_DIR%"

echo [+] جاري تثبيت الاعتماديات المطلوبة...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [!] خطأ أثناء تثبيت الاعتماديات.
    pause
    exit /b 1
)

echo [+] جاري بناء وحزم الملحق VSIX...
call npx vsce package --no-yarn
if %errorlevel% neq 0 (
    echo [!] فشل حزم الملحق عبر vsce.
    pause
    exit /b 1
)

echo.
echo [✓] تم توليد ملف الـ VSIX بنجاح في المسار:
echo %EXT_DIR%\%VSIX_NAME%
echo.
pause
exit /b 0

:package_and_install
echo.
echo [+] جاري حزم الملحق أولاً...
call :package_sub
if %errorlevel% neq 0 exit /b %errorlevel%

echo [+] جاري التحقق من وجود VS Code في نظام التشغيل...
code -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] تنبيه: لم يتم العثور على أمر 'code' في مسار النظام (Path).
    echo [!] يرجى تثبيت VS Code أو إضافته إلى متغيرات البيئة تلقائياً.
    pause
    exit /b 1
)

echo [+] جاري تثبيت الملحق في VS Code المحلي...
call code --install-extension "%EXT_DIR%\%VSIX_NAME%" --force
if %errorlevel% neq 0 (
    echo [!] فشل تثبيت الملحق في VS Code.
    pause
    exit /b 1
)

echo.
echo [✓] تم حزم الملحق وتثبيته بنجاح في VS Code المحلي!
echo.
pause
exit /b 0

:install_existing
echo.
if not exist "%EXT_DIR%\%VSIX_NAME%" (
    echo [!] خطأ: ملف الـ VSIX غير موجود في المسار:
    echo "%EXT_DIR%\%VSIX_NAME%"
    echo يرجى حزم الملحق أولاً باستخدام الاختيار [1].
    pause
    exit /b 1
)

echo [+] جاري التحقق من وجود VS Code...
code -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] خطأ: لم يتم العثور على أمر 'code' في مسار النظام (Path).
    pause
    exit /b 1
)

echo [+] جاري تثبيت ملف VSIX الموجود مسبقاً...
call code --install-extension "%EXT_DIR%\%VSIX_NAME%" --force
if %errorlevel% neq 0 (
    echo [!] فشل تثبيت الملحق.
    pause
    exit /b 1
)

echo.
echo [✓] تم تثبيت الملحق بنجاح في VS Code!
echo.
pause
exit /b 0

:package_sub
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] خطأ: Node.js غير مثبت.
    exit /b 1
)
cd /d "%EXT_DIR%"
call npm install --no-audit --no-fund
if %errorlevel% neq 0 exit /b 1
call npx vsce package --no-yarn
exit /b %errorlevel%

:error_choice
echo [!] اختيار غير صحيح.
pause
exit /b 1

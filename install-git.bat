@echo off
REM Kiểm tra quyền Administrator
net session >nul 2>&1
if errorlevel 1 (
    echo ========================================
    echo   CAN QUYEN ADMINISTRATOR
    echo ========================================
    echo.
    echo [WARNING] Script can quyen Administrator de cai dat Git
    echo.
    echo Vui long:
    echo   1. Click chuot phai vao file install-git.bat
    echo   2. Chon "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo ========================================
echo   Tu dong cai dat Git
echo ========================================
echo.
echo [INFO] Dang chay script PowerShell...
echo.

REM Chuyển đến thư mục chứa script
cd /d "%~dp0"

REM Kiểm tra PowerShell
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PowerShell khong tim thay!
    pause
    exit /b 1
)

REM Chạy script PowerShell với quyền Administrator
powershell -ExecutionPolicy Bypass -File "%~dp0install-git.ps1"

pause


@echo off
echo ========================================
echo   Day du an len GitHub
echo ========================================
echo.
echo [INFO] Dang chay script PowerShell...
echo.

REM Chuyển đến thư mục chứa script
cd /d "%~dp0"

REM Chạy script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0push-to-github-complete.ps1"

pause


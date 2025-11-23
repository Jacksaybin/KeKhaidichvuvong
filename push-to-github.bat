@echo off
echo ========================================
echo   Dang day du an len GitHub
echo ========================================
echo.

REM Kiểm tra Git đã được cài đặt chưa
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git chua duoc cai dat!
    echo Vui long cai dat Git tu: https://git-scm.com/download/win
    echo Sau do chay lai script nay.
    pause
    exit /b 1
)

echo [OK] Git da duoc cai dat
echo.

REM Kiểm tra xem đã có git repository chưa
if not exist ".git" (
    echo [INFO] Khoi tao Git repository...
    git init
    if errorlevel 1 (
        echo [ERROR] Khong the khoi tao Git repository
        pause
        exit /b 1
    )
    echo [OK] Da khoi tao Git repository
    echo.
)

REM Thêm tất cả các file
echo [INFO] Dang them cac file vao Git...
git add .
if errorlevel 1 (
    echo [ERROR] Khong the them file vao Git
    pause
    exit /b 1
)
echo [OK] Da them cac file
echo.

REM Kiểm tra xem có thay đổi để commit không
git diff --cached --quiet
if errorlevel 1 (
    echo [INFO] Dang commit cac thay doi...
    git commit -m "Update: Cap nhat du an Dich vu cong quoc gia"
    if errorlevel 1 (
        echo [ERROR] Khong the commit
        pause
        exit /b 1
    )
    echo [OK] Da commit thanh cong
    echo.
) else (
    echo [INFO] Khong co thay doi de commit
    echo.
)

REM Kiểm tra remote
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [INFO] Chua co remote repository
    echo.
    echo ========================================
    echo   CAU HINH REMOTE REPOSITORY
    echo ========================================
    echo.
    echo Buoc 1: Tao repository tren GitHub:
    echo   1. Dang nhap vao https://github.com
    echo   2. Click nut "+" o goc tren ben phai
    echo   3. Chon "New repository"
    echo   4. Dat ten repository (vi du: dich-vu-cong-quoc-gia)
    echo   5. KHONG tich vao "Initialize this repository with a README"
    echo   6. Click "Create repository"
    echo.
    echo Buoc 2: Nhap URL repository cua ban:
    echo   Vi du: https://github.com/username/repository-name.git
    echo.
    set /p REPO_URL="Nhap URL repository: "
    
    if "%REPO_URL%"=="" (
        echo [ERROR] URL khong duoc de trong
        pause
        exit /b 1
    )
    
    git remote add origin %REPO_URL%
    if errorlevel 1 (
        echo [ERROR] Khong the them remote repository
        pause
        exit /b 1
    )
    echo [OK] Da them remote repository
    echo.
)

REM Đổi tên branch thành main (nếu cần)
git branch --show-current >nul 2>&1
if errorlevel 1 (
    git branch -M main
)

REM Push lên GitHub
echo [INFO] Dang day len GitHub...
echo.
git push -u origin main
if errorlevel 1 (
    echo.
    echo [WARNING] Push khong thanh cong!
    echo Co the do:
    echo   - Chua xac thuc voi GitHub
    echo   - Repository chua duoc tao
    echo   - Chua co quyen truy cap
    echo.
    echo Thu chay lai lenh: git push -u origin main
    pause
    exit /b 1
)

echo.
echo ========================================
echo   [SUCCESS] Da day len GitHub thanh cong!
echo ========================================
echo.
pause


# Script tự động cài đặt Git cho Windows
# Yêu cầu: Chạy PowerShell với quyền Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tự động cài đặt Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra quyền Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[WARNING] Script cần quyền Administrator để cài đặt Git" -ForegroundColor Yellow
    Write-Host "Vui lòng chạy lại PowerShell với quyền Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Click chuột phải vào PowerShell" -ForegroundColor Yellow
    Write-Host "  2. Chọn 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

# Kiểm tra Git đã được cài đặt chưa
Write-Host "[INFO] Đang kiểm tra Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "[OK] Git đã được cài đặt: $gitVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "Bạn có muốn cài đặt lại Git không? (y/n)" -ForegroundColor Yellow
        $reinstall = Read-Host
        if ($reinstall -ne "y" -and $reinstall -ne "Y") {
            Write-Host "[INFO] Bỏ qua cài đặt Git" -ForegroundColor Cyan
            exit 0
        }
    }
} catch {
    Write-Host "[INFO] Git chưa được cài đặt" -ForegroundColor Yellow
}

# URL tải Git installer (64-bit)
$gitInstallerUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
$installerPath = "$env:TEMP\GitInstaller.exe"

Write-Host ""
Write-Host "[INFO] Đang tải Git installer..." -ForegroundColor Yellow
Write-Host "URL: $gitInstallerUrl" -ForegroundColor Gray

try {
    # Tải file installer
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $gitInstallerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "[OK] Đã tải Git installer thành công" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Không thể tải Git installer" -ForegroundColor Red
    Write-Host "Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vui lòng tải thủ công từ: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host ""
Write-Host "[INFO] Đang cài đặt Git..." -ForegroundColor Yellow
Write-Host "Quá trình này có thể mất vài phút..." -ForegroundColor Gray
Write-Host ""

# Cài đặt Git với các tùy chọn silent
# /SILENT: Cài đặt im lặng
# /NORESTART: Không khởi động lại
# /COMPONENTS=icons,ext\shellhere,assoc,assoc_sh: Chỉ cài các component cần thiết
# /DIR: Thư mục cài đặt mặc định

try {
    $process = Start-Process -FilePath $installerPath -ArgumentList "/SILENT", "/NORESTART", "/COMPONENTS=icons,ext\shellhere,assoc,assoc_sh" -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "[OK] Đã cài đặt Git thành công!" -ForegroundColor Green
        Write-Host ""
        
        # Cập nhật PATH
        Write-Host "[INFO] Đang cập nhật PATH..." -ForegroundColor Yellow
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Kiểm tra lại
        Start-Sleep -Seconds 2
        try {
            $gitVersion = git --version 2>$null
            if ($gitVersion) {
                Write-Host "[OK] Git đã sẵn sàng: $gitVersion" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] Git đã được cài đặt nhưng cần khởi động lại terminal" -ForegroundColor Yellow
                Write-Host "Vui lòng đóng và mở lại PowerShell/Command Prompt" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[WARNING] Cần khởi động lại terminal để sử dụng Git" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Cài đặt Git không thành công (Exit Code: $($process.ExitCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Không thể cài đặt Git" -ForegroundColor Red
    Write-Host "Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}

# Xóa file installer tạm
if (Test-Path $installerPath) {
    Remove-Item $installerPath -Force
    Write-Host "[INFO] Đã xóa file installer tạm" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Hoàn tất!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lưu ý: Nếu Git chưa hoạt động, vui lòng:" -ForegroundColor Yellow
Write-Host "  1. Đóng và mở lại PowerShell/Command Prompt" -ForegroundColor Yellow
Write-Host "  2. Hoặc khởi động lại máy tính" -ForegroundColor Yellow
Write-Host ""
Read-Host "Nhấn Enter để thoát"


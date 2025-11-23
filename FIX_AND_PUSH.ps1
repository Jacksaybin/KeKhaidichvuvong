# Script sửa lỗi và push lên GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sửa lỗi và đẩy lên GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Chuyển đến thư mục dự án
Set-Location "D:\Dichvucong-main"

# Kiểm tra Git
$gitVersion = & git --version 2>$null
if (-not $gitVersion) {
    Write-Host "[ERROR] Git chưa được nhận diện" -ForegroundColor Red
    exit 1
}

# Cấu hình safe.directory
& git config --global --add safe.directory D:/Dichvucong-main 2>$null

# Kiểm tra Git user
$gitUserName = & git config --global user.name 2>$null
$gitUserEmail = & git config --global user.email 2>$null

if ([string]::IsNullOrWhiteSpace($gitUserName)) {
    & git config --global user.name "Dich Vu Cong"
    Write-Host "[OK] Đã cấu hình user.name" -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($gitUserEmail)) {
    & git config --global user.email "dichvucong@example.com"
    Write-Host "[OK] Đã cấu hình user.email" -ForegroundColor Green
}

# Kiểm tra trạng thái
Write-Host ""
Write-Host "[INFO] Đang kiểm tra trạng thái Git..." -ForegroundColor Yellow
& git status

# Thêm tất cả file
Write-Host ""
Write-Host "[INFO] Đang thêm các file..." -ForegroundColor Yellow
& git add .
Write-Host "[OK] Đã thêm các file" -ForegroundColor Green

# Kiểm tra xem có thay đổi để commit không
$status = & git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "[INFO] Đang commit..." -ForegroundColor Yellow
    & git commit -m "Initial commit: Dự án Cổng Dịch vụ công quốc gia"
    Write-Host "[OK] Đã commit thành công" -ForegroundColor Green
} else {
    Write-Host "[INFO] Không có thay đổi để commit" -ForegroundColor Yellow
}

# Kiểm tra xem có commit nào chưa
$commitCount = & git rev-list --count HEAD 2>$null
if ([string]::IsNullOrWhiteSpace($commitCount) -or $commitCount -eq "0") {
    Write-Host ""
    Write-Host "[ERROR] Chưa có commit nào!" -ForegroundColor Red
    Write-Host "[INFO] Đang tạo commit mặc định..." -ForegroundColor Yellow
    & git commit --allow-empty -m "Initial commit: Dự án Cổng Dịch vụ công quốc gia"
    Write-Host "[OK] Đã tạo commit" -ForegroundColor Green
}

# Đảm bảo có branch main
$currentBranch = & git branch --show-current 2>$null
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Write-Host ""
    Write-Host "[INFO] Đang tạo branch main..." -ForegroundColor Yellow
    & git checkout -b main 2>$null
    if ($LASTEXITCODE -ne 0) {
        & git branch -M main 2>$null
    }
    Write-Host "[OK] Đã tạo branch main" -ForegroundColor Green
} else {
    if ($currentBranch -ne "main") {
        Write-Host ""
        Write-Host "[INFO] Đang đổi tên branch thành main..." -ForegroundColor Yellow
        & git branch -M main 2>$null
        Write-Host "[OK] Đã đổi tên branch thành main" -ForegroundColor Green
    }
}

# Kiểm tra remote
$remoteUrl = & git remote get-url origin 2>$null
if (-not $remoteUrl) {
    Write-Host ""
    Write-Host "[INFO] Chưa có remote. Thêm remote..." -ForegroundColor Yellow
    $repoUrl = Read-Host "Nhập URL repository (ví dụ: https://github.com/username/repo.git)"
    if (-not [string]::IsNullOrWhiteSpace($repoUrl)) {
        & git remote add origin $repoUrl
        Write-Host "[OK] Đã thêm remote" -ForegroundColor Green
    }
}

# Push lên GitHub
Write-Host ""
Write-Host "[INFO] Đang đẩy lên GitHub..." -ForegroundColor Yellow
$currentBranch = & git branch --show-current 2>$null
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    $currentBranch = "main"
}

& git push -u origin $currentBranch
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [SUCCESS] Đã đẩy lên GitHub thành công!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[WARNING] Push không thành công" -ForegroundColor Yellow
    Write-Host "Thử chạy: git push -u origin $currentBranch" -ForegroundColor White
}

Write-Host ""
Read-Host "Nhấn Enter để thoát"


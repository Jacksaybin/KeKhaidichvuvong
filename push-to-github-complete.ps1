# Script hoàn chỉnh: Refresh PATH và đẩy dự án lên GitHub
# Yêu cầu: Chạy PowerShell với quyền Administrator (nếu cần)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Đẩy dự án lên GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH để nhận diện Git mới cài đặt
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Kiểm tra Git
Write-Host "[INFO] Đang kiểm tra Git..." -ForegroundColor Yellow
try {
    $gitVersion = & git --version 2>$null
    if ($gitVersion) {
        Write-Host "[OK] $gitVersion" -ForegroundColor Green
    }
    else {
        Write-Host "[ERROR] Git chưa được nhận diện. Vui lòng đóng và mở lại PowerShell." -ForegroundColor Red
        Write-Host ""
        Read-Host "Nhấn Enter để thoát"
        exit 1
    }
}
catch {
    Write-Host "[ERROR] Git chưa được nhận diện. Vui lòng đóng và mở lại PowerShell." -ForegroundColor Red
    Write-Host ""
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host ""

# Chuyển đến thư mục dự án
$projectPath = "D:\Dichvucong-main"
Set-Location $projectPath
Write-Host "[INFO] Đã chuyển đến: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Thêm thư mục vào safe.directory để tránh lỗi quyền sở hữu
Write-Host "[INFO] Đang cấu hình Git safe.directory..." -ForegroundColor Yellow
$safeDir = & git config --global --get-all safe.directory 2>$null
if ($safeDir -notcontains $projectPath -and $safeDir -notcontains "D:/Dichvucong-main") {
    & git config --global --add safe.directory $projectPath
    & git config --global --add safe.directory "D:/Dichvucong-main"
    Write-Host "[OK] Đã thêm thư mục vào safe.directory" -ForegroundColor Green
}
Write-Host ""

# Kiểm tra xem đã có git repository chưa
if (-not (Test-Path ".git")) {
    Write-Host "[INFO] Khởi tạo Git repository..." -ForegroundColor Yellow
    & git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Không thể khởi tạo Git repository" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát"
        exit 1
    }
    Write-Host "[OK] Đã khởi tạo Git repository" -ForegroundColor Green
    Write-Host ""
}

# Cấu hình Git user (nếu chưa có)
Write-Host "[INFO] Đang kiểm tra cấu hình Git user..." -ForegroundColor Yellow
$gitUserName = & git config --global user.name 2>$null
$gitUserEmail = & git config --global user.email 2>$null

if ([string]::IsNullOrWhiteSpace($gitUserName) -or [string]::IsNullOrWhiteSpace($gitUserEmail)) {
    Write-Host "[INFO] Cần cấu hình Git user" -ForegroundColor Yellow
    Write-Host ""
    
    if ([string]::IsNullOrWhiteSpace($gitUserName)) {
        $userName = Read-Host "Nhập tên của bạn (hoặc Enter để dùng 'Dich Vu Cong')"
        if ([string]::IsNullOrWhiteSpace($userName)) {
            $userName = "Dich Vu Cong"
        }
        & git config --global user.name $userName
        Write-Host "[OK] Đã cấu hình user.name: $userName" -ForegroundColor Green
    }
    
    if ([string]::IsNullOrWhiteSpace($gitUserEmail)) {
        $userEmail = Read-Host "Nhập email của bạn (hoặc Enter để dùng 'dichvucong@example.com')"
        if ([string]::IsNullOrWhiteSpace($userEmail)) {
            $userEmail = "dichvucong@example.com"
        }
        & git config --global user.email $userEmail
        Write-Host "[OK] Đã cấu hình user.email: $userEmail" -ForegroundColor Green
    }
    Write-Host ""
}
else {
    Write-Host "[OK] Git user đã được cấu hình: $gitUserName <$gitUserEmail>" -ForegroundColor Green
    Write-Host ""
}

# Thêm tất cả các file
Write-Host "[INFO] Đang thêm các file vào Git..." -ForegroundColor Yellow
& git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Không thể thêm file vào Git" -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát"
    exit 1
}
Write-Host "[OK] Đã thêm các file" -ForegroundColor Green
Write-Host ""

# Kiểm tra xem có thay đổi để commit không
$status = & git status --porcelain
if ($status) {
    Write-Host "[INFO] Đang commit các thay đổi..." -ForegroundColor Yellow
    & git commit -m "Initial commit: Dự án Cổng Dịch vụ công quốc gia"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Không thể commit" -ForegroundColor Red
        Write-Host "[INFO] Có thể do chưa cấu hình Git user. Thử chạy:" -ForegroundColor Yellow
        Write-Host "  git config --global user.name 'Your Name'" -ForegroundColor White
        Write-Host "  git config --global user.email 'your.email@example.com'" -ForegroundColor White
        Read-Host "Nhấn Enter để thoát"
        exit 1
    }
    Write-Host "[OK] Đã commit thành công" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host "[INFO] Không có thay đổi để commit" -ForegroundColor Yellow
    Write-Host ""
}

# Kiểm tra remote
Write-Host "[INFO] Đang kiểm tra remote repository..." -ForegroundColor Yellow
$remoteUrl = & git remote get-url origin 2>$null

if (-not $remoteUrl) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  CẤU HÌNH REMOTE REPOSITORY" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Bước 1: Tạo repository trên GitHub:" -ForegroundColor Yellow
    Write-Host "  1. Đăng nhập vào https://github.com" -ForegroundColor White
    Write-Host "  2. Click nút '+' ở góc trên bên phải" -ForegroundColor White
    Write-Host "  3. Chọn 'New repository'" -ForegroundColor White
    Write-Host "  4. Đặt tên repository (ví dụ: dich-vu-cong-quoc-gia)" -ForegroundColor White
    Write-Host "  5. KHÔNG tích vào 'Initialize this repository with a README'" -ForegroundColor White
    Write-Host "  6. Click 'Create repository'" -ForegroundColor White
    Write-Host ""
    Write-Host "Bước 2: Nhập URL repository của bạn:" -ForegroundColor Yellow
    Write-Host "  Ví dụ: https://github.com/username/repository-name.git" -ForegroundColor Gray
    Write-Host ""
    
    $repoUrl = Read-Host "Nhập URL repository"
    
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host "[ERROR] URL không được để trống" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát"
        exit 1
    }
    
    & git remote add origin $repoUrl
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Không thể thêm remote repository" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát"
        exit 1
    }
    Write-Host "[OK] Đã thêm remote repository" -ForegroundColor Green
    Write-Host ""
}

# Kiểm tra xem có commit nào chưa
$commitCount = & git rev-list --count HEAD 2>$null
if ([string]::IsNullOrWhiteSpace($commitCount) -or $commitCount -eq "0") {
    Write-Host "[ERROR] Chưa có commit nào. Vui lòng commit trước khi push." -ForegroundColor Red
    Write-Host ""
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

# Đổi tên branch thành main (nếu cần)
$currentBranch = & git branch --show-current 2>$null
if (-not $currentBranch) {
    Write-Host "[INFO] Đang tạo branch main..." -ForegroundColor Yellow
    & git branch -M main 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] Không thể đổi tên branch. Sử dụng branch hiện tại." -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Đã tạo branch main" -ForegroundColor Green
    }
    Write-Host ""
}

# Kiểm tra branch hiện tại
$currentBranch = & git branch --show-current 2>$null
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Write-Host "[INFO] Đang checkout sang branch main..." -ForegroundColor Yellow
    & git checkout -b main 2>$null
    $currentBranch = "main"
}

Write-Host "[INFO] Branch hiện tại: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# Push lên GitHub
Write-Host "[INFO] Đang đẩy lên GitHub..." -ForegroundColor Yellow
Write-Host ""

& git push -u origin $currentBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Push không thành công!" -ForegroundColor Yellow
    Write-Host "Có thể do:" -ForegroundColor Yellow
    Write-Host "  - Chưa xác thực với GitHub" -ForegroundColor White
    Write-Host "  - Repository chưa được tạo" -ForegroundColor White
    Write-Host "  - Chưa có quyền truy cập" -ForegroundColor White
    Write-Host "  - Chưa có commit nào" -ForegroundColor White
    Write-Host ""
    Write-Host "Thử các lệnh sau:" -ForegroundColor Yellow
    Write-Host "  git status" -ForegroundColor White
    Write-Host "  git log --oneline" -ForegroundColor White
    Write-Host "  git push -u origin $currentBranch" -ForegroundColor White
    Write-Host ""
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [SUCCESS] Đã đẩy lên GitHub thành công!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Nhấn Enter để thoát"


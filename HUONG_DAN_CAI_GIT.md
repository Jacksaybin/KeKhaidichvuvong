# Hướng dẫn tự động cài đặt Git

## Cách 1: Sử dụng script tự động (Khuyến nghị)

### Bước 1: Chạy script với quyền Administrator

1. **Click chuột phải** vào file `install-git.bat`
2. Chọn **"Run as Administrator"**
3. Làm theo hướng dẫn trên màn hình

### Hoặc sử dụng PowerShell:

1. **Click chuột phải** vào file `install-git.ps1`
2. Chọn **"Run with PowerShell"** hoặc **"Run as Administrator"**
3. Nếu gặp lỗi về Execution Policy, chạy lệnh:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
4. Sau đó chạy lại script

## Cách 2: Cài đặt thủ công

1. Truy cập: https://git-scm.com/download/win
2. Tải Git installer
3. Chạy installer và làm theo hướng dẫn
4. Chọn các tùy chọn mặc định (recommended)

## Sau khi cài đặt

1. **Đóng và mở lại** PowerShell/Command Prompt
2. Kiểm tra Git đã được cài đặt:
   ```bash
   git --version
   ```
3. Cấu hình Git lần đầu (nếu cần):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## Lưu ý

- Script sẽ tự động tải và cài đặt Git phiên bản mới nhất
- Quá trình cài đặt có thể mất vài phút
- Có thể cần khởi động lại terminal sau khi cài đặt
- Nếu gặp lỗi, vui lòng cài đặt thủ công từ trang chính thức

## Kiểm tra Git đã hoạt động

Sau khi cài đặt, chạy lệnh sau để kiểm tra:

```bash
git --version
```

Nếu hiển thị phiên bản Git (ví dụ: `git version 2.43.0`), nghĩa là đã cài đặt thành công!

## Tiếp theo

Sau khi cài đặt Git thành công, bạn có thể:
1. Chạy file `push-to-github.bat` để đẩy dự án lên GitHub
2. Hoặc làm theo hướng dẫn trong file `GITHUB_SETUP.md`


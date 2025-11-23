# Hướng dẫn đẩy dự án lên GitHub

## Bước 1: Cài đặt Git (nếu chưa có)

1. Tải Git từ: https://git-scm.com/download/win
2. Cài đặt Git với các tùy chọn mặc định
3. Mở lại terminal/command prompt sau khi cài đặt

## Bước 2: Khởi tạo Git Repository

Mở terminal/command prompt và chạy các lệnh sau:

```bash
cd D:\Dichvucong-main
git init
```

## Bước 3: Thêm các file vào Git

```bash
git add .
```

## Bước 4: Commit lần đầu

```bash
git commit -m "Initial commit: Dự án Cổng Dịch vụ công quốc gia"
```

## Bước 5: Tạo Repository trên GitHub

1. Đăng nhập vào GitHub: https://github.com
2. Click vào nút "+" ở góc trên bên phải
3. Chọn "New repository"
4. Đặt tên repository (ví dụ: `dich-vu-cong-quoc-gia`)
5. Chọn Public hoặc Private
6. **KHÔNG** tích vào "Initialize this repository with a README"
7. Click "Create repository"

## Bước 6: Kết nối với GitHub và Push

Sau khi tạo repository, GitHub sẽ hiển thị các lệnh. Chạy:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Lưu ý:** Thay `YOUR_USERNAME` và `YOUR_REPO_NAME` bằng thông tin repository của bạn.

## Bước 7: Cập nhật sau khi thay đổi

Khi có thay đổi mới, chạy:

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

## Các file đã được bỏ qua (.gitignore)

- `.vscode/` (cấu hình VS Code)
- `node_modules/` (nếu có)
- Các file tạm và cache

## Lưu ý quan trọng

- **KHÔNG** commit các thông tin nhạy cảm (API keys, passwords)
- Kiểm tra `.gitignore` trước khi commit
- Sử dụng commit message rõ ràng, mô tả thay đổi


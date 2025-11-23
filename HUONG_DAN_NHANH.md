# Hướng dẫn nhanh cài đặt Git

## ⚡ Cách nhanh nhất (Khuyến nghị)

### Bước 1: Chạy file .bat với quyền Administrator

1. Mở **File Explorer** (Windows + E)
2. Đi đến thư mục: **D:\Dichvucong-main**
3. **Click chuột phải** vào file **`install-git.bat`**
4. Chọn **"Run as Administrator"**
5. Click **"Yes"** khi Windows hỏi quyền
6. Đợi script tự động cài đặt (2-5 phút)

### Bước 2: Kiểm tra Git đã cài đặt

1. Mở **PowerShell** hoặc **Command Prompt** mới
2. Chạy lệnh:
   ```bash
   git --version
   ```
3. Nếu hiển thị phiên bản Git (ví dụ: `git version 2.43.0`) → **Thành công!**

---

## 🔧 Nếu gặp lỗi

### Lỗi: "Script cần quyền Administrator"
**Giải pháp:** Đảm bảo bạn đã click chuột phải và chọn "Run as Administrator"

### Lỗi: "Execution Policy"
**Giải pháp:** Mở PowerShell với quyền Administrator và chạy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Sau đó chạy lại `install-git.bat`

### Lỗi: "File không tìm thấy"
**Giải pháp:** 
1. Đảm bảo bạn đang ở thư mục `D:\Dichvucong-main`
2. Hoặc chạy với đường dẫn đầy đủ:
   ```powershell
   & "D:\Dichvucong-main\install-git.ps1"
   ```

---

## 📝 Cài đặt thủ công (Nếu script không hoạt động)

1. Truy cập: https://git-scm.com/download/win
2. Tải Git installer (64-bit)
3. Chạy installer và chọn "Next" cho tất cả các bước
4. Sau khi cài đặt xong, đóng và mở lại terminal

---

## ✅ Sau khi cài đặt thành công

Bạn có thể:
1. Chạy `push-to-github.bat` để đẩy dự án lên GitHub
2. Hoặc làm theo hướng dẫn trong `GITHUB_SETUP.md`

---

## 💡 Mẹo

- Luôn chạy PowerShell/Command Prompt với quyền Administrator khi cài đặt phần mềm
- Nếu Git chưa hoạt động sau khi cài, thử khởi động lại máy tính
- Kiểm tra Git bằng lệnh: `git --version`


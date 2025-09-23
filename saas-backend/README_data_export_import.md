# Hướng dẫn Xuất và Nhập Dữ liệu Models

## Tổng quan
Hệ thống cung cấp 2 script để xuất và nhập dữ liệu từ tất cả các models trong Laravel:

1. `export_models_data.php` - Xuất dữ liệu từ database ra file JSON
2. `import_models_data.php` - Nhập dữ liệu từ file JSON vào database

## Các Models được hỗ trợ
- AIModel
- Bill  
- File
- Generate
- OpenAI
- PayPalTransaction
- PricingPlan
- User (loại bỏ password và remember_token khi xuất)
- UserCredit
- Voice

## Cách sử dụng

### 1. Xuất dữ liệu
```bash
php export_models_data.php
```

Script sẽ:
- Xuất tất cả dữ liệu từ các models
- Tạo thư mục `exports/` nếu chưa có
- Lưu file JSON với tên `models_export_YYYY-MM-DD_HH-mm-ss.json`
- Hiển thị thống kê số lượng records và kích thước file

### 2. Chỉnh sửa dữ liệu
- Mở file JSON trong `exports/` folder
- Chỉnh sửa dữ liệu theo nhu cầu
- Lưu file với tên mới hoặc giữ nguyên

### 3. Nhập dữ liệu
```bash
php import_models_data.php <tên_file_json>
```

Ví dụ:
```bash
php import_models_data.php models_export_2025-09-23_08-14-14.json
```

Script sẽ:
- Đọc file JSON từ thư mục `exports/`
- Sử dụng `updateOrCreate()` để cập nhật hoặc tạo mới records
- Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
- Rollback nếu có lỗi xảy ra

## Lưu ý quan trọng

### Bảo mật
- Dữ liệu User được xuất **không bao gồm** password và remember_token
- Khi nhập lại, password của user hiện tại sẽ được giữ nguyên

### Backup
- **Luôn backup database** trước khi chạy import
- Script sử dụng `updateOrCreate()` nên sẽ ghi đè dữ liệu hiện tại

### Transaction
- Import sử dụng database transaction
- Nếu có lỗi, tất cả thay đổi sẽ được rollback

## Ví dụ sử dụng

### Xuất dữ liệu
```bash
$ php export_models_data.php

Exporting AIModel data...
Exporting Bill data...
...
=== EXPORT COMPLETED ===
File saved: E:\path\to\exports/models_export_2025-09-23_08-14-14.json
Total records exported:
- ai_models: 11 records
- bills: 8 records
- users: 7 records
...
File size: 1,569.23 KB
```

### Nhập dữ liệu
```bash
$ php import_models_data.php models_export_2025-09-23_08-14-14.json

Reading JSON file: models_export_2025-09-23_08-14-14.json
=== STARTING IMPORT ===
Importing AIModel data...
- Imported 11 AIModel records
Importing Bill data...
- Imported 8 Bill records
...
=== IMPORT COMPLETED SUCCESSFULLY ===
```

## Xử lý lỗi
- Nếu file JSON không tồn tại hoặc không hợp lệ, script sẽ báo lỗi
- Nếu có lỗi database trong quá trình import, tất cả thay đổi sẽ được rollback
- Chi tiết lỗi và stack trace sẽ được hiển thị để debug
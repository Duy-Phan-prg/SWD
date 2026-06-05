# Phase 0 - Nền tảng dùng chung

## 1. Swagger UI

### Tên mô tả API
Mở Swagger UI để xem và test toàn bộ API contract.

### API
```http
GET /swagger-ui/index.html
```

### JSON
```json
{}
```

### Post-response
```text
Trang HTML Swagger UI.
```

## 2. OpenAPI Docs

### Tên mô tả API
Lấy tài liệu OpenAPI dạng JSON.

### API
```http
GET /v3/api-docs
```

### JSON
```json
{}
```

### Post-response
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "CinemaAI API"
  },
  "paths": {}
}
```

## 3. Kiểm tra endpoint cần đăng nhập

### Tên mô tả API
Kiểm tra security foundation. Nếu gọi endpoint cần token mà không gửi token thì backend trả lỗi xác thực.

### API
```http
GET /api/v1/users/me
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": false,
  "message": "Unauthorized",
  "path": "/api/v1/users/me",
  "errors": [],
  "timestamp": "2026-06-02T20:00:00"
}
```

# Phase 2 - Auth, user và security

## 1. Đăng ký

### Tên mô tả API
Đăng ký tài khoản customer. Backend lưu tạm vào `pending_registrations` và gửi OTP email.

### API
```http
POST /api/v1/auth/register
```

### JSON
```json
{
  "email": "customer@example.com",
  "password": "Password123",
  "fullName": "Customer One",
  "phone": "0900111222"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "user": {
      "email": "customer@example.com",
      "roles": ["CUSTOMER"]
    },
    "emailVerificationRequired": true
  },
  "message": "Registered successfully"
}
```

## 2. Xác minh email

### Tên mô tả API
Xác minh OTP email để tạo user thật.

### API
```http
POST /api/v1/auth/verify-email
```

### JSON
```json
{
  "email": "customer@example.com",
  "otp": "123456"
}
```

### Post-response
```json
{
  "success": true,
  "data": null,
  "message": "Email verified successfully"
}
```

## 3. Đăng nhập

### Tên mô tả API
Đăng nhập bằng email/password và nhận access token.

### API
```http
POST /api/v1/auth/login
```

### JSON
```json
{
  "username": "customer@example.com",
  "password": "Password123"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "accessToken": "JWT_ACCESS_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "tokenType": "Bearer",
    "expiresInMs": 900000,
    "user": {
      "id": 1,
      "email": "customer@example.com",
      "roles": ["CUSTOMER"]
    }
  },
  "message": "Logged in successfully"
}
```

## 4. Lấy thông tin user hiện tại

### Tên mô tả API
Lấy profile user đang đăng nhập.

### API
```http
GET /api/v1/users/me
Authorization: Bearer JWT_ACCESS_TOKEN
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "Customer One",
    "phone": "0900111222",
    "roles": ["CUSTOMER"]
  }
}
```

## 5. Refresh token

### Tên mô tả API
Cấp access token mới từ refresh token.

### API
```http
POST /api/v1/auth/refresh
```

### JSON
```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "accessToken": "NEW_JWT_ACCESS_TOKEN",
    "refreshToken": "REFRESH_TOKEN",
    "tokenType": "Bearer"
  },
  "message": "Token refreshed successfully"
}
```

## 6. Đăng xuất

### Tên mô tả API
Thu hồi refresh token.

### API
```http
POST /api/v1/auth/logout
```

### JSON
```json
{
  "refreshToken": "REFRESH_TOKEN"
}
```

### Post-response
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

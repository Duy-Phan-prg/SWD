# Phase 2 - Post-response Scripts

Dán phần **Post-response** vào tab **Scripts -> Post-response** trong Postman.

## 1. Đăng ký

### Tên mô tả API
Đăng ký tài khoản customer và lưu email để dùng cho bước verify.

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
```javascript
const body = pm.response.json();

pm.test("Đăng ký thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

if (body.data?.user?.email) {
  pm.collectionVariables.set("customerEmail", body.data.user.email);
}

if (body.data?.emailVerificationRequired !== undefined) {
  pm.collectionVariables.set("emailVerificationRequired", body.data.emailVerificationRequired);
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
```javascript
const body = pm.response.json();

pm.test("Xác minh email thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("emailVerified", true);
```

## 3. Đăng nhập

### Tên mô tả API
Đăng nhập và tự lưu access token, refresh token vào Environment.

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
```javascript
const body = pm.response.json();

pm.test("Đăng nhập thành công", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.accessToken).to.not.be.empty;
});

pm.collectionVariables.set("accessToken", body.data.accessToken);
pm.collectionVariables.set("refreshToken", body.data.refreshToken);
pm.collectionVariables.set("tokenType", body.data.tokenType || "Bearer");

if (body.data.user?.id) {
  pm.collectionVariables.set("userId", body.data.user.id);
}

if (body.data.user?.email) {
  pm.collectionVariables.set("userEmail", body.data.user.email);
}
```

## 3.1. Đăng nhập admin seed

### Tên mô tả API
Đăng nhập bằng account admin được tạo sẵn trong seeder để test các API admin.

### API
```http
POST /api/v1/auth/login
```

### JSON
```json
{
  "username": "admin@cinemaai.com",
  "password": "Admin123"
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Đăng nhập admin seed thành công", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.accessToken).to.not.be.empty;
});

pm.collectionVariables.set("accessToken", body.data.accessToken);
pm.collectionVariables.set("{{adminToken}}", body.data.accessToken);
pm.collectionVariables.set("refreshToken", body.data.refreshToken);
pm.collectionVariables.set("tokenType", body.data.tokenType || "Bearer");

if (body.data.user?.id) {
  pm.collectionVariables.set("adminUserId", body.data.user.id);
}

if (body.data.user?.email) {
  pm.collectionVariables.set("adminEmail", body.data.user.email);
}
```

## 4. Lấy user hiện tại

### Tên mô tả API
Lấy profile user đang đăng nhập và lưu user id/email.

### API
```http
GET /api/v1/users/me
Authorization: Bearer {{accessToken}}
```

### JSON
```json
{}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Lấy user hiện tại thành công", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("userId", body.data.id);
pm.collectionVariables.set("userEmail", body.data.email);
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
```javascript
const body = pm.response.json();

pm.test("Refresh token thành công", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("accessToken", body.data.accessToken);

if (body.data.refreshToken) {
  pm.collectionVariables.set("refreshToken", body.data.refreshToken);
}
```

## 6. Đăng xuất

### Tên mô tả API
Thu hồi refresh token và xóa token khỏi Environment.

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
```javascript
const body = pm.response.json();

pm.test("Đăng xuất thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.unset("accessToken");
pm.collectionVariables.unset("refreshToken");
```

# Phase 0 - Post-response Scripts

Dán phần **Post-response** vào tab **Scripts -> Post-response** trong Postman.

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
```javascript
pm.test("Swagger UI trả HTML hoặc redirect hợp lệ", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 301, 302]);
});
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
```javascript
const body = pm.response.json();

pm.test("OpenAPI docs trả về thành công", function () {
  pm.expect(pm.response.code).to.eql(200);
  pm.expect(body).to.have.property("openapi");
  pm.expect(body).to.have.property("paths");
});

if (body.info?.title) {
  pm.collectionVariables.set("openapiTitle", body.info.title);
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
```javascript
let body = {};

try {
  body = pm.response.json();
} catch (error) {
  console.log("Response không phải JSON");
}

pm.test("Endpoint cần đăng nhập trả Unauthorized", function () {
  pm.expect(pm.response.code).to.be.oneOf([401, 403]);
});

if (body.message) {
  pm.collectionVariables.set("lastAuthError", body.message);
}
```

# Phase 1 - Post-response Scripts

Dán phần **Post-response** vào tab **Scripts -> Post-response** trong Postman.

## 1. Tạo genre seed/test

### Tên mô tả API
Tạo genre để kiểm tra schema và dữ liệu nền.

### API
```http
POST /api/v1/admin/genres
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Action Test {{$timestamp}}",
  "description": "Thể loại phim hành động dùng để test dữ liệu seed và kiểm tra schema database trong CinemaAI. Mô tả này cố ý dài hơn hai trăm ký tự để đáp ứng validation hiện tại của backend, đồng thời giúp tester không gặp lỗi bad request khi tạo genre bằng Postman."
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo genre thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

if (body.data?.id) {
  pm.collectionVariables.set("genreId", body.data.id);
}

if (body.data?.name) {
  pm.collectionVariables.set("genreName", body.data.name);
}
```

## 2. Tạo movie seed/test

### Tên mô tả API
Tạo movie để kiểm tra schema movie cơ bản.

### API
```http
POST /api/v1/admin/movies
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "title": "Action Movie A {{$timestamp}}",
  "description": "Phim dùng để test API.",
  "durationMinutes": 120,
  "status": "NOW_SHOWING",
  "ageRating": "13+",
  "director": "Director Test",
  "mainActors": "Actor Test",
  "castList": "Actor Test, Supporting Actor"
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo movie thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

if (body.data?.id) {
  pm.collectionVariables.set("movieId", body.data.id);
}

if (body.data?.title) {
  pm.collectionVariables.set("movieTitle", body.data.title);
}
```

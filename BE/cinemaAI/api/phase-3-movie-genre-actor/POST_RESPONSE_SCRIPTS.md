# Phase 3 - Post-response Scripts

Dán phần **Post-response** vào tab **Scripts -> Post-response** trong Postman.

## 1. Tạo genre

### Tên mô tả API
Tạo thể loại phim và lưu `genreId` để gán vào movie.

### API
```http
POST /api/v1/admin/genres
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Action Test {{$timestamp}}",
  "description": "Thể loại phim hành động dùng để test API tạo genre trong CinemaAI. Mô tả này cố ý dài hơn hai trăm ký tự để đáp ứng validation hiện tại của backend, đồng thời tránh lỗi bad request khi tester copy JSON trực tiếp vào Postman."
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo genre thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("genreId", body.data.id);
pm.collectionVariables.set("genreName", body.data.name);
```

## 2. Tạo movie

### Tên mô tả API
Tạo phim với metadata đủ cho booking và recommendation. Genre được gán ngay lúc tạo movie qua `genreIds`.

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
  "status": "UPCOMING",
  "ageRating": "13+",
  "director": "Director A",
  "mainActors": "Actor A",
  "castList": "Actor A, Supporting Actor",
  "genreIds": [{{genreId}}]
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo movie thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("movieId", body.data.id);
pm.collectionVariables.set("phase3MovieId", body.data.id);
pm.collectionVariables.set("movieTitle", body.data.title);
```

## 3. Tạo actor

### Tên mô tả API
Tạo diễn viên và lưu `actorId` để gán vào movie.

### API
```http
POST /api/v1/admin/actors
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Actor A",
  "biography": "Diễn viên dùng để test recommendation theo actor."
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo actor thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
});

pm.collectionVariables.set("actorId", body.data.id);
pm.collectionVariables.set("actorName", body.data.name);
```

## 4. Tìm phim public theo genre

### Tên mô tả API
Kiểm tra movie vừa tạo có được gán genre đúng hay không. Nếu movie đang `UPCOMING`, có thể cần đổi status sang `NOW_SHOWING` trước khi tìm public.

### API
```http
GET /api/v1/movies?genreId={{genreId}}&page=0&size=20
```

### JSON
```json
{}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tìm phim theo genre thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
});

const items = body.data?.items || body.data || [];

if (items[0]?.id) {
  pm.collectionVariables.set("foundMovieId", items[0].id);
}
```

## 5. Gán actor cho movie

### Tên mô tả API
Gán diễn viên vào phim để AI có thể recommend theo diễn viên yêu thích.

### API
```http
PUT /api/v1/admin/movies/{{phase3MovieId}}/actors
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "actorIds": [{{actorId}}]
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Gán actor cho movie thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
});

if (body.data?.id) {
  pm.collectionVariables.set("movieId", body.data.id);
  pm.collectionVariables.set("phase3MovieId", body.data.id);
}
```

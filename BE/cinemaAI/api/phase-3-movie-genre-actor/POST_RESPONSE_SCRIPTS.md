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

## 2. Tạo actor

### Tên mô tả API
Tạo diễn viên trước khi tạo movie và lưu `actorId` để FE/dropdown hoặc movie payload dùng lại.

### API
```http
POST /api/v1/admin/actors
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Bao Khanh {{$timestamp}}",
  "biography": "Diễn viên dùng để test phase 3 và recommendation theo actor.",
  "avatarUrl": "https://example.com/bao-khanh.jpg"
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

## 3. Load/Search actor cho dropdown

### Tên mô tả API
Mô phỏng FE: khi mở ô thêm diễn viên thì load list actor ban đầu; khi admin nhập tên gần giống, ví dụ `Bao`, API trả danh sách actor phù hợp để dropdown chọn. Sau khi admin click một actor, FE dùng `id` actor đó để gửi vào `actorIds`.

### API - Load list ban đầu
```http
GET /api/v1/admin/actors?limit=20
Authorization: Bearer {{adminToken}}
```

### API - Search theo tên
```http
GET /api/v1/admin/actors?keyword=Bao&limit=20
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Load/search actor dropdown thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data).to.be.an("array");
});

const matchedActor = (body.data || []).find(actor => actor.id === Number(pm.collectionVariables.get("actorId"))) || body.data?.[0];

if (matchedActor?.id) {
  pm.collectionVariables.set("actorId", matchedActor.id);
  pm.collectionVariables.set("actorName", matchedActor.name);
}
```

## 4. Tạo movie

### Tên mô tả API
Tạo phim với metadata đủ cho booking và recommendation. Genre được gán qua `genreIds`, actor đã tạo được gán qua `actorIds`. `actorIds` là id của diễn viên admin đã click chọn trong dropdown.
`mainActors` và `castList` chỉ là text metadata để hiển thị. Nếu FE không muốn tự ghép tên, có thể gửi rỗng; backend sẽ tự fill từ các actor trong `actorIds`.

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
  "mainActors": "",
  "castList": "",
  "genreIds": [{{genreId}}],
  "actorIds": [{{actorId}}]
}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Tạo movie thành công", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data.actors.map(actor => actor.id)).to.include(Number(pm.collectionVariables.get("actorId")));
});

pm.collectionVariables.set("movieId", body.data.id);
pm.collectionVariables.set("phase3MovieId", body.data.id);
pm.collectionVariables.set("movieTitle", body.data.title);
```

## 5. Tìm phim public theo genre

### Tên mô tả API
Kiểm tra movie vừa tạo có được gán genre đúng hay không.

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

## 6. Gán lại actor cho movie

### Tên mô tả API
Thay thế danh sách diễn viên của phim. Bước này dùng để test endpoint update actor sau khi movie đã tạo.

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

## 7. Lấy phim theo actor

### Tên mô tả API
Kiểm tra actor đã được gán vào movie và lấy danh sách phim theo diễn viên.

### API
```http
GET /api/v1/actors/{{actorId}}/movies
```

### JSON
```json
{}
```

### Post-response
```javascript
const body = pm.response.json();

pm.test("Lấy phim theo actor thành công", function () {
  pm.expect(pm.response.code).to.be.within(200, 299);
  pm.expect(body.success).to.eql(true);
  pm.expect(body.data).to.be.an("array");
});

const expectedMovieId = Number(pm.collectionVariables.get("phase3MovieId"));
const matchedMovie = (body.data || []).find(movie => movie.id === expectedMovieId);

pm.test("Actor có movie vừa tạo", function () {
  pm.expect(matchedMovie).to.not.be.undefined;
});
```

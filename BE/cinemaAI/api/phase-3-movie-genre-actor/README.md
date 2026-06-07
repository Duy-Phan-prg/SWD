# Phase 3 - Phim, thể loại và diễn viên

## 1. Tạo thể loại

### Tên mô tả API
Admin tạo thể loại phim.

### API
```http
POST /api/v1/admin/genres
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Action",
  "description": "Mô tả thể loại phải đủ dài theo validation hiện tại. Có thể ghi nội dung từ 200 đến 1000 ký tự để backend chấp nhận khi test API tạo thể loại."
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Action",
    "description": "Mô tả thể loại..."
  },
  "message": "Genre created successfully"
}
```

## 2. Tạo diễn viên

### Tên mô tả API
Admin phải tạo diễn viên trước khi gán vào phim. Khi test bằng Postman, lưu id diễn viên vào `actorId`.

### API
```http
POST /api/v1/admin/actors
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "name": "Bao Khanh",
  "biography": "Diễn viên dùng để test phase 3.",
  "avatarUrl": "https://example.com/bao-khanh.jpg"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Bao Khanh",
    "movieCount": 0
  },
  "message": "Actor created successfully"
}
```

## 3. Load/Search diễn viên cho dropdown

### Tên mô tả API
Khi admin mở ô thêm diễn viên trong form tạo phim, FE gọi API này để lấy danh sách actor đã tạo.
Nếu chưa nhập gì thì gọi không có `keyword` để xổ danh sách ban đầu. Khi admin nhập tên gần giống, ví dụ `B` hoặc `Bao`, FE gọi lại với `keyword` để lọc danh sách.
Khi admin click một diễn viên trong dropdown, FE lấy `id` của actor đó và đưa vào `actorIds` khi tạo phim.

### API - Load toàn bộ list ban đầu
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
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Bao Khanh",
      "movieCount": 0
    },
    {
      "id": 2,
      "name": "Bao Chi",
      "movieCount": 0
    }
  ]
}
```

## 4. Tạo phim

### Tên mô tả API
Admin tạo phim, gán thể loại qua `genreIds` và gán diễn viên đã tồn tại qua `actorIds`.
Backend không tự tạo diễn viên từ `mainActors/castList` nữa. Nếu `actorIds` không tồn tại, API trả lỗi `Actor not found`.
`actorIds` chính là danh sách id lấy từ actor mà admin click trong dropdown.
`actorIds` là toàn bộ diễn viên của phim. `mainActorIds` là các diễn viên chính và phải là tập con của `actorIds`.
Backend tự sinh `mainActors` từ `mainActorIds` và `castList` từ `actorIds`.
Khi test bằng Postman, lưu id phim vừa tạo vào `phase3MovieId`.

### API
```http
POST /api/v1/admin/movies
Authorization: Bearer {{adminToken}}
```

### JSON
```json
{
  "title": "Action Movie A",
  "description": "Phim dùng để test API.",
  "trailerUrl": "https://example.com/trailer.mp4",
  "posterUrl": "https://example.com/poster.jpg",
  "avatarUrl": "https://example.com/avatar.jpg",
  "durationMinutes": 120,
  "releaseDate": "2026-07-01",
  "language": "English",
  "subtitleLanguage": "Vietnamese",
  "status": "UPCOMING",
  "ageRating": "13+",
  "director": "Action Director",
  "genreIds": [{{genreId}}],
  "actorIds": [{{actorId}}, {{supportingActorId}}],
  "mainActorIds": [{{actorId}}]
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Action Movie A",
    "status": "UPCOMING",
    "ageRating": "13+",
    "genres": [{"id": 1, "name": "Action"}],
    "actors": [{"id": 1, "name": "Bao Khanh", "movieCount": 1}]
  },
  "message": "Movie created successfully"
}
```

## 5. Tìm phim public

### Tên mô tả API
Khách tìm phim public. API không trả phim có trạng thái `INACTIVE`.

### API
```http
GET /api/v1/movies?keyword=Action&genreId={{genreId}}&page=0&size=20
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
    "items": [
      {
        "id": 1,
        "title": "Action Movie A",
        "status": "UPCOMING"
      }
    ],
    "page": 0,
    "size": 20
  }
}
```

## 6. Lấy phim theo diễn viên

### Tên mô tả API
Lấy danh sách phim có diễn viên đó.

### API
```http
GET /api/v1/actors/{{actorId}}/movies
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Action Movie A",
      "actors": [{"id": 1, "name": "Bao Khanh"}]
    }
  ]
}
```

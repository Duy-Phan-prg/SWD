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

## 2. Tạo phim

### Tên mô tả API
Admin tạo phim, gán thể loại qua `genreIds` và tự đồng bộ diễn viên từ `mainActors/castList` sang bảng `Actor`/`MovieActor`.
Khi test bằng Postman, lưu id phim vừa tạo vào `phase3MovieId` để các bước sau không dùng nhầm `movieId` cũ.

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
  "mainActors": "Favorite Star",
  "castList": "Favorite Star, Supporting Actor",
  "genreIds": [{{genreId}}]
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
    "actors": [{"id": 1, "name": "Favorite Star", "movieCount": 1}]
  },
  "message": "Movie created successfully"
}
```

## 3. Tìm phim public

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
        "status": "NOW_SHOWING"
      }
    ],
    "page": 0,
    "size": 20
  }
}
```

## 4. Gán diễn viên vào phim

### Tên mô tả API
Admin thay thế danh sách diễn viên của phim bằng danh sách actor id.

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
```json
{
  "success": true,
  "data": {
    "id": 1,
    "actors": [
      {"id": 1, "name": "Favorite Star"},
      {"id": 2, "name": "Supporting Actor"}
    ]
  },
  "message": "Movie actors updated successfully"
}
```

## 5. Lấy phim theo diễn viên

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
      "actors": [{"id": 1, "name": "Favorite Star"}]
    }
  ]
}
```

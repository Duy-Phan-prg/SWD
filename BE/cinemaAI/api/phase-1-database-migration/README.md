# Phase 1 - Database migration và schema

Phase 1 không có REST API nghiệp vụ riêng. Phase này dùng để chuẩn bị schema, constraint, index và seed data cho các phase sau.

## 1. Kiểm tra app và database đã sẵn sàng

### Tên mô tả API
Gọi một endpoint public để kiểm tra backend đã khởi động và dữ liệu nền có thể truy vấn.

### API
```http
GET /api/v1/genres
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
      "name": "Action",
      "description": "Action movies"
    }
  ],
  "message": null,
  "timestamp": "2026-06-02T20:00:00"
}
```

## 2. File schema baseline

### Tên mô tả API
Đây không phải REST API. Đây là file SQL dùng để đối chiếu schema database.

### API
```text
src/main/resources/db/migration/V1__baseline_schema.sql
```

### JSON
```json
{}
```

### Post-response
```text
Các bảng chính: users, user_profiles, movies, genres, actors, trailer_interactions, cinemas, rooms, seats, showtimes, ticket_pricing_rules, ticket_combos, bookings, food_items.
```

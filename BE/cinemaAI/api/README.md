# Ghi chú test API CinemaAI - Phase 0 đến Phase 6

Thư mục này chia API theo từng phase để test nhanh trong Postman, Swagger hoặc REST client.

Mỗi phase có file `README.md` theo cấu trúc:

- Tên mô tả API
- API
- JSON
- Post-response

## Danh sách phase

- [Phase 0 - Nền tảng dùng chung](./phase-0-shared-foundation/README.md)
- [Phase 1 - Database migration/schema](./phase-1-database-migration/README.md)
- [Phase 2 - Auth, user và security](./phase-2-auth-user-security/README.md)
- [Phase 3 - Phim, thể loại và diễn viên](./phase-3-movie-genre-actor/README.md)
- [Phase 4 - AI gợi ý phim cá nhân hóa](./phase-4-ai-personalized-recommendation/README.md)
- [Phase 5 - Một rạp, phòng chiếu, ghế, suất chiếu và giá vé](./phase-5-single-cinema-showtime/README.md)
- [Phase 6 - Booking, khóa ghế, F&B và QR vé](./phase-6-booking-food-qr/README.md)

## Biến cần thay khi test

- `ADMIN_TOKEN`: token lấy từ `POST /api/v1/auth/login` bằng user có role `ADMIN`.
- `CUSTOMER_TOKEN`: token lấy từ `POST /api/v1/auth/login` bằng user có role `CUSTOMER`.
- Các id như `movieId`, `genreId`, `actorId`, `showtimeId`, `seatId`, `bookingId` cần thay bằng id thật lấy từ response trước đó.

## Gợi ý thứ tự test nhanh

1. Phase 2: đăng nhập để lấy `ADMIN_TOKEN` hoặc `CUSTOMER_TOKEN`.
2. Phase 3: tạo genre, movie, actor.
3. Phase 5: tạo rạp, phòng, ghế, suất chiếu, giá vé và combo vé.
4. Phase 4: ghi nhận trailer interaction và xem recommendation.
5. Phase 6: giữ ghế, tạo booking, xem QR.

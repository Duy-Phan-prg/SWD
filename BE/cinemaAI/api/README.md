# Ghi chú test API CinemaAI - Phase 0 đến Phase 6

Thư mục này chia API theo từng phase để test nhanh trong Postman, Swagger hoặc REST client.

Mỗi phase có file `README.md` theo cấu trúc:

- Tên mô tả API
- API
- JSON
- Post-response

Mỗi phase cũng có file `POST_RESPONSE_SCRIPTS.md` để copy script vào tab **Scripts -> Post-response** trong Postman.

## Danh sách phase

- [Phase 0 - Nền tảng dùng chung](./phase-0-shared-foundation/README.md)
- [Phase 1 - Database migration/schema](./phase-1-database-migration/README.md)
- [Phase 2 - Auth, user và security](./phase-2-auth-user-security/README.md)
- [Phase 3 - Phim, thể loại và diễn viên](./phase-3-movie-genre-actor/README.md)
- [Phase 4 - AI gợi ý phim cá nhân hóa](./phase-4-ai-personalized-recommendation/README.md)
- [Phase 5 - Một rạp, phòng chiếu, ghế, suất chiếu và giá vé](./phase-5-single-cinema-showtime/README.md)
- [Phase 6 - Booking, khóa ghế, F&B và QR vé](./phase-6-booking-food-qr/README.md)
- [Post-response Scripts tổng hợp cho Postman](./post-response-scripts/README.md)
- [Collection Post-response Script](./COLLECTION_POST_RESPONSE_SCRIPT.md)

## Script Post-response

Các script Postman có 2 chỗ:

- Trong từng phase: mở `POST_RESPONSE_SCRIPTS.md` của phase đang test.
- Bản tổng hợp: mở folder `post-response-scripts`.

Dán script vào tab **Scripts -> Post-response** của request tương ứng để tự lưu `accessToken`, `refreshToken`, `cinemaId`, `roomId`, `seatId`, `showtimeId`, `bookingId` và các biến test khác vào **Collection Variables**.

Coding standard cho Postman trong folder này:

- Dùng collection variables, không dùng environment variables.
- Dùng camelCase: `accessToken`, `adminToken`, `movieId`, `genreId`, `bookingId`.
- API cần token dùng `Authorization: Bearer {{accessToken}}` hoặc `Authorization: Bearer {{adminToken}}`.
- API phụ thuộc dữ liệu trước đó dùng biến trong URL/body, ví dụ `/api/v1/admin/movies/{{movieId}}`.

## Biến cần thay khi test

- `{{adminToken}}`: token lấy từ `POST /api/v1/auth/login` bằng user có role `ADMIN`.
- `{{accessToken}}`: token lấy từ `POST /api/v1/auth/login` bằng user có role `CUSTOMER`.
- Các id như `movieId`, `genreId`, `actorId`, `showtimeId`, `seatId`, `bookingId` cần thay bằng id thật lấy từ response trước đó.

## Gợi ý thứ tự test nhanh

1. Phase 2: đăng nhập để lấy `{{adminToken}}` hoặc `{{accessToken}}`.
2. Phase 3: tạo genre, movie, actor.
3. Phase 5: tạo rạp, phòng, ghế, suất chiếu, giá vé và combo vé.
4. Phase 4: ghi nhận trailer interaction và xem recommendation.
5. Phase 6: giữ ghế, tạo booking, xem QR.

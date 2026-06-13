# Báo cáo các hạng mục đã hoàn thành - CinemaAI

Ngày quét: 2026-06-11  
Phạm vi quét: `pom.xml`, `src/main/java`, `src/main/resources`, thư mục `api/` và các tài liệu Markdown hiện có. Không tính các class trong `src/test`.

> Báo cáo này tổng hợp theo source code project chính hiện tại. Một hạng mục được xem là "đã có/đã triển khai" khi project đã có controller, service, entity, repository, cấu hình, migration hoặc tài liệu API tương ứng.

## 1. Tổng quan project

- Backend `cinemaAI` là ứng dụng Spring Boot 3.5.13, Java 17.
- Kiến trúc đang chia theo các lớp chính: `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, `config`, `seeder`.
- CSDL chính đang cấu hình PostgreSQL; project cũng có dependency MySQL runtime.
- Đã có Spring Security, JWT, refresh token, phân quyền theo role, Swagger/OpenAPI, Actuator health/info, Mail, Cloudinary, VNPay, AI analysis và recommendation.
- Đã có migration SQL trong `src/main/resources/db/migration`, gồm baseline schema và các migration cho layout ghế, độ dài tên actor, vai trò chính của actor trong phim, matrix giá vé theo suất chiếu.
- Đã có tài liệu API theo phase trong `api/` từ phase 0 đến phase 6, thêm ghi chú phase 8/Postman cho promotion, wishlist, loyalty, notification.

## 2. Thống kê nhanh

| Hạng mục | Số lượng/Trạng thái |
| --- | --- |
| REST controller | 33 file |
| Service nghiệp vụ | 27 file |
| Entity JPA | 44 file, bao gồm `BaseEntity` |
| Repository | 45 file, bao gồm projection |
| Enum/domain status | 38 file enum/converter |
| Migration đang bật | 5 file SQL |
| Migration cũ đang disable | 3 file SQL |
| API docs theo phase | Phase 0, 1, 2, 3, 4, 5, 6 và note phase 8 |

## 3. Nền tảng kỹ thuật đã có

### 3.1 Spring Boot và build

- Project Maven với Spring Boot parent `3.5.13`.
- Java version `17`.
- Đã cấu hình compiler plugin cho Lombok annotation processor.
- Đã có `spring-boot-maven-plugin`.
- Dependency chính:
  - Web REST API.
  - Spring Data JPA.
  - Spring Security.
  - Validation.
  - Mail.
  - WebSocket.
  - Actuator.
  - Spring AI OpenAI starter.
  - Springdoc OpenAPI/Swagger UI.
  - JWT `jjwt`.
  - Cloudinary.
  - OkHttp.
  - PostgreSQL/MySQL runtime driver.

### 3.2 Cấu hình ứng dụng

- App name: `cinemaAI`.
- Server port: `8080`.
- Có cấu hình import `.env` từ nhiều vị trí.
- PostgreSQL datasource đã cấu hình trong `application.properties`.
- JPA đang để `hibernate.ddl-auto=update`.
- Đã bật SQL log/format.
- Flyway hiện đang `enabled=false`, nhưng file migration vẫn có trong source.
- Actuator expose `health,info`.
- Swagger UI: `/swagger-ui.html`.
- OpenAPI docs: `/v3/api-docs`.
- Cấu hình multipart upload tối đa 5MB.

### 3.3 Security, JWT và phân quyền

- Đã có `SecurityConfig` với `@EnableWebSecurity` và `@EnableMethodSecurity`.
- Đã có JWT filter, JWT service, custom user details service.
- Endpoint public đã mở cho:
  - Auth: `/api/v1/auth/**`.
  - Swagger/OpenAPI.
  - Một số API public như movie, genre, actor, cinema, showtime, food, ticket pricing.
  - VNPay return/IPN.
- Endpoint admin `/api/v1/admin/**` yêu cầu role `ADMIN`.
- Endpoint staff `/api/v1/staff/**` yêu cầu role `ADMIN` hoặc `STAFF`.
- Đã có vòng đời access token và refresh token.

### 3.4 Auditing, logging, async và scheduler

- Đã bật JPA auditing qua `JpaAuditingConfig`.
- Entity dùng `BaseEntity` để quản lý id, created/updated timestamp.
- Đã có request logging filter và correlation id filter.
- Đã có async config.
- Đã có scheduler cleanup ghế đang hold hết hạn qua `SeatHoldCleanupScheduler`.
- Đã có cleanup schema giá vé qua `TicketPricingSchemaCleanup`.

## 4. Auth, user và account

### Chức năng đã có

- Đăng ký tài khoản.
- Đăng nhập bằng email/password.
- Đăng nhập Google.
- Xác minh Google login bằng OTP.
- Xác minh email.
- Gửi lại OTP xác minh email.
- Refresh token.
- Logout/revoke refresh token.
- Quên mật khẩu và xác nhận reset password bằng OTP.
- Lấy profile user hiện tại.
- Cập nhật profile user.
- Đổi mật khẩu.
- Admin xem danh sách user, xem chi tiết user, cập nhật trạng thái user.
- Gán role và đọc role của user.

### API chính đã có

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/google/verify`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/verify-email/request`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `POST /api/v1/users/me/password`
- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/{userId}`
- `PATCH /api/v1/admin/users/{userId}/status`

### Model/lớp liên quan

- Entity: `User`, `UserProfile`, `Role`, `UserRole`, `RefreshToken`, `EmailVerificationToken`, `PhoneVerificationToken`, `PasswordResetToken`, `PendingRegistration`.
- Enum: `RoleName`, `UserStatus`, `EmailOtpPurpose`, `OtpPurpose`.
- Service: `AuthService`, `UserService`, `UserRoleService`, `RefreshTokenService`, `EmailVerificationService`, `PasswordResetService`, `GoogleTokenVerifier`, `MailService`.

## 5. Movie, genre, actor và upload

### Chức năng đã có

- Public xem/tìm phim có phân trang và filter.
- Public xem chi tiết phim.
- Public xem danh sách genre và chi tiết genre.
- Public tìm/xem actor, xem phim theo actor.
- Admin CRUD movie.
- Admin cập nhật status movie.
- Admin CRUD genre.
- Admin CRUD actor.
- Quản lý quan hệ movie-genre và movie-actor.
- Có trường main role cho actor trong phim.
- Upload ảnh lên Cloudinary và lưu metadata file upload.

### API chính đã có

- `GET /api/v1/movies`
- `GET /api/v1/movies/{movieId}`
- `GET /api/v1/genres`
- `GET /api/v1/genres/{genreId}`
- `GET /api/v1/actors`
- `GET /api/v1/actors/{actorId}`
- `GET /api/v1/actors/{actorId}/movies`
- `GET /api/v1/admin/movies`
- `GET /api/v1/admin/movies/{movieId}`
- `POST /api/v1/admin/movies`
- `PUT /api/v1/admin/movies/{movieId}`
- `PATCH /api/v1/admin/movies/{movieId}/status`
- `DELETE /api/v1/admin/movies/{movieId}`
- `POST /api/v1/admin/genres`
- `PUT /api/v1/admin/genres/{genreId}`
- `DELETE /api/v1/admin/genres/{genreId}`
- `GET /api/v1/admin/actors`
- `POST /api/v1/admin/actors`
- `PUT /api/v1/admin/actors/{actorId}`
- `DELETE /api/v1/admin/actors/{actorId}`
- `POST /api/v1/admin/uploads/images`

### Model/lớp liên quan

- Entity: `Movie`, `Genre`, `Actor`, `MovieGenre`, `MovieActor`, `UploadedFile`.
- Enum: `MovieStatus`, `AgeRating`, `UploadedFileStatus`.
- Service: `MovieService`, `GenreService`, `ActorService`, `CloudinaryUploadService`.
- Mapper: `MovieMapper`, `AIAnalysisMapper`.

## 6. Cinema, room, seat và showtime

### Chức năng đã có

- Scope rạp chính/một rạp cho hệ thống.
- Public xem rạp và phòng.
- Admin tạo/cập nhật/xóa rạp, cập nhật trạng thái rạp.
- Admin quản lý phòng chiếu.
- Admin quản lý trạng thái phòng.
- Sinh sơ đồ ghế theo layout, bao gồm seat row và layout ghế lệch.
- Thay toàn bộ sơ đồ ghế của phòng.
- Cập nhật/xóa từng ghế.
- Public/Admin xem sơ đồ ghế theo suất chiếu.
- Tạo suất chiếu đơn lẻ.
- Tạo suất chiếu hàng loạt.
- Tìm suất chiếu public theo movie/room/date.
- Admin tìm suất chiếu có phân trang/filter.
- Cập nhật trạng thái/xóa suất chiếu.

### API chính đã có

- `GET /api/v1/cinema`
- `GET /api/v1/cinemas`
- `GET /api/v1/cinemas/{cinemaId}`
- `GET /api/v1/cinema/rooms`
- `GET /api/v1/cinemas/{cinemaId}/rooms`
- `GET /api/v1/showtimes`
- `GET /api/v1/showtimes/{showtimeId}`
- `GET /api/v1/showtimes/{showtimeId}/seat-map`
- `GET /api/v1/admin/cinema`
- `POST /api/v1/admin/cinema`
- `PUT /api/v1/admin/cinema`
- `PATCH /api/v1/admin/cinema/status`
- `DELETE /api/v1/admin/cinema`
- `GET /api/v1/admin/rooms`
- `GET /api/v1/admin/rooms/{roomId}`
- `GET /api/v1/admin/rooms/{roomId}/seats`
- `GET /api/v1/admin/rooms/seats/{seatId}`
- `POST /api/v1/admin/rooms`
- `PUT /api/v1/admin/rooms/{roomId}`
- `PATCH /api/v1/admin/rooms/{roomId}/status`
- `POST /api/v1/admin/rooms/{roomId}/seats/generate`
- `PUT /api/v1/admin/rooms/{roomId}/seats`
- `PUT /api/v1/admin/rooms/seats/{seatId}`
- `DELETE /api/v1/admin/rooms/seats/{seatId}`
- `GET /api/v1/admin/showtimes`
- `GET /api/v1/admin/showtimes/{showtimeId}`
- `GET /api/v1/admin/showtimes/{showtimeId}/seat-map`
- `POST /api/v1/admin/showtimes`
- `POST /api/v1/admin/showtimes/bulk`
- `PUT /api/v1/admin/showtimes/{showtimeId}`
- `PATCH /api/v1/admin/showtimes/{showtimeId}/status`
- `DELETE /api/v1/admin/showtimes/{showtimeId}`

### Model/lớp liên quan

- Entity: `Cinema`, `Room`, `SeatRow`, `Seat`, `Showtime`.
- Enum: `CinemaStatus`, `RoomStatus`, `RoomType`, `SeatStatus`, `SeatRuntimeStatus`, `SeatType`, `ShowtimeStatus`.
- Service: `CinemaService`, `RoomService`, `ShowtimeService`.

## 7. Ticket pricing và ticket combo

### Chức năng đã có

- Admin quản lý rule giá vé.
- Admin tìm kiếm rule giá vé có phân trang/filter.
- Admin quản lý combo vé.
- Public lấy danh sách combo vé active.
- Validate giá vé theo showtime, loại vé, độ tuổi, ngày lễ và tổng tiền.
- Có matrix giá vé theo showtime trong migration.

### API chính đã có

- `GET /api/v1/ticket-pricing/combos`
- `POST /api/v1/ticket-pricing/validate`
- `GET /api/v1/admin/ticket-pricing/rules`
- `POST /api/v1/admin/ticket-pricing/rules`
- `PUT /api/v1/admin/ticket-pricing/rules/{ruleId}`
- `DELETE /api/v1/admin/ticket-pricing/rules/{ruleId}`
- `GET /api/v1/admin/ticket-pricing/combos`
- `POST /api/v1/admin/ticket-pricing/combos`
- `PUT /api/v1/admin/ticket-pricing/combos/{comboId}`
- `DELETE /api/v1/admin/ticket-pricing/combos/{comboId}`

### Model/lớp liên quan

- Entity: `TicketPricingRule`, `TicketCombo`.
- Enum: `TicketType`, `TargetAudience`, `AgeRating`.
- Service: `TicketPricingService`.

## 8. Food và combo bắp nước

### Chức năng đã có

- Public xem food item active.
- Public xem food combo active.
- Admin xem toàn bộ food item/combo.
- Admin tạo/cập nhật/xóa mềm food item.
- Admin tạo/cập nhật/xóa mềm food combo.
- Booking có thể gắn food item/combo qua `BookingFoodItem`.

### API chính đã có

- `GET /api/v1/foods/items`
- `GET /api/v1/foods/combos`
- `GET /api/v1/admin/foods/items`
- `GET /api/v1/admin/foods/combos`
- `POST /api/v1/admin/foods/items`
- `POST /api/v1/admin/foods/combos`
- `PUT /api/v1/admin/foods/items/{itemId}`
- `PUT /api/v1/admin/foods/combos/{comboId}`
- `DELETE /api/v1/admin/foods/items/{itemId}`
- `DELETE /api/v1/admin/foods/combos/{comboId}`

### Model/lớp liên quan

- Entity: `FoodItem`, `FoodCombo`, `BookingFoodItem`.
- Enum: `FoodItemStatus`.
- Service: `FoodService`.

## 9. Booking, seat hold, QR ticket, check-in và refund

### Chức năng đã có

- User giữ ghế theo suất chiếu.
- Tự release hold hết hạn.
- User tạo booking từ booking hold.
- Booking có tickets, seats, foods/combo.
- Mark booking paid khi tạo booking trong luồng hiện tại.
- Sinh QR ticket/booking code.
- User xem danh sách booking của mình.
- User xem chi tiết booking của mình.
- User hủy booking.
- User gửi yêu cầu refund.
- Admin xem danh sách booking theo status.
- Admin xem chi tiết booking.
- Admin hủy booking.
- Staff/Admin check-in bằng QR.
- Admin check-in theo booking id và QR.
- Admin gửi refund request và đánh dấu đã refund.

### API chính đã có

- `POST /api/v1/bookings/hold`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/{bookingId}`
- `DELETE /api/v1/bookings/{bookingId}`
- `POST /api/v1/bookings/{bookingId}/refund-request`
- `POST /api/v1/staff/check-in`
- `POST /api/v1/admin/check-in`
- `GET /api/v1/admin/bookings`
- `GET /api/v1/admin/bookings/{bookingId}`
- `DELETE /api/v1/admin/bookings/{bookingId}`
- `POST /api/v1/admin/bookings/{bookingId}/check-in`
- `POST /api/v1/admin/bookings/{bookingId}/refund-request`
- `POST /api/v1/admin/bookings/{bookingId}/mark-refunded`

### Model/lớp liên quan

- Entity: `Booking`, `BookingSeat`, `BookingTicket`, `BookingFoodItem`, `BookingPromotion`.
- Enum: `BookingStatus`, `SeatRuntimeStatus`, `PaymentStatus`.
- Service: `BookingService`, `QrTicketService`.
- Scheduler: `SeatHoldCleanupScheduler`.

## 10. Payment và VNPay

### Chức năng đã có

- Tạo thanh toán VNPay cho booking.
- Build payment URL sandbox.
- Verify chữ ký VNPay.
- Handle VNPay return.
- Handle VNPay IPN.
- Mock payment cho luồng dev.
- Lấy payment theo booking.
- Lưu payment provider/status/transaction reference.

### API chính đã có

- `POST /api/v1/payments/vnpay/create`
- `GET /api/v1/payments/vnpay/return`
- `GET /api/v1/payments/vnpay/ipn`
- `POST /api/v1/payments/mock`
- `GET /api/v1/payments/booking/{bookingId}`

### Model/lớp liên quan

- Entity: `Payment`.
- Enum: `PaymentProvider`, `PaymentStatus`.
- Service: `PaymentService`, `VnpayService`.
- Config: `VNPayConfig`, `VnpayProperties`.

## 11. Promotion

### Chức năng đã có

- Public lấy promotion theo code.
- Validate promotion cho booking/giá trị đơn.
- Apply promotion vào booking.
- Remove promotion khỏi booking.
- Admin tạo promotion.
- Admin cập nhật promotion.
- Admin xóa promotion.
- Admin list promotion có phân trang.
- Hỗ trợ kiểu promotion và trạng thái promotion.

### API chính đã có

- `GET /api/v1/promotions/{code}`
- `POST /api/v1/promotions/apply`
- `DELETE /api/v1/promotions/remove`
- `POST /api/v1/promotions/validate`
- `POST /api/v1/admin/promotions`
- `PUT /api/v1/admin/promotions/{id}`
- `DELETE /api/v1/admin/promotions/{id}`
- `GET /api/v1/admin/promotions`
- `GET /api/v1/admin/promotions/{code}`

### Model/lớp liên quan

- Entity: `Promotion`, `BookingPromotion`.
- Enum: `PromotionType`, `PromotionStatus`.
- Service: `PromotionService`.

## 12. Wishlist

### Chức năng đã có

- User thêm phim vào wishlist.
- User xem wishlist của mình.
- User xóa phim khỏi wishlist.

### API chính đã có

- `POST /api/v1/wishlist`
- `GET /api/v1/wishlist`
- `DELETE /api/v1/wishlist/{movieId}`

### Model/lớp liên quan

- Entity: `Wishlist`.
- Service: `WishlistService`.

## 13. Loyalty point

### Chức năng đã có

- User xem điểm loyalty của mình.
- Admin cộng điểm cho user.
- Admin redeem/trừ điểm cho user.
- Tự cộng điểm từ booking.
- Có tier/status/type cho điểm loyalty.

### API chính đã có

- `GET /api/v1/loyalty/me`
- `POST /api/v1/admin/loyalty/add`
- `POST /api/v1/admin/loyalty/{userId}/redeem`

### Model/lớp liên quan

- Entity: `LoyaltyPoint`.
- Enum: `LoyaltyPointType`, `LoyaltyStatus`, `LoyaltyTier`.
- Service: `LoyaltyPointService`.

## 14. Notification

### Chức năng đã có

- Tạo notification cho user.
- User xem toàn bộ notification của mình.
- User xem notification chưa đọc.
- User đánh dấu notification đã đọc.
- Có loại notification.

### API chính đã có

- `POST /api/v1/notifications`
- `GET /api/v1/notifications/me`
- `GET /api/v1/notifications/me/unread`
- `PATCH /api/v1/notifications/{id}/read`

### Model/lớp liên quan

- Entity: `Notification`.
- Enum: `NotificationType`.
- Service: `NotificationService`.

## 15. Recommendation và trailer interaction

### Chức năng đã có

- Ghi nhận interaction trailer của user.
- Refresh hồ sơ sở thích user.
- Xem preference profile của user hiện tại.
- Recommend phim theo profile/signal.
- Recommend theo diễn viên yêu thích.
- Admin debug recommendation theo user id.
- Có strategy riêng cho recommendation mock.
- Có dữ liệu cohort preference.

### API chính đã có

- `POST /api/v1/recommendations/trailer-interactions`
- `POST /api/v1/recommendations/preferences/refresh`
- `GET /api/v1/recommendations/preferences/me`
- `GET /api/v1/recommendations/movies`
- `GET /api/v1/recommendations/favorite-actors`
- `GET /api/v1/admin/recommendations/users/{userId}/debug`

### Model/lớp liên quan

- Entity: `TrailerInteraction`, `UserPreferenceProfile`, `UserCohortPreference`.
- Enum: `TrailerInteractionType`, `PreferenceSignalType`.
- Service/strategy: `RecommendationService`, `RecommendationStrategy`, `MockRecommendationStrategy`, `RecommendationContext`, `RecommendationCandidate`.

## 16. AI movie analysis

### Chức năng đã có

- Admin yêu cầu phân tích AI cho phim.
- Admin xem danh sách analysis của phim.
- Admin xem chi tiết analysis.
- Admin regenerate analysis.
- Admin approve analysis.
- Admin reject analysis.
- Admin xóa analysis.
- Public xem analysis đã approve của phim.
- Có prompt builder, parser kết quả AI, strategy cho OpenAI, Gemini và Mock.
- Lưu emotion segment, content labels, status approve/reject.

### API chính đã có

- `POST /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/analyses/{analysisId}`
- `POST /api/v1/admin/analyses/{analysisId}/regenerate`
- `POST /api/v1/admin/analyses/{analysisId}/approve`
- `POST /api/v1/admin/analyses/{analysisId}/reject`
- `DELETE /api/v1/admin/analyses/{analysisId}`
- `GET /api/v1/movies/{movieId}/analysis`

### Model/lớp liên quan

- Entity: `AIAnalysis`, `AIEmotionSegment`.
- Enum: `AIAnalysisStatus`, `EmotionType`, `ContentLabel`.
- Service/analysis: `AIAnalysisService`, `MovieAnalysisStrategy`, `OpenAIMovieAnalysisStrategy`, `GeminiMovieAnalysisStrategy`, `MockMovieAnalysisStrategy`, `PromptBuilder`, `AIResultParser`.

## 17. Admin và staff scope

### Admin đã quản lý được

- User.
- Movie.
- Genre.
- Actor.
- Cinema.
- Room.
- Seat layout.
- Showtime.
- Ticket pricing rule.
- Ticket combo.
- Food item.
- Food combo.
- Booking.
- Check-in.
- Refund.
- Upload image.
- Loyalty.
- Promotion.
- Recommendation debug.
- AI movie analysis.

### Staff đã có

- API check-in vé qua `/api/v1/staff/check-in`.
- Entity staff domain đã có: `StaffProfile`, `StaffShift`.
- Enum staff domain đã có: `StaffStatus`.

## 18. Database và migration

### Migration đang có

- `V1__baseline_schema.sql`: baseline schema.
- `V2__seat_rows_layout.sql`: layout hàng ghế/seat rows.
- `V3__actor_name_length.sql`: tăng/điều chỉnh độ dài actor name.
- `V4__movie_actor_main_role.sql`: main role trong quan hệ movie-actor.
- `V5__showtime_ticket_price_matrix.sql`: matrix giá vé theo suất chiếu.

### Migration bị disable

- `V1__init_auth_core.sql`
- `V2__movie_catalog.sql`
- `V3__cinema_showtime.sql`

### Ghi chú

- `spring.flyway.enabled=false`, nên migration SQL hiện có dùng để quản lý/đối chiếu schema nhưng không tự chạy theo cấu hình hiện tại.
- `spring.jpa.hibernate.ddl-auto=update`, nên schema runtime có thể được Hibernate cập nhật tự động.

## 19. Seeder/data initializer

### Đã có seeder

- `RoleSeeder`: seed role.
- `AdminAccountSeeder`: seed admin account.
- `GenreSeeder`: seed genre.
- `MovieSeeder`: seed movie.
- `CinemaScheduleSeeder`: seed dữ liệu rạp/lịch chiếu.
- `DataInitializer`: chạy các seeder qua `CommandLineRunner`.

## 20. DTO, mapper và response chuẩn

- DTO request/response đã chia theo domain: auth, booking, cinema, food, loyalty, movie, notification, payment, promotion, recommendation, ticket, user, wishlist, analysis.
- Response dùng wrapper chung `ApiResponse`.
- Có `ErrorResponse`, `FieldErrorResponse`, `PageResponse`.
- Mapper đã có cho AI analysis, booking, cinema, food, movie, user.
- Validation request dùng Spring Validation.

## 21. Exception handling

- Đã có custom exception:
  - `BadRequestException`
  - `ConflictException`
  - `ForbiddenException`
  - `NotFoundException`
  - `UnauthorizedException`
- Đã có `GlobalExceptionHandler` xử lý lỗi tập trung.
## 22. Tài liệu API/Postman đã có

### Thư mục `api/`

- `api/README.md`: tổng quan API docs.
- `api/conceptual-model/README.md`: conceptual model/ERD và flow.
- `api/phase-0-shared-foundation`: Swagger, OpenAPI, security foundation.
- `api/phase-1-database-migration`: database migration/schema.
- `api/phase-2-auth-user-security`: auth, user, security.
- `api/phase-3-movie-genre-actor`: movie, genre, actor.
- `api/phase-4-ai-personalized-recommendation`: trailer interaction và recommendation.
- `api/phase-5-single-cinema-showtime`: cinema, room, seat, showtime, ticket pricing.
- `api/phase-6-booking-food-qr`: booking, food, QR, refund.
- `api/post-response-scripts`: hướng dẫn script Postman dùng chung.

### Tài liệu khác

- `PROJECT_CURRENT_INFORMATION.md`: tài liệu tổng hợp hệ thống hiện tại.
- `POSTMAN_API_PHASE_8.md`: ghi chú API phase 8.
- `SRS_Luong_Nghiep_Vu_Mua_Ban_Ve_Xem_Phim.md`: tài liệu luồng nghiệp vụ mua bán vé.
- `BE.docx`: tài liệu Word backend.

## 23. Các mục đã có nhưng cần lưu ý

- `Flyway` đang tắt trong cấu hình runtime, dù source có migration.
- `application.properties` hiện chứa credential trực tiếp cho database, mail và VNPay sandbox. Về mặt bảo mật nên chuyển toàn bộ sang `.env` hoặc secret manager.
- Có dependency PostgreSQL và MySQL cùng lúc; datasource hiện dùng PostgreSQL.
- Entity `Review`, `AuditLog`, `StaffProfile`, `StaffShift` đã có, nhưng qua controller hiện tại chưa thấy API CRUD đầy đủ cho review/audit/staff shift.
- Phone verification token/entity/request đã có dấu vết, nhưng controller auth hiện tại chủ yếu expose email/google/password reset; cần kiểm tra thêm nếu muốn hoàn thiện luồng phone OTP end-to-end.
- Booking hiện tại có luồng tạo booking mark `PAID` và cũng có payment VNPay/mock riêng; cần thống nhất lại nếu luồng thanh toán sản phẩm yêu cầu booking chỉ paid sau payment success.

## 24. Tóm tắt theo phase hoàn thành

| Phase | Hạng mục đã có |
| --- | --- |
| Phase 0 | Nền tảng shared, Swagger/OpenAPI, Actuator, security foundation, response/error chuẩn |
| Phase 1 | Schema/migration, JPA entity/repository, seed data |
| Phase 2 | Auth, user, JWT, refresh token, email OTP, Google login, password reset, admin user |
| Phase 3 | Movie, genre, actor, upload ảnh, public/admin catalog API |
| Phase 4 | Trailer interaction, preference profile, movie recommendation, favorite actor recommendation, admin debug |
| Phase 5 | Cinema, room, seat layout, showtime, seat map, ticket pricing, ticket combo |
| Phase 6 | Booking, seat hold, food/combo, QR ticket, check-in, refund |
| Payment | VNPay sandbox, return/IPN, mock payment, payment lookup |
| Phase 8/Extended | Promotion, wishlist, loyalty, notification |
| AI | AI movie analysis, approve/reject/regenerate, public approved analysis |

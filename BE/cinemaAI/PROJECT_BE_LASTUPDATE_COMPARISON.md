# Đối chiếu tiến độ: đã có gì, chưa có gì

Ngày đối chiếu: 2026-06-11  
Nguồn đã dùng:

- `PROJECT_COMPLETION_REPORT.md`
- `D:\FPTK8\SBA301\BE-LastUpdate.docx`

> Phạm vi: chỉ đối chiếu project chính và tài liệu, không dùng class trong `src/test` để đánh giá.  
> Cách hiểu: "Đã có" là đã thấy trong báo cáo project hiện tại/source chính. "Chưa có/chưa xác nhận" là nội dung có trong `BE-LastUpdate.docx` dưới dạng còn thiếu/cần làm hoặc không thấy được xác nhận trong báo cáo hiện tại.

## 1. Tổng quan

### Đã có trong project hiện tại

- Backend Spring Boot 3.5.13, Java 17.
- Kiến trúc layer rõ: `controller`, `service`, `repository`, `entity`, `dto`, `mapper`, `security`, `config`, `seeder`.
- 33 REST controller.
- 27 service nghiệp vụ.
- 44 entity JPA.
- 45 repository.
- 38 enum/converter.
- 5 migration SQL đang dùng trong `db/migration`.
- 3 migration cũ đang disable.
- Swagger/OpenAPI.
- Actuator health/info.
- Spring Security.
- JWT.
- Refresh token.
- Role-based authorization.
- Mail.
- Cloudinary.
- VNPay.
- Recommendation.
- AI movie analysis.

### Chưa có/chưa xác nhận

- Chưa xác nhận đầy đủ review module.
- Chưa xác nhận đầy đủ staff management, audit log và report/dashboard.
- Chưa xác nhận WebSocket realtime seat/notification.
- Chưa xác nhận payment strategy đa provider như MoMo/S3 hoặc callback idempotent nâng cao.
- Chưa xác nhận email template và gửi vé qua email.
- Không đánh giá test/integration QA vì yêu cầu không quét `src/test`.

## 2. Phase 0 - Shared foundation

### Đã có trong project hiện tại

- Cấu trúc MVC/layer.
- `ApiResponse`.
- `PageResponse`.
- `ErrorResponse`.
- `FieldErrorResponse`.
- `GlobalExceptionHandler`.
- Custom exceptions:
  - `BadRequestException`
  - `ConflictException`
  - `ForbiddenException`
  - `NotFoundException`
  - `UnauthorizedException`
- `BaseEntity`.
- CORS config.
- OpenAPI config.
- Async config.
- JPA auditing config.
- Security config.
- Password encoder.
- Request logging filter.
- Correlation id filter.
- JWT filter thật.
- Actuator health/info.
- Swagger UI `/swagger-ui.html`.
- OpenAPI docs `/v3/api-docs`.

### Chưa có/chưa xác nhận

- Không thấy thiếu lớn ở phần foundation so với DOCX cũ.
- DOCX cũ từng ghi còn thiếu request logging, correlation id, JWT filter thật; báo cáo hiện tại cho thấy các phần này đã có.

## 3. Phase 1 - Database migration/schema

### Đã có trong project hiện tại

- Migration đang có:
  - `V1__baseline_schema.sql`
  - `V2__seat_rows_layout.sql`
  - `V3__actor_name_length.sql`
  - `V4__movie_actor_main_role.sql`
  - `V5__showtime_ticket_price_matrix.sql`
- Migration cũ đang disable:
  - `V1__init_auth_core.sql`
  - `V2__movie_catalog.sql`
  - `V3__cinema_showtime.sql`
- Entity/repository cho hầu hết domain chính.
- Seeder:
  - `RoleSeeder`
  - `AdminAccountSeeder`
  - `GenreSeeder`
  - `MovieSeeder`
  - `CinemaScheduleSeeder`
  - `DataInitializer`

### Chưa có/chưa xác nhận

- `spring.flyway.enabled=false`, nên migration không tự chạy theo cấu hình hiện tại.
- DOCX có nhắc các migration riêng cho booking/payment/promotion/wishlist/loyalty/notification/review/staff/audit. Báo cáo hiện tại xác nhận entity và một baseline schema, nhưng không xác nhận từng migration riêng theo từng module đó.
- Chưa xác nhận index migration đầy đủ cho toàn bộ domain.
- Chưa xác nhận seed data đầy đủ cho toàn bộ hệ thống.

## 4. Phase 2 - Auth, user và security

### Đã có trong project hiện tại

- Entity:
  - `User`
  - `UserProfile`
  - `Role`
  - `UserRole`
  - `RefreshToken`
  - `EmailVerificationToken`
  - `PhoneVerificationToken`
  - `PasswordResetToken`
  - `PendingRegistration`
- Enum:
  - `RoleName`
  - `UserStatus`
  - `EmailOtpPurpose`
  - `OtpPurpose`
- Service:
  - `AuthService`
  - `UserService`
  - `UserRoleService`
  - `RefreshTokenService`
  - `EmailVerificationService`
  - `PasswordResetService`
  - `GoogleTokenVerifier`
  - `MailService`
- Security:
  - `JwtService`
  - `JwtAuthenticationFilter`
  - `CustomUserDetailsService`
  - `SecurityConfig`
- API:
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

### Chưa có/chưa xác nhận

- Phone OTP end-to-end chưa được xác nhận đầy đủ. Có entity/request/token dấu vết, nhưng controller hiện tại chủ yếu expose email, Google và password reset.
- Chưa xác nhận API admin quản lý role nâng cao ngoài xem/cập nhật user status.

## 5. Phase 3 - Movie, genre, actor và upload

### Đã có trong project hiện tại

- Entity:
  - `Movie`
  - `Genre`
  - `Actor`
  - `MovieGenre`
  - `MovieActor`
  - `UploadedFile`
- Enum:
  - `MovieStatus`
  - `AgeRating`
  - `UploadedFileStatus`
- Service:
  - `MovieService`
  - `GenreService`
  - `ActorService`
  - `CloudinaryUploadService`
- Mapper:
  - `MovieMapper`
  - `AIAnalysisMapper`
- API public:
  - `GET /api/v1/movies`
  - `GET /api/v1/movies/{movieId}`
  - `GET /api/v1/genres`
  - `GET /api/v1/genres/{genreId}`
  - `GET /api/v1/actors`
  - `GET /api/v1/actors/{actorId}`
  - `GET /api/v1/actors/{actorId}/movies`
- API admin:
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
- Upload ảnh lên Cloudinary và lưu metadata file upload.
- Có main role cho actor trong phim.

### Chưa có/chưa xác nhận

- Chưa xác nhận API riêng để gán actor vào phim ngoài luồng create/update movie.
- Chưa xác nhận đầy đủ story keywords/vector feature extraction cho recommendation.

## 6. Phase 4 - Recommendation và trailer interaction

### Đã có trong project hiện tại

- Entity:
  - `TrailerInteraction`
  - `UserPreferenceProfile`
  - `UserCohortPreference`
- Enum:
  - `TrailerInteractionType`
  - `PreferenceSignalType`
- Service/strategy:
  - `RecommendationService`
  - `RecommendationStrategy`
  - `MockRecommendationStrategy`
  - `RecommendationContext`
  - `RecommendationCandidate`
- API:
  - `POST /api/v1/recommendations/trailer-interactions`
  - `POST /api/v1/recommendations/preferences/refresh`
  - `GET /api/v1/recommendations/preferences/me`
  - `GET /api/v1/recommendations/movies`
  - `GET /api/v1/recommendations/favorite-actors`
  - `GET /api/v1/admin/recommendations/users/{userId}/debug`

### Chưa có/chưa xác nhận

- Chưa xác nhận ticket history preference aggregation service riêng.
- Chưa xác nhận favorite actor detection service riêng dựa trên lịch sử xem, vé đã mua, review và movie cast metadata.
- Chưa xác nhận movie feature extraction service gom genre/director/actor/story keywords thành vector.
- Chưa xác nhận user cohort analysis service đầy đủ theo độ tuổi, năm sinh, hành vi xem và lịch sử mua vé.
- Chưa xác nhận review sentiment/genre preference analysis service.
- Chưa xác nhận optional AI text analysis strategy cho review/preference.

## 7. Phase 5 - Cinema, room, seat, showtime và ticket pricing

### Đã có trong project hiện tại

- Entity:
  - `Cinema`
  - `Room`
  - `SeatRow`
  - `Seat`
  - `Showtime`
  - `TicketPricingRule`
  - `TicketCombo`
- Enum:
  - `CinemaStatus`
  - `RoomStatus`
  - `RoomType`
  - `SeatStatus`
  - `SeatRuntimeStatus`
  - `SeatType`
  - `ShowtimeStatus`
  - `TicketType`
  - `TargetAudience`
- Service:
  - `CinemaService`
  - `RoomService`
  - `ShowtimeService`
  - `TicketPricingService`
- API public:
  - `GET /api/v1/cinema`
  - `GET /api/v1/cinemas`
  - `GET /api/v1/cinemas/{cinemaId}`
  - `GET /api/v1/cinema/rooms`
  - `GET /api/v1/cinemas/{cinemaId}/rooms`
  - `GET /api/v1/showtimes`
  - `GET /api/v1/showtimes/{showtimeId}`
  - `GET /api/v1/showtimes/{showtimeId}/seat-map`
  - `GET /api/v1/ticket-pricing/combos`
  - `POST /api/v1/ticket-pricing/validate`
- API admin:
  - CRUD cinema.
  - CRUD room.
  - Sinh sơ đồ ghế.
  - Thay toàn bộ sơ đồ ghế.
  - Cập nhật/xóa từng ghế.
  - CRUD showtime.
  - Tạo showtime hàng loạt.
  - Quản lý ticket pricing rule.
  - Quản lý ticket combo.

### Chưa có/chưa xác nhận

- Chưa xác nhận đầy đủ age restriction validation theo tuổi người mua/người xem trong mọi flow booking.
- Chưa xác nhận đầy đủ rule giá ngày thường/cuối tuần/ngày lễ/loại phòng ở mức nghiệp vụ sản phẩm.
- Chưa xác nhận luồng đổi suất khi suất chiếu bị hủy.

## 8. Phase 6 - Booking, seat locking, F&B và ticket QR

### Đã có trong project hiện tại

- Entity:
  - `Booking`
  - `BookingSeat`
  - `BookingTicket`
  - `BookingFoodItem`
  - `BookingPromotion`
  - `FoodItem`
  - `FoodCombo`
- Service:
  - `BookingService`
  - `QrTicketService`
  - `FoodService`
- API booking:
  - `POST /api/v1/bookings/hold`
  - `POST /api/v1/bookings`
  - `GET /api/v1/bookings`
  - `GET /api/v1/bookings/{bookingId}`
  - `DELETE /api/v1/bookings/{bookingId}`
  - `POST /api/v1/bookings/{bookingId}/refund-request`
- API check-in:
  - `POST /api/v1/staff/check-in`
  - `POST /api/v1/admin/check-in`
  - `POST /api/v1/admin/bookings/{bookingId}/check-in`
- API admin booking:
  - `GET /api/v1/admin/bookings`
  - `GET /api/v1/admin/bookings/{bookingId}`
  - `DELETE /api/v1/admin/bookings/{bookingId}`
  - `POST /api/v1/admin/bookings/{bookingId}/refund-request`
  - `POST /api/v1/admin/bookings/{bookingId}/mark-refunded`
- API food:
  - `GET /api/v1/foods/items`
  - `GET /api/v1/foods/combos`
  - CRUD admin food item/combo.
- Có giữ ghế tạm thời.
- Có scheduler tự release hold hết hạn.
- Có sinh QR ticket/booking code.
- Có check-in bằng QR.
- Có refund request và mark refunded.

### Chưa có/chưa xác nhận

- Chưa xác nhận luồng đổi suất khi suất bị hủy.
- Chưa xác nhận gửi vé qua email.
- Chưa xác nhận realtime seat locking bằng WebSocket.
- Chưa xác nhận refund tự động qua payment provider.
- Chưa xác nhận booking chỉ chuyển `PAID` sau payment success; báo cáo hiện tại còn lưu ý booking có luồng mark `PAID` khi tạo booking và payment riêng.

## 9. Phase 7 - Payment

### Đã có trong project hiện tại

- Entity:
  - `Payment`
- Enum:
  - `PaymentProvider`
  - `PaymentStatus`
- Service/config:
  - `PaymentService`
  - `VnpayService`
  - `VNPayConfig`
  - `VnpayProperties`
- API:
  - `POST /api/v1/payments/vnpay/create`
  - `GET /api/v1/payments/vnpay/return`
  - `GET /api/v1/payments/vnpay/ipn`
  - `POST /api/v1/payments/mock`
  - `GET /api/v1/payments/booking/{bookingId}`
- Build payment URL VNPay sandbox.
- Verify chữ ký VNPay.
- Handle VNPay return/IPN.
- Mock payment cho luồng dev.
- Lưu payment provider/status/transaction reference.

### Chưa có/chưa xác nhận

- Chưa xác nhận payment strategy pattern đa provider hoàn chỉnh.
- Chưa xác nhận MoMo provider placeholder.
- Chưa xác nhận callback/webhook idempotent handling đầy đủ.
- Chưa xác nhận refund foundation chi tiết cho hủy suất/cúp điện/lỗi vận hành.
- Chưa xác nhận refund status tracking đầy đủ: requested, processing, refunded, failed.

## 10. Phase 8 - Promotion, wishlist, loyalty và notification

### Đã có trong project hiện tại

- Promotion:
  - Entity `Promotion`, `BookingPromotion`.
  - Enum `PromotionType`, `PromotionStatus`.
  - `PromotionService`.
  - API lấy promotion theo code.
  - API apply promotion.
  - API remove promotion.
  - API validate promotion.
  - API admin tạo/cập nhật/xóa/list promotion.
- Wishlist:
  - Entity `Wishlist`.
  - `WishlistService`.
  - API thêm phim vào wishlist.
  - API xem wishlist.
  - API xóa phim khỏi wishlist.
- Loyalty:
  - Entity `LoyaltyPoint`.
  - Enum `LoyaltyPointType`, `LoyaltyStatus`, `LoyaltyTier`.
  - `LoyaltyPointService`.
  - API user xem điểm.
  - API admin cộng điểm.
  - API admin redeem/trừ điểm.
  - Tự cộng điểm từ booking.
- Notification:
  - Entity `Notification`.
  - Enum `NotificationType`.
  - `NotificationService`.
  - API tạo notification.
  - API xem notification của user.
  - API xem notification chưa đọc.
  - API đánh dấu đã đọc.

### Chưa có/chưa xác nhận

- Chưa xác nhận point-to-promotion exchange API.
- Chưa xác nhận lịch sử điểm loyalty đầy đủ.
- Chưa xác nhận rule kết hợp/không kết hợp promotion với điểm.
- Chưa xác nhận rule đổi promotion cần bao nhiêu point.
- Chưa xác nhận giới hạn thời gian khi đổi điểm lấy promotion.
- Chưa xác nhận cấu hình point theo số vé hoặc theo số tiền ở mức API riêng.

## 11. Phase 9 - Review

### Đã có trong project hiện tại

- Entity:
  - `Review`
- Enum:
  - `ReviewStatus`
- Repository:
  - `ReviewRepository`

### Chưa có/chưa xác nhận

- Chưa xác nhận Review migration riêng.
- Chưa xác nhận public review APIs.
- Chưa xác nhận `ReviewService`.
- Chưa xác nhận `ReviewModerationService`.
- Chưa xác nhận `MovieRatingAggregationService`.
- Chưa xác nhận admin hide review API.
- Chưa xác nhận AI preference update after review API.
- Chưa xác nhận tổng hợp điểm đánh giá thật từ user.
- Chưa xác nhận review dùng làm input cập nhật sở thích cá nhân.

## 12. Phase 10 - Staff Operations, Audit & Reports

### Đã có trong project hiện tại

- Entity:
  - `StaffProfile`
  - `StaffShift`
  - `AuditLog`
- Enum:
  - `StaffStatus`
  - `AuditActionType`
- Repository:
  - `StaffProfileRepository`
  - `StaffShiftRepository`
  - `AuditLogRepository`
- API staff/admin check-in vé:
  - `POST /api/v1/staff/check-in`
  - `POST /api/v1/admin/check-in`

### Chưa có/chưa xác nhận

- Chưa xác nhận Staff migration riêng.
- Chưa xác nhận Staff shift migration riêng.
- Chưa xác nhận Audit log migration riêng.
- Chưa xác nhận staff scan/check-in vé đầy đủ theo trạng thái vé/booking.
- Chưa xác nhận staff confirm combo pickup.
- Chưa xác nhận audit log service/controller cho admin action quan trọng.
- Chưa xác nhận basic revenue report API.
- Chưa xác nhận ticket sales report API.
- Chưa xác nhận top-selling combo/F&B report API.

## 13. Phase 11 - Email Ticket & Realtime Seat Updates

### Đã có trong project hiện tại

- Cloudinary:
  - `CloudinaryConfig`
  - `CloudinaryCredentials`
  - `CloudinaryUploadService`
  - `UploadedFile`
  - `UploadedFileRepository`
  - `POST /api/v1/admin/uploads/images`
- Email:
  - `MailService`
  - SMTP config trong `application.properties`
  - Email verification/password reset dùng OTP.
- Scheduler:
  - `SeatHoldCleanupScheduler`
- Dependency WebSocket có trong `pom.xml`.
- Notification module cơ bản đã có.

### Chưa có/chưa xác nhận

- Chưa xác nhận gửi vé qua email.
- Chưa xác nhận email template vé sau thanh toán thành công.
- Chưa xác nhận WebSocket config cụ thể.
- Chưa xác nhận seat event publisher.
- Chưa xác nhận realtime update trạng thái ghế.
- Notification user/admin realtime là optional, chưa cần ưu tiên trước email vé và realtime ghế.

## 14. Phase 12 - API Contract & QA Readiness

### Đã có trong project hiện tại

- Không đánh giá trong báo cáo này vì user yêu cầu không quét class test.
- Tài liệu API/Postman đã có:
  - `api/README.md`
  - `api/conceptual-model/README.md`
  - `api/phase-0-shared-foundation`
  - `api/phase-1-database-migration`
  - `api/phase-2-auth-user-security`
  - `api/phase-3-movie-genre-actor`
  - `api/phase-4-ai-personalized-recommendation`
  - `api/phase-5-single-cinema-showtime`
  - `api/phase-6-booking-food-qr`
  - `api/post-response-scripts`
  - `POSTMAN_API_PHASE_8.md`
  - `PROJECT_CURRENT_INFORMATION.md`
  - `SRS_Luong_Nghiep_Vu_Mua_Ban_Ve_Xem_Phim.md`

### Chưa có/chưa xác nhận

- Không xác nhận các integration tests vì không quét `src/test`.
- Chưa xác nhận end-to-end backend smoke flow từ tài liệu hiện tại.
- Chưa xác nhận payment integration test.
- Chưa xác nhận security test.

## 15. AI movie analysis

### Đã có trong project hiện tại

- Entity:
  - `AIAnalysis`
  - `AIEmotionSegment`
- Enum:
  - `AIAnalysisStatus`
  - `EmotionType`
  - `ContentLabel`
- Service/strategy:
  - `AIAnalysisService`
  - `MovieAnalysisStrategy`
  - `OpenAIMovieAnalysisStrategy`
  - `GeminiMovieAnalysisStrategy`
  - `MockMovieAnalysisStrategy`
  - `PromptBuilder`
  - `AIResultParser`
- API:
  - `POST /api/v1/admin/movies/{movieId}/analyses`
  - `GET /api/v1/admin/movies/{movieId}/analyses`
  - `GET /api/v1/admin/analyses/{analysisId}`
  - `POST /api/v1/admin/analyses/{analysisId}/regenerate`
  - `POST /api/v1/admin/analyses/{analysisId}/approve`
  - `POST /api/v1/admin/analyses/{analysisId}/reject`
  - `DELETE /api/v1/admin/analyses/{analysisId}`
  - `GET /api/v1/movies/{movieId}/analysis`

### Chưa có/chưa xác nhận

- Không thấy module AI movie analysis này được mô tả riêng trong `BE-LastUpdate.docx`; DOCX chủ yếu nói về AI recommendation.
- Chưa xác nhận UI/admin workflow ngoài API.

## 16. Kết luận ngắn

### Những phần đã có nhiều nhất so với DOCX cũ

- Auth/user/security đầy đủ hơn.
- Movie/genre/actor/upload đầy đủ hơn.
- Cinema/room/seat/showtime đầy đủ hơn.
- Ticket pricing và ticket combo đã có.
- Booking/hold/F&B/QR/check-in/refund đã có.
- VNPay và mock payment đã có.
- Promotion/wishlist/loyalty/notification đã có.
- Recommendation API đã có.
- AI movie analysis đã có.

### Những phần còn thiếu hoặc chưa xác nhận rõ

- Review module đầy đủ.
- Staff management, staff shift management.
- Audit log API đầy đủ.
- Dashboard/report APIs.
- Payment strategy đa provider và MoMo.
- Callback/webhook idempotency nâng cao.
- Refund tracking nâng cao.
- Point-to-promotion exchange.
- Loyalty history đầy đủ.
- WebSocket realtime seat/notification.
- S3 placeholder.
- Email templates và gửi vé qua email.
- Trailer tracking chi tiết.
- QA/test phase không được đánh giá trong báo cáo này.

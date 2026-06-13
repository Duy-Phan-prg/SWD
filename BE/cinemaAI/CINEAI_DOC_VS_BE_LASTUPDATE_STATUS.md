# Đối chiếu CineAI_Project_Documentation theo BE-LastUpdate

Ngày đối chiếu: 2026-06-11  
Tài liệu được kiểm tra: `C:\Users\quyet\Downloads\CineAI_Project_Documentation.docx`  
Tài liệu chuẩn đối chiếu: `D:\FPTK8\SBA301\BE-LastUpdate.docx`

> Mục tiêu: dựa vào các phase/hạng mục trong `BE-LastUpdate.docx`, xác định `CineAI_Project_Documentation.docx` đã có nội dung gì và còn thiếu nội dung gì.

## 1. Kết luận nhanh

`CineAI_Project_Documentation.docx` đã có phần đặc tả sản phẩm khá đầy đủ: tổng quan, kiến trúc, database, luồng nghiệp vụ, API, frontend, bảo mật, deploy và phụ lục. Tuy nhiên nếu đối chiếu theo `BE-LastUpdate.docx`, tài liệu CineAI còn thiếu nhiều chi tiết backend theo phase, đặc biệt là:

- Checklist backend theo từng phase 0-12.
- Trạng thái đã hoàn thành/còn thiếu của từng phase.
- AI personalized recommendation chi tiết.
- Ticket pricing/age restriction/ticket combo chi tiết.
- Phase 10 Staff Operations/Audit/Reports chi tiết.
- Phase 11 Email Ticket/Realtime Seat Updates chi tiết.
- Phase 12 API Contract/QA Readiness chi tiết.

## 2. Bảng đối chiếu tổng quan

| Phase trong BE-LastUpdate | CineAI đã có gì | CineAI còn thiếu gì |
| --- | --- | --- |
| Phase 0 - Shared Foundation | Có kiến trúc backend, cấu trúc package, security/config/exception ở mức tổng quan | Thiếu checklist chi tiết ApiResponse, PageResponse, ErrorResponse, FieldErrorResponse, BaseEntity, CORS, OpenAPI, async, auditing, request logging, correlation id |
| Phase 1 - Database Migration | Có thiết kế database, danh sách bảng chính, quan hệ và một số bảng quan trọng | Thiếu mô tả Flyway migration theo file/phase, constraint/index/seed data chi tiết, trạng thái migration đã làm/còn thiếu |
| Phase 2 - Auth, User & Security | Có luồng đăng ký/đăng nhập, JWT, API Auth, security/validation | Thiếu checklist entity/repository/service/controller cụ thể, refresh token internals, password reset/email verification chi tiết, admin user status |
| Phase 3 - Movie & Genre | Có Movie API, bảng movies/genres, quản lý phim và AI analysis | Thiếu actor module chi tiết, MovieActor, MovieGenre, actor count/list, admin actor CRUD, trạng thái hoàn thành từng lớp |
| Phase 4 - AI Personalized Recommendation | Có AI phân tích phim core | Thiếu personalized recommendation: trailer behavior, favorite actor detection, cohort filtering, preference profile, recommendation APIs |
| Phase 5 - Single Cinema, Room, Seat & Showtime | Có luồng admin quản lý lịch chiếu, showtime/booking API, rooms/seats trong database | Thiếu single-cinema constraint, room conflict validation chi tiết, seat generation/layout lệch, ticket pricing rule/combo chi tiết |
| Phase 6 - Booking, Seat Locking, F&B & QR | Có booking flow, hold ghế, F&B, QR, payment callback ở mức nghiệp vụ | Thiếu entity/service/controller checklist chi tiết, refund case cúp điện, ticket type ADULT/CHILD/SENIOR/STUDENT, combo vé chi tiết |
| Phase 7 - Payment | Có VNPAY/MoMo trong tech stack và Payment API | Thiếu strategy pattern, mock provider, idempotent callback, refund status tracking, provider placeholder chi tiết |
| Phase 8 - Promotion, Wishlist, Loyalty & Notification | Có promotion, wishlist, loyalty, notification trong database/flow/API admin một phần | Thiếu point-to-promotion exchange, rule kết hợp điểm/voucher, lịch sử điểm, notification APIs chi tiết |
| Phase 9 - Review | Có 4.5 luồng đánh giá & tích điểm, bảng reviews, movie reviews API | Thiếu review moderation, review service, aggregation service, AI preference update after review |
| Phase 10 - Staff Operations, Audit & Reports | Có staff/admin check-in nền tảng, entity audit, admin booking/user/promotion endpoints | Ưu tiên thiếu: staff scan/check-in vé đầy đủ, staff confirm combo pickup, audit log cho admin action quan trọng, basic reports doanh thu/vé bán/combo bán chạy |
| Phase 11 - Email Ticket & Realtime Seat Updates | Có mail service cho OTP, WebSocket dependency, notification polling, scheduler dọn hold | Ưu tiên thiếu: email vé sau thanh toán thành công, WebSocket cập nhật seat status realtime; notification user/admin chỉ optional |
| Phase 12 - API Contract & QA Readiness | Có Swagger/OpenAPI, tài liệu API theo phase và Postman scripts rời | Ưu tiên thiếu: API contract chuẩn hóa, Postman collection, end-to-end test flow, Swagger cleanup, NFR checklist |

## 3. Chi tiết theo từng phase

## Phase 0 - Shared Foundation

### CineAI_Project_Documentation đã có

- Mô hình Client-Server.
- Backend Spring Boot.
- Cấu trúc backend package:
  - `controller`
  - `service`
  - `repository`
  - `entity`
  - `dto`
  - `security`
  - `ai`
  - `payment`
  - `config`
  - `exception`
- Nhắc đến Spring Security, Spring Data JPA, Maven.
- Nhắc đến global exception handler.
- Nhắc đến Swagger/OpenAPI ở checklist thư viện backend.

### Còn thiếu so với BE-LastUpdate

- Không có checklist rõ cho:
  - `ApiResponse`
  - `PageResponse`
  - `ErrorResponse`
  - `FieldErrorResponse`
  - `GlobalExceptionHandler`
  - Custom exceptions
  - `BaseEntity`
  - CORS config
  - OpenAPI config
  - Async config
  - JPA auditing config
  - Request logging
  - Correlation id
  - Security config gắn JWT filter thật
- Không có trạng thái "đã hoàn thành/còn thiếu" cho từng item foundation.

## Phase 1 - Database Migration

### CineAI_Project_Documentation đã có

- Có mục `3. Thiết kế Database`.
- Có danh sách bảng chính:
  - `users`
  - `roles`
  - `movies`
  - `genres`
  - `cinemas`
  - `rooms`
  - `seats`
  - `showtimes`
  - `bookings`
  - `booking_seats`
  - `payments`
  - `ai_analyses`
  - `ai_emotion_segments`
  - `reviews`
  - `promotions`
  - `wishlists`
  - `loyalty_points`
  - `notifications`
- Có chi tiết một số bảng quan trọng.
- Có quan hệ chính giữa các bảng.

### Còn thiếu so với BE-LastUpdate

- Không có danh sách file migration cụ thể.
- Không có trạng thái migration nào đã làm, migration nào còn thiếu.
- Thiếu checklist:
  - AI analysis tables.
  - Booking tables.
  - Payment tables.
  - Promotion tables.
  - Wishlist tables.
  - Loyalty point tables.
  - Notification tables.
  - Review tables.
  - Staff tables.
  - Audit log tables.
  - F&B tables.
  - Uploaded file tables.
  - Index migration.
  - Seed data.
- Tài liệu CineAI ghi MySQL 8, trong khi BE-LastUpdate nói theo hướng Flyway/backend phase, cần thống nhất database thực tế khi generate lại.

## Phase 2 - Auth, User & Security

### CineAI_Project_Documentation đã có

- Có mục `4.2 Luồng đăng ký / đăng nhập`.
- Có flow:
  - Khán giả đăng ký.
  - BE kiểm tra email.
  - Hash password bằng BCrypt.
  - Tạo user role CUSTOMER.
  - Gửi email xác nhận.
  - Đăng nhập nhận access token và refresh token.
  - FE gắn Bearer token.
  - Refresh token khi access token hết hạn.
- Có `5.1 Auth API`:
  - Register.
  - Login.
  - Refresh.
  - Logout.
  - Me.
- Có bảo mật backend:
  - JWT access token ngắn hạn.
  - Refresh token.
  - Role-based access.
  - BCrypt.

### Còn thiếu so với BE-LastUpdate

- Không liệt kê chi tiết entity/repository/service/controller:
  - `User`
  - `Role`
  - `UserRole`
  - `RefreshToken`
  - `PasswordResetToken`
  - `EmailVerificationToken`
  - `AuthService`
  - `UserService`
  - `RefreshTokenService`
  - `PasswordResetService`
  - `EmailVerificationService`
  - `CustomUserDetailsService`
  - `JwtAuthenticationFilter`
  - `AuthController`
  - `UserController`
  - `AdminUserController`
- Thiếu password reset flow/API.
- Thiếu email verification chi tiết dạng OTP/token.
- Thiếu Google login.
- Thiếu admin user management chi tiết.
- Thiếu trạng thái đã hoàn thành/còn thiếu của auth module.

## Phase 3 - Movie & Genre

### CineAI_Project_Documentation đã có

- Có Movie API:
  - Danh sách phim.
  - Chi tiết phim + AI analysis.
  - Thêm phim mới.
  - Cập nhật phim.
  - Xóa/ẩn phim.
  - Yêu cầu AI phân tích phim.
  - Xem AI analysis.
  - Duyệt AI analysis.
  - Lịch chiếu của một phim.
  - Reviews của phim.
- Có bảng `movies`, `genres`.
- Có thông tin metadata phim:
  - Title.
  - Description.
  - Trailer URL.
  - Poster URL.
  - Duration.
  - Release date.
  - Language.
  - Subtitle language.
  - Status.
  - Age rating.
  - Director.

### Còn thiếu so với BE-LastUpdate

- Actor module chưa được mô tả đủ sâu:
  - `Actor`
  - `MovieActor`
  - Actor detail API.
  - Actor movie count/list.
  - Admin actor CRUD.
  - API gán diễn viên vào phim.
- `MovieGenre` chưa được checklist rõ.
- Thiếu trạng thái class/repository/service/controller đã hoàn thành/chưa hoàn thành.
- Thiếu mô tả age rating enum theo rule backend chi tiết.
- Thiếu phase checklist cho tests, nhưng nếu không tính test thì có thể bỏ khỏi tài liệu generate lại.

## Phase 4 - AI Personalized Recommendation

### CineAI_Project_Documentation đã có

- Có AI feature nhưng chủ yếu là `AI phân tích phim [CORE]`.
- Có prompt mẫu cho OpenAI/Gemini.
- Có output AI:
  - Overall score.
  - Plot score.
  - Acting score.
  - Visual score.
  - Sound score.
  - Summary.
  - Content labels.
  - Target audience.
  - Emotion timeline.

### Còn thiếu so với BE-LastUpdate

- Thiếu gần như toàn bộ phần AI personalized recommendation:
  - `UserPreferenceProfile`
  - `UserCohortPreference`
  - `TrailerInteraction`
  - Recommendation/preference enums.
  - `RecommendationStrategy`
  - `MockRecommendationStrategy`
  - Trailer interaction tracking.
  - Ticket history preference aggregation.
  - Favorite actor detection.
  - Movie feature extraction.
  - User cohort analysis.
  - Review sentiment/genre preference analysis.
  - Record trailer view/click/complete API.
  - User recommendation API.
  - Favorite actor based recommendation API.
  - Refresh user preference API.
  - Admin recommendation debug/report API.

## Phase 5 - Single Cinema, Room, Seat & Showtime

### CineAI_Project_Documentation đã có

- Có rooms/seats/showtimes trong database.
- Có luồng `4.4 Luồng quản lý lịch chiếu (Admin)`:
  - Admin chọn ngày cần xếp.
  - Chọn phim.
  - Chọn phòng chiếu.
  - Kiểm tra conflict tự động.
  - Nhập giờ bắt đầu.
  - Tự tính giờ kết thúc.
  - Nhập giá vé theo loại ghế.
  - Lưu và sinh danh sách ghế từ cấu hình phòng.
- Có Showtime & Booking API:
  - Get showtimes.
  - Get showtime detail.
  - Get seats.
  - Create showtime.
  - Update showtime.
- Có Admin Management API cho room list/create.

### Còn thiếu so với BE-LastUpdate

- Thiếu mô tả scope một rạp/single-cinema rõ như BE-LastUpdate.
- Thiếu rule chặn tạo rạp thứ hai.
- Thiếu room conflict validation chi tiết.
- Thiếu seat generation API chi tiết.
- Thiếu layout ghế lệch/seat row.
- Thiếu ticket pricing rule entity/service/controller chi tiết.
- Thiếu ticket combo chi tiết.
- Thiếu age restriction validation theo tuổi/người xem.
- Thiếu ticket pricing validation theo ngày thường/cuối tuần/ngày lễ/combo.

## Phase 6 - Booking, Seat Locking, F&B & Ticket QR

### CineAI_Project_Documentation đã có

- Có `4.3 Luồng đặt vé`.
- Có flow:
  - Chọn phim.
  - Chọn suất.
  - Chọn ghế.
  - Lock ghế.
  - Thêm F&B.
  - Áp voucher.
  - Xem tổng.
  - Thanh toán.
  - Callback.
  - Nhận vé QR.
- Có API:
  - Hold booking.
  - Create booking.
  - Booking detail.
  - My bookings.
  - Cancel booking.
- Có ý tưởng gửi email/notification sau khi nhận vé.

### Còn thiếu so với BE-LastUpdate

- Thiếu checklist entity/service/controller:
  - `Booking`
  - `BookingSeat`
  - `BookingTicket`
  - `FoodItem`
  - `FoodCombo`
  - `BookingFoodItem`
- Thiếu `TicketType`: ADULT, CHILD, SENIOR, STUDENT.
- Thiếu rule giá theo loại vé/độ tuổi/ngày/loại phòng.
- Thiếu ticket combo chi tiết.
- Thiếu cancel/refund khi suất bị sự cố/cúp điện.
- Thiếu QR ticket service chi tiết.
- Thiếu check-in API chi tiết.
- Thiếu F&B APIs chi tiết.

## Phase 7 - Payment

### CineAI_Project_Documentation đã có

- Có payment trong tech stack:
  - VNPAY / MoMo SDK.
  - Webhook xác nhận thanh toán.
- Có Payment API:
  - Create payment.
  - VNPAY callback.
  - MoMo callback.
  - Get payment status.

### Còn thiếu so với BE-LastUpdate

- Thiếu kiến trúc payment strategy pattern.
- Thiếu mock payment provider.
- Thiếu VNPAY provider placeholder/detail.
- Thiếu MoMo provider placeholder/detail.
- Thiếu idempotent callback handling.
- Thiếu refund foundation.
- Thiếu refund status tracking:
  - requested.
  - processing.
  - refunded.
  - failed.

## Phase 8 - Promotion, Wishlist, Loyalty & Notification

### CineAI_Project_Documentation đã có

- Có bảng:
  - `promotions`
  - `wishlists`
  - `loyalty_points`
  - `notifications`
- Có 4.5 nhắc tích điểm.
- Có Admin API:
  - List promotions.
  - Create promotion.
- Có booking flow áp voucher.
- Có notification khi nhận vé/đánh giá.

### Còn thiếu so với BE-LastUpdate

- Thiếu mô tả entity/enums/repositories/DTO/service/controller đầy đủ.
- Thiếu promotion validation API chi tiết.
- Thiếu rule kết hợp/không kết hợp điểm với promotion.
- Thiếu wishlist APIs chi tiết.
- Thiếu loyalty APIs:
  - Cộng điểm.
  - Trừ điểm.
  - Lịch sử điểm.
  - Quy đổi điểm.
- Thiếu point-to-promotion exchange API.
- Thiếu notification APIs chi tiết.

## Phase 9 - Review

### CineAI_Project_Documentation đã có

- Có bảng `reviews`.
- Có `4.5 Luồng đánh giá & tích điểm`:
  - Mở khóa đánh giá sau khi vé USED/check-in.
  - User đánh giá 1-5 sao.
  - User viết nhận xét.
  - BE lưu review.
  - Cập nhật điểm trung bình phim.
  - Cộng loyalty point.
  - Gửi notification.
- Có `GET /api/movies/{id}/reviews`.

### Còn thiếu so với BE-LastUpdate

- Thiếu review moderation chi tiết.
- Thiếu `ReviewService`.
- Thiếu `ReviewModerationService`.
- Thiếu `MovieRatingAggregationService`.
- Thiếu admin hide review API.
- Thiếu AI preference update after review API.
- Thiếu trạng thái review/status/moderation.

## Phase 10 - Staff Operations, Audit & Reports

### CineAI_Project_Documentation đã có

- Có role `STAFF` và `/api/v1/staff/**`.
- Có nền tảng check-in vé cho staff/admin.
- Có entity/repository audit log.
- Có dữ liệu booking, payment, ticket, food để làm báo cáo cơ bản.

### Ưu tiên triển khai

- Staff scan/check-in vé đầy đủ theo QR, trạng thái booking/ticket và quyền `STAFF`.
- Staff confirm combo pickup để đánh dấu F&B đã giao tại quầy.
- Audit log cho các admin action quan trọng: tạo/cập nhật/xóa phim, suất chiếu, giá vé, promotion, user status, refund, staff account.
- Basic reports:
  - Doanh thu theo ngày/tháng/khoảng thời gian.
  - Số vé bán theo phim/suất chiếu.
  - Combo/F&B bán chạy.

## Phase 11 - Email Ticket & Realtime Seat Updates

### CineAI_Project_Documentation đã có

- Có mail service cho OTP/auth.
- Có dependency WebSocket.
- Có notification API theo cơ chế polling.
- Có scheduler dọn hold ghế hết hạn.

### Ưu tiên triển khai

- Email vé sau thanh toán thành công, gồm thông tin phim, suất chiếu, ghế, tổng tiền và QR.
- WebSocket cập nhật seat status realtime khi hold/release/book/check-in.
- Notification cho user/admin là optional, chỉ triển khai sau khi email vé và realtime seat ổn định.

## Phase 12 - API Contract & QA Readiness

### CineAI_Project_Documentation đã có

- Có Swagger/OpenAPI.
- Có tài liệu API theo phase trong thư mục `api/`.
- Có Postman post-response scripts rời.
- Có một số integration tests.

### Ưu tiên triển khai

- API contract: chuẩn hóa request/response/error/status code cho các luồng chính.
- Postman collection chạy được end-to-end, có biến collection và thứ tự request rõ ràng.
- End-to-end test flow: auth -> movie/showtime -> hold -> booking -> payment -> QR/check-in -> report.
- Swagger cleanup: tag, summary, description, security requirement, example request/response.
- NFR checklist: security, idempotency, concurrency, performance, logging/audit, config/secret hygiene.

## 4. Những phần CineAI_Project_Documentation làm tốt hơn BE-LastUpdate

`CineAI_Project_Documentation.docx` có một số phần BE-LastUpdate không có hoặc ít chi tiết hơn:

- Tổng quan sản phẩm rõ ràng.
- Mục tiêu hệ thống.
- Đối tượng người dùng.
- Tech stack tổng thể cả frontend/backend/deploy.
- Kiến trúc client-server.
- Cấu trúc frontend React Vite.
- Danh sách màn hình/routes frontend.
- Component frontend cần xây dựng.
- Zustand state management.
- Biến môi trường frontend.
- Docker Compose/deploy checklist.
- Phụ lục thư viện frontend/backend.
- Prompt mẫu cho AI movie analysis.
- Luồng nghiệp vụ theo hành trình người dùng dễ hiểu hơn.

## 5. Những phần nên bổ sung vào CineAI_Project_Documentation khi generate lại

Nên bổ sung từ `BE-LastUpdate.docx`:

- Section "Tiến độ backend theo phase".
- Phase 0 foundation checklist.
- Phase 1 migration checklist.
- Phase 2 auth/user/security checklist chi tiết.
- Phase 3 movie/genre/actor checklist.
- Phase 4 AI personalized recommendation.
- Phase 5 single cinema, room, seat, showtime constraints.
- Phase 6 booking/F&B/QR/refund chi tiết.
- Phase 7 payment strategy/refund/idempotency.
- Phase 8 promotion/wishlist/loyalty/notification chi tiết.
- Phase 9 review moderation/aggregation/AI preference update.
- Phase 10 Staff Operations/Audit/Reports.
- Phase 11 Email Ticket/Realtime Seat Updates.
- Phase 12 API Contract/QA Readiness.

Nên cập nhật theo project hiện tại:

- API prefix thực tế là `/api/v1/...`, không phải `/api/...`.
- Database thực tế đang cấu hình PostgreSQL, không phải MySQL 8.
- Project đã hoàn thành đến mục **4.4 Luồng quản lý lịch chiếu (Admin)**.
- Các phần sau 4.4 đã có một phần: promotion, wishlist, loyalty, notification, recommendation.
- Review, Staff Operations/Audit/Reports, Email Ticket/Realtime Seat Updates và API Contract/QA Readiness vẫn nên ghi là chưa hoàn thiện hoặc chưa xác nhận.

## 6. Tóm tắt để generate lại

Khi generate lại `CineAI_Project_Documentation`, nên giữ tài liệu này làm bản product/spec chính vì nó có phần tổng quan, kiến trúc, database, flow, API, frontend và deploy tốt. Tuy nhiên cần bổ sung phần backend phase checklist từ `BE-LastUpdate`, ưu tiên recommendation nâng cao, ticket pricing, Phase 10 Staff Operations/Audit/Reports, Phase 11 Email Ticket/Realtime Seat Updates và Phase 12 API Contract/QA Readiness.

Trạng thái nên ghi trong bản generate mới:

- Đã hoàn thành đến **4.4 Luồng quản lý lịch chiếu (Admin)**.
- Đã có thêm một phần sau 4.4: promotion, wishlist, loyalty, notification, recommendation.
- Chưa hoàn thiện: review flow đầy đủ, staff management, audit log API, dashboard/report, MoMo, S3, WebSocket realtime, email template/gửi vé, deploy production, QA nếu không tính `src/test`.

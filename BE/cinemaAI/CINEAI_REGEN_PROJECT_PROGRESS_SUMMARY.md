# Tổng hợp tiến độ project và chênh lệch tài liệu để generate lại

Ngày tổng hợp: 2026-06-11  
Project: `cinemaAI` backend  
Phạm vi quét project: `src/main/java`, `src/main/resources`, `api/`, `pom.xml`  
Không dùng: `src/test`

Nguồn tài liệu đối chiếu:

- `C:\Users\quyet\Downloads\CineAI_Project_Documentation.docx`
- `D:\FPTK8\SBA301\BE-LastUpdate.docx`

## 1. Kết luận nhanh

Theo source code backend hiện tại và đối chiếu với `CineAI_Project_Documentation.docx`, project đã hoàn thành đến:

> **4.4 - Luồng quản lý lịch chiếu (Admin)**

Các phần sau **4.4** chưa được xem là hoàn thành đầy đủ theo tài liệu CineAI, nhưng project đã có một số module mở rộng:

- Promotion: đã có.
- Wishlist: đã có.
- Loyalty point: đã có một phần.
- Notification: đã có một phần.
- Recommendation: đã có một module riêng theo hướng personalized recommendation.
- Review: mới thấy entity/repository/status, chưa thấy API/flow hoàn chỉnh.
- Staff Operations/Audit/Reports: mới có nền tảng staff check-in và entity/repository audit một phần, cần ưu tiên scan/check-in vé, confirm combo pickup, audit log admin action và basic reports.

## 2. Tiến độ project theo CineAI_Project_Documentation.docx

| Mục trong CineAI documentation | Trạng thái theo project hiện tại | Ghi chú |
| --- | --- | --- |
| 1. Tổng quan dự án | Đã có ở mức backend | Backend phục vụ đặt vé, quản lý phim/lịch chiếu, AI, thanh toán, user. |
| 2. Kiến trúc hệ thống | Đã có ở mức backend | Có controller/service/repository/entity/dto/mapper/security/config. Frontend không nằm trong repo backend này. |
| 3. Thiết kế Database | Đã có phần lớn | Có entity và migration; thực tế dùng PostgreSQL, không phải MySQL như tài liệu CineAI. Flyway đang tắt trong config. |
| 4.1 Luồng AI phân tích phim | Đã có | Có AI analysis, emotion segment, label, approve/reject/regenerate, public approved analysis. |
| 4.2 Luồng đăng ký / đăng nhập | Đã có | Có register, login, Google login, verify email, refresh, logout, reset password, user profile. |
| 4.3 Luồng đặt vé | Đã có phần chính | Có movie/showtime/seat-map, hold seats, booking, food, promotion, payment VNPay/mock, QR, check-in, refund request. |
| 4.4 Luồng quản lý lịch chiếu Admin | Đã có | Có admin showtime CRUD, bulk showtime, cinema/room/seat management, ticket pricing. |
| 4.5 Luồng đánh giá & tích điểm | Chưa hoàn thành đầy đủ | Loyalty có một phần; review flow đầy đủ chưa thấy. |
| 5. API Endpoints | Có nhiều API tương ứng, nhưng path khác tài liệu | Project dùng prefix `/api/v1/...`, tài liệu CineAI dùng `/api/...`. |
| 6. Màn hình Frontend | Không thuộc repo backend | Không đánh giá trong backend project. |
| 7. Bảo mật & Validation | Có phần backend chính | Có JWT/Spring Security/validation, nhưng chưa đối chiếu từng rule chi tiết trong tài liệu. |
| 8. Kế hoạch phát triển | Không phải hạng mục code | Có thể dùng để lập roadmap tiếp theo. |
| 9. Cấu hình & Deploy | Có config local/backend, deploy chưa xác nhận | Có `application.properties`; chưa xác nhận Docker/Nginx/Vercel/Railway theo tài liệu. |
| 10. Phụ lục | Không phải hạng mục hoàn thành | Dùng để tham khảo dependency/tooling. |

## 3. Những phần đã có trong project đến 4.4

### 3.1 Nền tảng backend

Đã có:

- Spring Boot 3.5.13.
- Java 17.
- Maven.
- Spring Web.
- Spring Data JPA.
- Spring Security.
- JWT.
- Validation.
- Mail.
- WebSocket dependency.
- Actuator.
- Springdoc OpenAPI/Swagger.
- Spring AI OpenAI starter.
- Cloudinary.
- OkHttp.
- PostgreSQL/MySQL runtime driver.
- Cấu trúc layer:
  - `controller`
  - `service`
  - `repository`
  - `entity`
  - `dto`
  - `mapper`
  - `security`
  - `config`
  - `exception`
  - `seeder`

### 3.2 Auth, user, security

Đã có:

- Register.
- Login email/password.
- Google login.
- Google login OTP verify.
- Email verification.
- Resend verification OTP.
- Refresh token.
- Logout.
- Password reset request/confirm.
- Current user profile.
- Update profile.
- Change password.
- Admin list users.
- Admin get user detail.
- Admin update user status.
- Role assignment/read role service.

API chính:

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

### 3.3 Movie, genre, actor, upload

Đã có:

- Public movie list/search/filter.
- Public movie detail.
- Public genre list/detail.
- Public actor search/detail.
- Public movies by actor.
- Admin movie CRUD.
- Admin update movie status.
- Admin genre CRUD.
- Admin actor CRUD.
- Movie-genre relation.
- Movie-actor relation.
- Main role cho actor trong movie.
- Upload image qua Cloudinary.
- Lưu metadata uploaded file.

API chính:

- `GET /api/v1/movies`
- `GET /api/v1/movies/{movieId}`
- `GET /api/v1/genres`
- `GET /api/v1/genres/{genreId}`
- `GET /api/v1/actors`
- `GET /api/v1/actors/{actorId}`
- `GET /api/v1/actors/{actorId}/movies`
- `GET /api/v1/admin/movies`
- `POST /api/v1/admin/movies`
- `PUT /api/v1/admin/movies/{movieId}`
- `PATCH /api/v1/admin/movies/{movieId}/status`
- `DELETE /api/v1/admin/movies/{movieId}`
- `POST /api/v1/admin/uploads/images`

### 3.4 AI phân tích phim

Đã có:

- AI analysis request.
- Regenerate analysis.
- Approve analysis.
- Reject analysis.
- Delete analysis.
- Admin get analysis.
- Public get approved analysis.
- AI emotion segments.
- Content labels.
- Prompt builder.
- AI result parser.
- Strategy:
  - OpenAI.
  - Gemini.
  - Mock.

API chính:

- `POST /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/analyses/{analysisId}`
- `POST /api/v1/admin/analyses/{analysisId}/regenerate`
- `POST /api/v1/admin/analyses/{analysisId}/approve`
- `POST /api/v1/admin/analyses/{analysisId}/reject`
- `DELETE /api/v1/admin/analyses/{analysisId}`
- `GET /api/v1/movies/{movieId}/analysis`

### 3.5 Cinema, room, seat, showtime

Đã có:

- Scope một rạp.
- Public get cinema.
- Public get rooms.
- Admin create/update/delete cinema.
- Admin update cinema status.
- Admin room CRUD.
- Admin room status update.
- Generate seat layout.
- Replace full seat layout.
- Update/delete seat.
- Seat row/layout lệch.
- Showtime public search.
- Showtime detail.
- Showtime seat map.
- Admin showtime CRUD.
- Admin bulk showtime.
- Admin showtime status update.

API chính:

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
- `POST /api/v1/admin/rooms`
- `PUT /api/v1/admin/rooms/{roomId}`
- `PATCH /api/v1/admin/rooms/{roomId}/status`
- `POST /api/v1/admin/rooms/{roomId}/seats/generate`
- `PUT /api/v1/admin/rooms/{roomId}/seats`
- `GET /api/v1/admin/showtimes`
- `POST /api/v1/admin/showtimes`
- `POST /api/v1/admin/showtimes/bulk`
- `PUT /api/v1/admin/showtimes/{showtimeId}`
- `PATCH /api/v1/admin/showtimes/{showtimeId}/status`
- `DELETE /api/v1/admin/showtimes/{showtimeId}`

### 3.6 Ticket pricing

Đã có:

- Ticket pricing rule.
- Ticket combo.
- Admin search/list rules.
- Admin CRUD rules.
- Public active combos.
- Admin CRUD combos.
- Validate price theo ticket/showtime/request.
- Migration ticket price matrix theo showtime.

API chính:

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

### 3.7 Booking flow

Đã có:

- Hold seats.
- Release expired holds.
- Create booking from hold.
- Booking tickets.
- Booking seats.
- Booking food items.
- User booking list.
- User booking detail.
- User cancel booking.
- Refund request.
- Admin booking list/detail.
- Admin cancel booking.
- Staff/admin check-in.
- QR ticket service.
- Admin mark refunded.

API chính:

- `POST /api/v1/bookings/hold`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/{bookingId}`
- `DELETE /api/v1/bookings/{bookingId}`
- `POST /api/v1/bookings/{bookingId}/refund-request`
- `GET /api/v1/admin/bookings`
- `GET /api/v1/admin/bookings/{bookingId}`
- `DELETE /api/v1/admin/bookings/{bookingId}`
- `POST /api/v1/admin/bookings/{bookingId}/check-in`
- `POST /api/v1/admin/bookings/{bookingId}/refund-request`
- `POST /api/v1/admin/bookings/{bookingId}/mark-refunded`
- `POST /api/v1/staff/check-in`
- `POST /api/v1/admin/check-in`

### 3.8 F&B

Đã có:

- Food item.
- Food combo.
- Public active item/combo list.
- Admin list all item/combo.
- Admin create/update/delete item.
- Admin create/update/delete combo.

API chính:

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

### 3.9 Payment

Đã có:

- Payment entity.
- VNPay payment create.
- VNPay return.
- VNPay IPN.
- VNPay signature verify.
- Mock payment.
- Get payment by booking.

API chính:

- `POST /api/v1/payments/vnpay/create`
- `GET /api/v1/payments/vnpay/return`
- `GET /api/v1/payments/vnpay/ipn`
- `POST /api/v1/payments/mock`
- `GET /api/v1/payments/booking/{bookingId}`

## 4. Các module đã có ngoài phạm vi hoàn thành đến 4.4

Các phần dưới đây nằm sau hoặc ngoài phạm vi 4.4 của `CineAI_Project_Documentation`, nhưng project đã có một phần/hoàn chỉnh cơ bản.

### 4.1 Promotion

Đã có:

- Promotion entity.
- BookingPromotion entity.
- Promotion type/status.
- Get promotion by code.
- Apply promotion.
- Remove promotion.
- Validate promotion.
- Admin create/update/delete/list promotion.

Chưa rõ/chưa có:

- Rule kết hợp promotion với loyalty point.
- Point-to-promotion exchange.
- Cấu hình cần bao nhiêu point để đổi promotion.

### 4.2 Wishlist

Đã có:

- Wishlist entity.
- Add movie to wishlist.
- Get my wishlist.
- Remove movie from wishlist.

### 4.3 Loyalty point

Đã có:

- LoyaltyPoint entity.
- Loyalty tier/status/type.
- User xem điểm.
- Admin cộng điểm.
- Admin redeem/trừ điểm.
- Tự cộng điểm từ booking.

Chưa rõ/chưa có:

- Lịch sử điểm đầy đủ theo API riêng.
- Rule `100 điểm = 1 vé tặng` như CineAI doc.
- Luồng cộng điểm sau review như mục 4.5.

### 4.4 Notification

Đã có:

- Notification entity.
- Notification type.
- Create notification for user.
- User xem notification.
- User xem unread notification.
- Mark read.

Chưa rõ/chưa có:

- Tự gửi notification sau review/check-in/payment theo đúng tài liệu CineAI.
- Realtime notification qua WebSocket.

### 4.5 Personalized recommendation

Đã có:

- Trailer interaction.
- User preference profile.
- User cohort preference.
- Record trailer interaction.
- Refresh preference profile.
- Get my preference profile.
- Recommend movies.
- Recommend favorite actors.
- Admin debug recommendation.

Chưa rõ/chưa có:

- Review sentiment analysis.
- Ticket history aggregation chi tiết.
- Feature vector extraction service riêng.
- Cohort analysis service đầy đủ.

## 5. Những phần chưa hoàn thành/chưa xác nhận theo CineAI_Project_Documentation

### 5.1 Mục 4.5 - Luồng đánh giá & tích điểm

Tài liệu yêu cầu:

- Sau khi vé có status `USED`, mở khóa tính năng đánh giá.
- User đánh giá phim 1-5 sao và viết nhận xét.
- Backend lưu review.
- Cập nhật điểm trung bình review của phim.
- Cộng điểm loyalty sau đánh giá/check-in.
- Gửi notification cảm ơn và báo điểm thưởng.

Project hiện tại:

- Có `Review` entity.
- Có `ReviewRepository`.
- Có `ReviewStatus`.
- Chưa thấy public review API.
- Chưa thấy review service.
- Chưa thấy admin hide review API.
- Chưa thấy movie rating aggregation service.
- Chưa thấy flow mở khóa review sau check-in.
- Chưa thấy flow cộng điểm sau review.

### 5.2 API Endpoints trong CineAI doc

Project có nhiều API tương ứng nhưng path khác tài liệu:

- CineAI doc dùng dạng `/api/...`.
- Project thực tế dùng `/api/v1/...`.

Các API chưa rõ/chưa có theo CineAI doc:

- `GET /api/movies/{id}/reviews`
- `GET /api/payments/callback/momo`
- `GET /api/admin/dashboard`
- `GET /api/admin/revenue`
- `POST /api/admin/checkin/{qrCode}` đúng path như tài liệu. Project có check-in nhưng path khác.

### 5.3 Frontend

Không thuộc repo backend hiện tại, nên chưa đánh giá:

- React routes.
- Admin screens.
- User screens.
- Components như SeatMap, EmotionTimeline, AIReviewCard.
- Zustand stores.
- Frontend env.

### 5.4 Deploy/config theo CineAI doc

Chưa xác nhận:

- Docker Compose hoàn chỉnh.
- Nginx.
- FE deploy Vercel/Netlify.
- BE deploy Railway/VPS.
- AWS S3.
- MoMo SDK.
- WebSocket realtime.

## 6. So sánh CineAI_Project_Documentation.docx với BE-LastUpdate.docx

### 6.1 CineAI_Project_Documentation có nhưng BE-LastUpdate thiếu hoặc chưa rõ

#### Tổng quan sản phẩm

CineAI có:

- Mô tả sản phẩm hoàn chỉnh.
- Mục tiêu hệ thống.
- Đối tượng người dùng.
- Tech stack tổng thể gồm frontend, backend, database, AI, payment, storage, deploy.

BE-LastUpdate chủ yếu là:

- Kế hoạch phase backend.
- Trạng thái đã hoàn thành/còn thiếu theo từng phase.

#### Frontend

CineAI có:

- Cấu trúc thư mục React Vite.
- Danh sách route/màn hình frontend.
- Component cần xây dựng riêng.
- State management Zustand.
- Frontend `.env`.
- Thư viện frontend cần cài.

BE-LastUpdate không có hoặc không đi sâu phần frontend.

#### Database chi tiết theo bảng

CineAI có:

- Danh sách bảng chính.
- Mô tả quan hệ.
- Chi tiết bảng quan trọng như movies, users, bookings, payments, ai_analyses.

BE-LastUpdate chỉ mô tả theo phase migration, ít chi tiết bảng hơn.

#### AI movie analysis core

CineAI có:

- Luồng AI phân tích phim là core feature.
- Prompt mẫu.
- overall_score, plot_score, acting_score, visual_score, sound_score.
- summary.
- content labels.
- target audience.
- emotion timeline.

BE-LastUpdate tập trung nhiều hơn vào AI personalized recommendation, không mô tả sâu AI movie analysis core như CineAI.

#### Luồng nghiệp vụ người dùng

CineAI có:

- Luồng đăng ký/đăng nhập.
- Luồng đặt vé end-to-end.
- Luồng quản lý lịch chiếu admin.
- Luồng đánh giá và tích điểm.

BE-LastUpdate mô tả theo phase kỹ thuật, không theo user journey chi tiết như CineAI.

#### API endpoint theo nhóm sản phẩm

CineAI có các bảng API cho:

- Auth API.
- Movie API.
- Showtime & Booking API.
- Payment API.
- Admin Management API.

BE-LastUpdate có checklist cần làm theo phase, không phải bảng API product-level đầy đủ.

#### Deploy và phụ lục

CineAI có:

- Backend env.
- Frontend env.
- Docker Compose.
- Checklist trước khi code.
- Thư viện frontend/backend cần thêm.

BE-LastUpdate không có đầy đủ phần deploy/phụ lục này.

### 6.2 BE-LastUpdate có nhưng CineAI_Project_Documentation thiếu hoặc ít chi tiết hơn

#### Phase backend chi tiết

BE-LastUpdate có cấu trúc phase backend rất rõ:

- Phase 0: Shared foundation.
- Phase 1: Database migration.
- Phase 2: Auth/user/security.
- Phase 3: Movie/genre.
- Phase 4: AI personalized recommendation.
- Phase 5: Single cinema/room/seat/showtime.
- Phase 6: Booking/seat locking/F&B/QR.
- Phase 7: Payment.
- Phase 8: Promotion/wishlist/loyalty/notification.
- Phase 9: Review.
- Phase 10: Staff Operations, Audit & Reports.
- Phase 11: Email Ticket & Realtime Seat Updates.
- Phase 12: API Contract & QA Readiness.

CineAI có kế hoạch phát triển nhưng không chi tiết backend phase bằng BE-LastUpdate.

#### AI personalized recommendation

BE-LastUpdate chi tiết hơn về:

- Trailer behavior.
- Ticket history preference.
- Favorite actor detection.
- Movie feature extraction.
- User cohort filtering.
- Review sentiment/preference.
- Content-based filtering và cohort filtering.

CineAI tập trung vào AI movie analysis, ít chi tiết personalized recommendation.

#### Single cinema và room/showtime constraints

BE-LastUpdate chi tiết hơn về:

- Scope một rạp.
- Chặn tạo rạp thứ hai.
- Conflict lịch chiếu trong cùng phòng.
- Nền tảng mở rộng multi-cinema sau này.

CineAI có admin schedule flow nhưng ít chi tiết constraint backend.

#### Ticket pricing/age/ticket combo

BE-LastUpdate chi tiết hơn về:

- TicketType: ADULT, CHILD, SENIOR, STUDENT.
- Rule giá theo tuổi/ngày/loại phòng/suất chiếu.
- Combo vé.
- Validate age restriction.

CineAI chỉ mô tả booking flow ở mức tổng quát hơn.

#### Staff Operations, Audit & Reports

Phase 10 nên tập trung vào các phần vận hành backend có giá trị demo và nghiệm thu cao:

- Staff scan/check-in vé.
- Staff confirm combo pickup.
- Audit log cho admin action quan trọng.
- Basic reports: doanh thu, vé bán, combo bán chạy.

CineAI đã có nền tảng role `STAFF`, check-in và dữ liệu booking/payment/F&B; phần còn thiếu nên ưu tiên thao tác staff thực tế, audit và report cơ bản thay vì dashboard quá rộng.

#### Email Ticket & Realtime Seat Updates

Phase 11 nên ưu tiên trải nghiệm sau thanh toán và giữ ghế realtime:

- Email vé sau thanh toán thành công.
- WebSocket cập nhật seat status realtime.
- Notification cho user/admin là optional.

CineAI đã có Cloudinary, mail OTP và scheduler dọn hold, nên Phase 11 không nên dàn trải thêm storage/deploy nếu mục tiêu là hoàn thiện web đặt vé.

#### API Contract & QA Readiness

Phase 12 nên khóa chất lượng backend trước khi demo/bàn giao:

- API contract.
- Postman collection.
- End-to-end test flow.
- Swagger cleanup.
- NFR checklist.

CineAI có checklist/code plan, nhưng không có phase QA backend rõ như BE-LastUpdate.

## 7. Nội dung nên dùng để generate lại tài liệu

### 7.1 Nên lấy từ CineAI_Project_Documentation

Giữ các phần:

- Tổng quan sản phẩm.
- Mục tiêu hệ thống.
- Đối tượng người dùng.
- Tech stack tổng thể.
- Kiến trúc client-server.
- Cấu trúc frontend.
- Cấu trúc backend.
- Database product-level.
- Luồng nghiệp vụ 4.1 đến 4.5.
- API endpoint theo nhóm.
- Frontend routes/components/state.
- Security/validation.
- Deploy/env.
- Phụ lục thư viện.

### 7.2 Nên bổ sung từ BE-LastUpdate

Bổ sung các phần:

- Phase backend 0-12.
- Checklist từng phase.
- AI personalized recommendation chi tiết.
- Single-cinema constraint.
- Ticket pricing/ticket combo/age restriction chi tiết.
- Refund/cancelled showtime/cúp điện.
- Phase 10 Staff Operations/Audit/Reports.
- Phase 11 Email Ticket/Realtime Seat Updates.
- Phase 12 API Contract/QA Readiness.

### 7.3 Nên cập nhật theo source project hiện tại

Cập nhật lại trạng thái:

- Không ghi auth/movie/cinema/booking/payment/promotion/wishlist/loyalty/notification/recommendation là "cần làm" nữa nếu tài liệu cũ đang nói vậy.
- Ghi project đã hoàn thành đến `4.4 Luồng quản lý lịch chiếu Admin`.
- Ghi các phần sau 4.4 đã có một phần:
  - Promotion.
  - Wishlist.
  - Loyalty.
  - Notification.
  - Recommendation.
- Ghi các phần chưa hoàn thành/chưa xác nhận:
  - Review API/flow đầy đủ.
  - Staff management API.
  - Audit API.
  - Dashboard/reports.
  - MoMo.
  - S3.
  - WebSocket realtime.
  - Email templates/gửi vé qua email.
  - Docker/deploy production.

### 7.4 Nên thống nhất lại naming/path API

Tài liệu CineAI đang dùng:

- `/api/auth/...`
- `/api/movies/...`
- `/api/showtimes/...`
- `/api/payments/...`

Project thực tế đang dùng:

- `/api/v1/auth/...`
- `/api/v1/movies/...`
- `/api/v1/showtimes/...`
- `/api/v1/payments/...`
- `/api/v1/admin/...`

Khi generate lại tài liệu, nên dùng path thực tế của project: **`/api/v1/...`**.

### 7.5 Nên thống nhất lại database

Tài liệu CineAI ghi:

- MySQL 8.

Project hiện tại cấu hình:

- PostgreSQL datasource.
- PostgreSQL dialect.
- Có MySQL driver runtime nhưng không phải datasource đang dùng.

Khi generate lại, nên ghi:

- Database hiện tại: PostgreSQL.
- MySQL chỉ là dependency runtime còn tồn tại, nếu không dùng nên cân nhắc bỏ hoặc ghi là chưa dùng.

## 8. Roadmap đề xuất sau trạng thái hiện tại

Vì project đã hoàn thành đến 4.4, bước tiếp theo hợp lý là:

### Ưu tiên 1 - Hoàn thiện 4.5 Review & loyalty flow

- Tạo review request/response DTO.
- Tạo `ReviewService`.
- Tạo public review APIs.
- Tạo API user đánh giá phim sau khi check-in.
- Tạo rule chỉ booking đã check-in/USED mới được review.
- Cập nhật rating trung bình của phim.
- Cộng loyalty point sau review nếu đúng yêu cầu.
- Gửi notification sau review.

### Ưu tiên 2 - Chuẩn hóa payment flow

- Thống nhất booking chỉ `PAID` sau payment success.
- Tách rõ booking pending payment và paid.
- Bổ sung callback idempotency.
- Bổ sung refund status tracking.
- Quyết định có làm MoMo không.

### Ưu tiên 3 - Staff Operations, Audit & Reports

- Staff scan/check-in vé.
- Staff confirm combo pickup.
- Audit log cho admin action quan trọng.
- Basic reports: doanh thu, vé bán, combo bán chạy.

### Ưu tiên 4 - Email Ticket & Realtime Seat Updates

- Email vé sau thanh toán thành công.
- WebSocket cập nhật seat status realtime.
- Notification user/admin để optional.

### Ưu tiên 5 - API Contract & QA Readiness

- API contract.
- Postman collection.
- End-to-end test flow.
- Swagger cleanup.
- NFR checklist.

## 9. Tóm tắt dùng cho generate lại

Project backend hiện tại đã hoàn thành các nền tảng chính của hệ thống CineAI đến mục **4.4 Luồng quản lý lịch chiếu Admin** trong `CineAI_Project_Documentation.docx`. Backend đã có auth/JWT, user management, movie/genre/actor, Cloudinary upload, AI movie analysis, cinema/room/seat/showtime, ticket pricing, booking/seat hold/F&B/QR/check-in/refund request, VNPay/mock payment, promotion, wishlist, loyalty, notification và personalized recommendation.

Tài liệu `CineAI_Project_Documentation.docx` nên được giữ làm tài liệu product/spec tổng thể, đặc biệt cho phần tổng quan, kiến trúc, database, flow nghiệp vụ, frontend, API, bảo mật và deploy. Tài liệu `BE-LastUpdate.docx` nên được dùng để bổ sung roadmap backend chi tiết theo phase, đặc biệt các phần recommendation nâng cao, ticket pricing/age rule, Phase 10 Staff Operations/Audit/Reports, Phase 11 Email Ticket/Realtime Seat Updates và Phase 12 API Contract/QA Readiness.

Các phần cần ghi là chưa hoàn thành/chưa xác nhận gồm review flow đầy đủ, staff scan/check-in nâng cao, staff confirm combo pickup, audit log API, basic reports, email vé sau thanh toán, WebSocket realtime seat status, API contract, Postman collection, end-to-end test flow, Swagger cleanup và NFR checklist.

# Bản cập nhật: Project hiện tại so với BUSINESS_FLOW_COMPARISON_CINEAI_BE_LASTUPDATE

Ngày cập nhật: 2026-06-11  
Nguồn checklist: `BUSINESS_FLOW_COMPARISON_CINEAI_BE_LASTUPDATE.md`  
Phạm vi quét project: `src/main/java`, `src/main/resources`, `api/`, `pom.xml`  
Không quét: `src/test`

> Theo yêu cầu, bỏ qua mục **2.1 Luồng AI phân tích phim**. File này chỉ kiểm tra các luồng nghiệp vụ còn lại trong `BUSINESS_FLOW_COMPARISON_CINEAI_BE_LASTUPDATE.md` xem project hiện tại đã có chưa.

## 1. Kết luận nhanh

Sau khi quét lại project, một số phần từng được ghi là "thiếu/chưa đủ sâu" trong file luồng nghiệp vụ thực ra project đã có nhiều hơn:

- Đăng ký/đăng nhập: đã có tốt, gồm cả Google login, email OTP, password reset.
- Đặt vé: đã có hold ghế, hết hạn hold, chống trùng ghế, ticket selection, F&B, QR, check-in, refund request.
- Quản lý lịch chiếu Admin: đã có khá đầy đủ, gồm single-cinema, room, seat layout, bulk showtime, conflict phòng chiếu.
- Ticket pricing/age rule/combo vé: đã có khá nhiều, gồm ADULT/CHILD/STUDENT, kiểm tra tuổi, giá theo seat/room/weekend/holiday, combo vé.
- Hủy suất và refund: đã có một phần tốt, khi admin cancel showtime thì booking PAID chuyển REFUND_REQUESTED.
- Payment: đã có VNPay, mock payment, verify signature, return/IPN, idempotent guard cơ bản.
- Personalized recommendation: đã có nhiều, gồm trailer interaction, booking signals, review signals, favorite actor recommendation, profile refresh.
- Promotion/wishlist/loyalty/notification: đã có phần chính.
- Staff Operations/Audit/Reports: mới có staff check-in và entity/repository; còn thiếu staff scan/check-in đầy đủ, confirm combo pickup, audit admin action và basic reports.
- Email Ticket/Realtime Seat Updates: có email OTP, Cloudinary upload, scheduler dọn hold; WebSocket realtime seat status và email vé sau thanh toán chưa thấy.
- Review flow: mới có entity/repository và review signal cho recommendation; chưa thấy API review đầy đủ.

## 3. Chi tiết cập nhật từng luồng

## 3.1 Đăng ký / đăng nhập

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- Quên mật khẩu.
- Gửi lại xác minh email/OTP.
- Google login.
- Admin khóa/mở user.
- Phân quyền STAFF.

### Project hiện tại đã có

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
- Security rule cho `/api/v1/staff/**` với role `ADMIN` hoặc `STAFF`.

### Trạng thái mới

**Đã hoàn thành tốt** cho luồng nghiệp vụ auth/user chính.

## 3.2 Đặt vé

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- Kiểm tra độ tuổi người xem.
- Loại vé ADULT/CHILD/SENIOR/STUDENT.
- Rule giá riêng cho từng loại vé.
- Giá khác ngày thường/cuối tuần/ngày lễ/loại phòng/suất chiếu.
- Combo vé.
- Hold ghế tự hết hạn.
- Chống hai user đặt cùng ghế.
- Hủy/hoàn tiền khi suất chiếu bị sự cố.
- Đổi suất khi suất bị hủy.

### Project hiện tại đã có

- Hold ghế:
  - `POST /api/v1/bookings/hold`
  - Booking hold có `holdExpiresAt`.
  - `SeatHoldCleanupScheduler` dọn hold hết hạn.
- Tạo booking:
  - `POST /api/v1/bookings`
  - Validate tickets phải khớp held seats.
  - Chống duplicate `seatId` trong ticket selection.
  - Chống đặt ghế không available.
- Giá vé/tuổi:
  - `TicketPricingService.validatePrice`.
  - Kiểm tra `TicketType.allowsAge`.
  - Kiểm tra `Movie.ageRating.allowsAge`.
  - Kiểm tra couple seat chỉ hỗ trợ adult ticket.
- F&B:
  - Food item/combo public và admin.
  - Booking gắn food.
- QR/check-in:
  - `QrTicketService`.
  - `POST /api/v1/staff/check-in`
  - `POST /api/v1/admin/check-in`
- Refund/cancel:
  - User cancel booking.
  - User refund request.
  - Admin refund request.
  - Admin mark refunded.

### Vẫn thiếu/chưa rõ

- Không có `SENIOR` trong `TicketType`; hiện enum có `ADULT`, `CHILD`, `STUDENT`.
- Luồng đổi suất khi suất bị hủy chưa thấy.
- Luồng booking/payment cần thống nhất thêm: trong `BookingService.createBooking`, booking được `markPaid(...)`; trong `PaymentService` cũng có luồng confirm payment để mark paid.

### Trạng thái mới

**Đã có phần chính, gần hoàn thành**, còn thiếu đổi suất, SENIOR nếu yêu cầu bắt buộc, và cần thống nhất trạng thái paid với payment.

## 3.3 Quản lý lịch chiếu Admin

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- Scope một rạp duy nhất.
- Chặn tạo rạp thứ hai.
- Admin tạo/cập nhật rạp.
- Admin tạo/cập nhật phòng.
- Sinh sơ đồ ghế chi tiết.
- Trạng thái hoạt động rạp/phòng/ghế/suất chiếu.
- Conflict trong cùng phòng.

### Project hiện tại đã có

- Cinema:
  - `GET /api/v1/admin/cinema`
  - `POST /api/v1/admin/cinema`
  - `PUT /api/v1/admin/cinema`
  - `PATCH /api/v1/admin/cinema/status`
  - `DELETE /api/v1/admin/cinema`
  - Service có logic singleton/single-cinema.
- Room:
  - `GET /api/v1/admin/rooms`
  - `POST /api/v1/admin/rooms`
  - `PUT /api/v1/admin/rooms/{roomId}`
  - `PATCH /api/v1/admin/rooms/{roomId}/status`
- Seat:
  - Generate seats.
  - Replace full seat layout.
  - Update seat.
  - Delete seat.
  - Có `SeatRow`.
- Showtime:
  - Admin search/list.
  - Create.
  - Bulk create.
  - Update.
  - Status update.
  - Delete.
  - Seat map.
  - Validate overlap bằng `showtimeRepository.existsOverlapping`.
  - Tự tính end time = start + duration + cleanup minutes.

### Vẫn thiếu/chưa rõ

- Nếu cần mô tả "cúp điện/sự cố vận hành" như một reason riêng cho cancel thì chưa thấy reason nhập từ admin khi cancel showtime; hiện default `"Showtime cancelled by admin"`.

### Trạng thái mới

**Đã có khá đầy đủ** cho luồng quản lý lịch chiếu Admin.

## 3.4 Đánh giá & tích điểm

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- Admin ẩn đánh giá không phù hợp.
- Review cập nhật AI preference.
- Review sentiment.
- Lịch sử điểm.
- Quy đổi điểm.
- Quan hệ điểm và promotion.

### Project hiện tại đã có

- Review:
  - `Review` entity.
  - `ReviewRepository`.
  - `ReviewStatus`.
  - `RecommendationService.applyReviewSignals(...)` dùng review để cập nhật preference/recommendation.
- Loyalty:
  - `LoyaltyPointService`.
  - User xem điểm.
  - Admin cộng điểm.
  - Admin redeem/trừ điểm.
  - `addPointsFromBooking(...)`.
- Notification:
  - Có notification create/list/unread/read.

### Vẫn thiếu/chưa rõ

- Chưa thấy `ReviewController`.
- Chưa thấy `ReviewService`.
- Chưa thấy API user tạo/cập nhật review sau check-in.
- Chưa thấy API public list review theo movie.
- Chưa thấy API admin hide/moderate review.
- Chưa thấy movie rating aggregation service.
- Chưa thấy tự gửi notification sau review.
- Chưa thấy quy đổi điểm sang promotion/mã giảm giá.

### Trạng thái mới

**Có nền tảng và một phần recommendation/loyalty, nhưng chưa hoàn thành luồng review end-to-end.**

## 3.5 Payment

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- Strategy Pattern đa nhà cung cấp.
- Mock payment.
- Callback/webhook idempotent.
- Xác thực chữ ký chi tiết.
- Refund foundation gắn payment provider.

### Project hiện tại đã có

- Payment provider enum:
  - `MOCK`
  - `VNPAY`
  - `MOMO`
- VNPay:
  - Create payment URL.
  - Verify signature.
  - Return handler.
  - IPN handler.
- Mock:
  - `POST /api/v1/payments/mock`
- Idempotency guard cơ bản:
  - IPN nếu payment đã `SUCCESS` trả `"Order already confirmed"`.
  - `confirmPayment` bỏ qua nếu payment đã `SUCCESS`.
- Payment status:
  - `PENDING`
  - `SUCCESS`
  - `FAILED`
  - `REFUNDED`
- Payment lookup theo booking.

### Vẫn thiếu/chưa rõ

- Chưa thấy MoMo controller/service/handler thật.
- Chưa thấy Strategy Pattern tách provider đầy đủ; hiện service xử lý trực tiếp VNPay/mock.
- Refund provider-level chưa rõ; `Payment.refund()` có nhưng chưa thấy flow gọi provider refund.
- Refund status chưa có các trạng thái `REQUESTED`, `PROCESSING`.

### Trạng thái mới

**Có phần chính cho VNPay/mock và idempotency cơ bản; chưa hoàn thành payment đa provider/strategy/refund nâng cao.**

## 3.6 Promotion, wishlist, loyalty, notification

### Trong file luồng nghiệp vụ từng ghi còn thiếu

- User theo dõi phim.
- Thông báo mở bán/suất chiếu mới.
- Tích điểm sau booking thanh toán/check-in.
- Cộng điểm theo tiền vé/F&B hoặc theo số vé.
- Dùng điểm đổi promotion/mã giảm giá.
- Rule điểm kết hợp coupon.

### Project hiện tại đã có

- Promotion:
  - Public get by code.
  - Apply.
  - Remove.
  - Validate/preview.
  - Admin create/update/delete/list/get.
- Wishlist:
  - Add movie.
  - Get my wishlist.
  - Remove movie.
- Loyalty:
  - Get my points.
  - Admin add.
  - Admin redeem.
  - Add points from booking.
- Notification:
  - Create notification for user.
  - Get my notifications.
  - Get unread.
  - Mark read.

### Vẫn thiếu/chưa rõ

- Chưa thấy tự động notify khi phim wishlist mở bán/suất chiếu mới.
- Chưa thấy point-to-promotion exchange.
- Chưa thấy rule promotion kết hợp/không kết hợp với point.
- Chưa thấy cấu hình "mỗi vé = 10 point" hoặc "100 điểm = 1 vé" như business rule cố định.
- Chưa thấy notification tự động sau payment/check-in/review.

### Trạng thái mới

**Có phần chính, nhưng còn thiếu các rule nâng cao giữa point-promotion-notification.**

## 3.7 Personalized recommendation

### Trong file luồng nghiệp vụ từng ghi thiếu

- Trailer behavior.
- Ticket history.
- Review.
- Favorite actor.
- Cohort filtering.
- Không đưa full movie vào AI.

### Project hiện tại đã có

- Trailer interaction:
  - Record trailer interaction.
  - Validate watched seconds.
  - Interaction types: click/complete/skip...
- Preference profile:
  - Refresh profile.
  - Get my profile.
- Signals:
  - Trailer signals.
  - Booking signals.
  - Review signals.
  - Movie feature scores.
- Recommendation:
  - Recommend movies.
  - Recommend by favorite actors.
  - Admin debug recommendation.
- Có entity:
  - `TrailerInteraction`
  - `UserPreferenceProfile`
  - `UserCohortPreference`

### Vẫn thiếu/chưa rõ

- Cohort analysis service chuyên sâu chưa thấy rõ dù có entity.
- Review sentiment NLP chưa thấy; hiện dùng rating/review status làm signal.
- Chưa thấy report hiệu quả recommendation.

### Trạng thái mới

**Đã có nhiều và đủ dùng ở mức rule-based/mock personalized recommendation.** Còn thiếu cohort/report/sentiment nâng cao.

## 3.8 Single cinema, room, seat

### Trong file luồng nghiệp vụ từng ghi thiếu

- Một rạp duy nhất.
- Chặn rạp thứ hai.
- Tạo/cập nhật rạp.
- Tạo phòng.
- Sinh sơ đồ ghế.
- Layout ghế lệch.
- Cập nhật trạng thái ghế/phòng.

### Project hiện tại đã có

- Cinema singleton/single-cinema trong `CinemaService`.
- Public/admin cinema APIs.
- Room CRUD/status.
- Seat generation.
- Replace seat layout.
- Seat row/layout support.
- Update/delete seat.
- Public room/cinema APIs.

### Vẫn thiếu/chưa rõ

- Không thấy thiếu lớn ở nghiệp vụ single cinema/room/seat.

### Trạng thái mới

**Đã có khá đầy đủ.**

## 3.9 Giá vé, loại vé, combo vé, kiểm tra tuổi

### Trong file luồng nghiệp vụ từng ghi thiếu

- ADULT/CHILD/SENIOR/STUDENT.
- Rule giá từng loại vé.
- Giá theo ngày thường/cuối tuần/ngày lễ/loại phòng/suất chiếu.
- Combo vé.
- Kiểm tra tuổi người xem.

### Project hiện tại đã có

- `TicketType`:
  - `ADULT`
  - `CHILD`
  - `STUDENT`
- Không có `SENIOR`; thậm chí `TicketPricingSchemaCleanup` có logic xóa support `SENIOR`.
- `TicketPricingRule` theo:
  - ticket type.
  - room type.
  - seat type.
  - weekend.
  - holiday.
  - active.
- `TicketCombo`.
- Validate:
  - ticket type theo tuổi.
  - movie age rating theo tuổi.
  - seat type.
  - combo counts.
  - total ticket quantity khớp held seats.
- Showtime có matrix giá theo ticket/seat type.

### Vẫn thiếu/chưa rõ

- Nếu business bắt buộc `SENIOR`, project hiện chưa hỗ trợ.
- Ticket combo pricing đang có cảnh báo trong `TicketPricingService`: "Ticket combo pricing is disabled. Use food combos from the food API only." Cần kiểm tra lại nếu muốn combo vé giảm giá thực sự.

### Trạng thái mới

**Đã có khá nhiều**, nhưng thiếu `SENIOR` và cần xác nhận lại discount logic cho combo vé.

## 3.10 Hủy suất, sự cố vận hành, hoàn tiền hoặc đổi suất

### Trong file luồng nghiệp vụ từng ghi thiếu

- Suất bị hủy do cúp điện/sự cố.
- Booking cần hoàn tiền hoặc đổi suất.
- Staff/admin tạo luồng refund.
- Refund khi suất bị hủy.
- Đổi suất cho khách.

### Project hiện tại đã có

- Admin update showtime status sang `CANCELLED`.
- Khi showtime bị cancel:
  - `HOLDING` / `PENDING_PAYMENT` booking -> `CANCELLED`.
  - `PAID` booking -> `REFUND_REQUESTED`.
  - `REFUND_REQUESTED` giữ nguyên.
  - Terminal bookings bị bỏ qua.
- User/admin có refund request.
- Admin mark refunded.

### Vẫn thiếu/chưa rõ

- Chưa thấy luồng đổi suất.
- Chưa thấy reason cụ thể như cúp điện/sự cố vận hành ngoài default admin cancel.
- Chưa thấy provider-level refund tự động.

### Trạng thái mới

**Có phần refund khi hủy suất khá tốt**, thiếu đổi suất và refund tự động qua provider.

## 3.11 Staff, audit, reports

### Trong file luồng nghiệp vụ từng ghi thiếu

- Quản lý nhân viên.
- Quản lý ca làm.
- Audit log.
- Báo cáo doanh thu, occupancy, hiệu quả phim, chênh lệch AI-review.

### Project hiện tại đã có

- Staff:
  - `StaffProfile`.
  - `StaffShift`.
  - `StaffStatus`.
  - `StaffProfileRepository`.
  - `StaffShiftRepository`.
  - Staff/Admin check-in API.
- Audit:
  - `AuditLog`.
  - `AuditActionType`.
  - `AuditLogRepository`.

### Vẫn thiếu/chưa rõ

- Chưa thấy StaffController/AdminStaffController.
- Chưa thấy API quản lý nhân viên.
- Chưa thấy API quản lý ca làm.
- Chưa thấy AuditLogService/controller.
- Chưa thấy dashboard/revenue/occupancy/movie performance/recommendation effectiveness report APIs.

### Trạng thái mới

**Có nền tảng dữ liệu và check-in staff, nhưng Phase 10 nên ưu tiên Staff Operations/Audit/Reports: scan/check-in vé đầy đủ, confirm combo pickup, audit admin action và basic reports.**

## 3.12 Email Ticket & Realtime Seat Updates

### Trong file luồng nghiệp vụ từng ghi thiếu

- Upload poster/trailer/file.
- Trailer metadata tracking.
- Email xác thực/reset/gửi vé/thông báo thanh toán.
- WebSocket cập nhật ghế/thông báo realtime.
- Scheduler dọn hold ghế.

### Project hiện tại đã có

- Storage/upload:
  - Cloudinary config.
  - Cloudinary upload service.
  - Admin upload image API.
  - Uploaded file metadata.
- Email:
  - Mail service.
  - Email OTP.
  - Password reset OTP.
- Scheduler:
  - Seat hold cleanup scheduler.
- Trailer tracking:
  - Trailer interaction module dùng cho recommendation.
- Dependency WebSocket có trong `pom.xml`.

### Vẫn thiếu/chưa rõ

- Chưa thấy WebSocket config/controller/event publisher.
- Chưa thấy realtime seat update.
- Chưa thấy gửi vé qua email.
- Notification user/admin realtime là optional sau email vé và realtime seat status.

### Trạng thái mới

**Có upload/email OTP/scheduler/trailer tracking, Phase 11 nên ưu tiên email vé sau thanh toán và WebSocket realtime seat status.**

## 3.13 API Contract & QA Readiness

### Trạng thái

Không đánh giá bằng code vì không quét `src/test`.

### Project hiện tại có

- Tài liệu API/Postman trong thư mục `api`.
- API docs theo phase 0-6.
- Post-response scripts.

### Vẫn thiếu/chưa rõ

- Không xác nhận integration tests.
- Không xác nhận E2E smoke flow.
- Không xác nhận payment/security test.

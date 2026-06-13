# Tiến độ theo CineAI_Project_Documentation.docx

Ngày lập: 2026-06-11  
Nguồn đối chiếu: `C:\Users\quyet\Downloads\CineAI_Project_Documentation.docx`

> Theo tài liệu này, project hiện được xác định là đã hoàn thành đến **phần 4.4 - Luồng quản lý lịch chiếu (Admin)**.

## 1. Phạm vi đã hoàn thành

Project đã hoàn thành các phần từ đầu tài liệu đến hết mục **4.4**:

- `1. Tổng quan dự án`
- `2. Kiến trúc hệ thống`
- `3. Thiết kế Database`
- `4.1 Luồng AI phân tích phim [CORE]`
- `4.2 Luồng đăng ký / đăng nhập`
- `4.3 Luồng đặt vé (Booking Flow)`
- `4.4 Luồng quản lý lịch chiếu (Admin)`

## 2. Chi tiết những phần đã có đến 4.4

### 2.1 Tổng quan dự án

Đã có nền tảng backend cho hệ thống đặt vé xem phim tích hợp AI, phục vụ các nhóm người dùng chính:

- Admin / chủ rạp.
- Khán giả đã đăng nhập.
- Khách chưa đăng nhập.

Các năng lực tổng quan đã có:

- Quản lý phim.
- Quản lý lịch chiếu.
- Quản lý phòng chiếu.
- Đặt vé.
- Thanh toán.
- AI phân tích nội dung phim.
- Tài khoản người dùng và phân quyền.

### 2.2 Kiến trúc hệ thống

Đã có backend Spring Boot theo mô hình phân lớp:

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

Đã có các nhóm hạ tầng chính:

- REST API.
- JPA/Hibernate.
- JWT/Spring Security.
- OpenAPI/Swagger.
- Mail.
- Cloudinary upload.
- VNPay payment.
- AI provider strategy.

### 2.3 Database

Đã có domain model và schema/migration cho các nhóm bảng chính:

- User, role, user role.
- Movie, genre, actor.
- Cinema, room, seat, seat row.
- Showtime.
- Booking, booking seat, booking ticket.
- Payment.
- AI analysis, AI emotion segment.
- Promotion.
- Wishlist.
- Loyalty point.
- Notification.
- Uploaded file.
- Staff/audit/review entity đã có dấu vết trong source, nhưng chưa tính là hoàn thiện đầy đủ nếu chưa có API tương ứng.

## 3. Phần 4.1 đã hoàn thành - Luồng AI phân tích phim

### Đã có

- Admin yêu cầu AI phân tích phim.
- Backend tạo/lưu kết quả phân tích AI.
- Có trạng thái phân tích AI.
- Có emotion timeline/segment.
- Có content labels.
- Có luồng approve/reject kết quả AI.
- Public có thể xem analysis đã được approve.
- Có nhiều strategy AI:
  - OpenAI.
  - Gemini.
  - Mock.
- Có prompt builder và parser kết quả AI.

### API liên quan đã có

- `POST /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/movies/{movieId}/analyses`
- `GET /api/v1/admin/analyses/{analysisId}`
- `POST /api/v1/admin/analyses/{analysisId}/regenerate`
- `POST /api/v1/admin/analyses/{analysisId}/approve`
- `POST /api/v1/admin/analyses/{analysisId}/reject`
- `DELETE /api/v1/admin/analyses/{analysisId}`
- `GET /api/v1/movies/{movieId}/analysis`

## 4. Phần 4.2 đã hoàn thành - Luồng đăng ký / đăng nhập

### Đã có

- Đăng ký tài khoản.
- Xác minh email bằng OTP.
- Gửi lại OTP xác minh email.
- Đăng nhập email/password.
- Đăng nhập Google.
- Xác minh Google login bằng OTP.
- JWT access token.
- Refresh token.
- Logout/revoke refresh token.
- Quên mật khẩu/reset password bằng OTP.
- Lấy thông tin user hiện tại.
- Cập nhật profile.
- Đổi mật khẩu.
- Admin quản lý user cơ bản.

### API liên quan đã có

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

## 5. Phần 4.3 đã hoàn thành - Luồng đặt vé

### Đã có

- Chọn phim và xem chi tiết phim.
- Xem AI analysis của phim.
- Chọn suất chiếu.
- Xem sơ đồ ghế theo suất chiếu.
- Giữ ghế tạm thời.
- Tự release ghế hold hết hạn.
- Tạo booking từ booking hold.
- Gắn ticket/seat vào booking.
- Thêm F&B vào booking.
- Áp promotion/voucher.
- Tính/validate giá vé.
- Tạo payment VNPay.
- Mock payment cho luồng dev.
- Xem booking của user.
- Hủy booking.
- Gửi yêu cầu refund.
- Sinh QR ticket/booking code.
- Check-in bằng QR.

### API liên quan đã có

- `GET /api/v1/movies`
- `GET /api/v1/movies/{movieId}`
- `GET /api/v1/showtimes`
- `GET /api/v1/showtimes/{showtimeId}`
- `GET /api/v1/showtimes/{showtimeId}/seat-map`
- `POST /api/v1/bookings/hold`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings`
- `GET /api/v1/bookings/{bookingId}`
- `DELETE /api/v1/bookings/{bookingId}`
- `POST /api/v1/bookings/{bookingId}/refund-request`
- `GET /api/v1/foods/items`
- `GET /api/v1/foods/combos`
- `POST /api/v1/promotions/validate`
- `POST /api/v1/promotions/apply`
- `DELETE /api/v1/promotions/remove`
- `POST /api/v1/ticket-pricing/validate`
- `POST /api/v1/payments/vnpay/create`
- `GET /api/v1/payments/vnpay/return`
- `GET /api/v1/payments/vnpay/ipn`
- `POST /api/v1/payments/mock`
- `GET /api/v1/payments/booking/{bookingId}`
- `POST /api/v1/staff/check-in`
- `POST /api/v1/admin/check-in`

## 6. Phần 4.4 đã hoàn thành - Luồng quản lý lịch chiếu Admin

### Đã có

- Admin xem/tìm danh sách suất chiếu.
- Admin xem chi tiết suất chiếu.
- Admin xem sơ đồ ghế của suất chiếu.
- Admin tạo suất chiếu.
- Admin tạo suất chiếu hàng loạt.
- Admin cập nhật suất chiếu.
- Admin cập nhật trạng thái suất chiếu.
- Admin xóa suất chiếu.
- Admin quản lý rạp.
- Admin quản lý phòng chiếu.
- Admin sinh sơ đồ ghế.
- Admin thay toàn bộ sơ đồ ghế.
- Admin cập nhật/xóa từng ghế.
- Admin quản lý rule giá vé.
- Admin quản lý ticket combo.
- Có kiểm soát scope một rạp.
- Có seat layout/seat row.
- Có ticket price matrix theo showtime.

### API liên quan đã có

- `GET /api/v1/admin/showtimes`
- `GET /api/v1/admin/showtimes/{showtimeId}`
- `GET /api/v1/admin/showtimes/{showtimeId}/seat-map`
- `POST /api/v1/admin/showtimes`
- `POST /api/v1/admin/showtimes/bulk`
- `PUT /api/v1/admin/showtimes/{showtimeId}`
- `PATCH /api/v1/admin/showtimes/{showtimeId}/status`
- `DELETE /api/v1/admin/showtimes/{showtimeId}`
- `GET /api/v1/admin/cinema`
- `POST /api/v1/admin/cinema`
- `PUT /api/v1/admin/cinema`
- `PATCH /api/v1/admin/cinema/status`
- `DELETE /api/v1/admin/cinema`
- `GET /api/v1/admin/rooms`
- `GET /api/v1/admin/rooms/{roomId}`
- `GET /api/v1/admin/rooms/{roomId}/seats`
- `POST /api/v1/admin/rooms`
- `PUT /api/v1/admin/rooms/{roomId}`
- `PATCH /api/v1/admin/rooms/{roomId}/status`
- `POST /api/v1/admin/rooms/{roomId}/seats/generate`
- `PUT /api/v1/admin/rooms/{roomId}/seats`
- `PUT /api/v1/admin/rooms/seats/{seatId}`
- `DELETE /api/v1/admin/rooms/seats/{seatId}`
- `GET /api/v1/admin/ticket-pricing/rules`
- `POST /api/v1/admin/ticket-pricing/rules`
- `PUT /api/v1/admin/ticket-pricing/rules/{ruleId}`
- `DELETE /api/v1/admin/ticket-pricing/rules/{ruleId}`
- `GET /api/v1/admin/ticket-pricing/combos`
- `POST /api/v1/admin/ticket-pricing/combos`
- `PUT /api/v1/admin/ticket-pricing/combos/{comboId}`
- `DELETE /api/v1/admin/ticket-pricing/combos/{comboId}`

## 7. Từ phần 4.5 trở đi: chưa tính là hoàn thành theo tài liệu này

### 4.5 Luồng đánh giá & tích điểm

Theo tài liệu, phần 4.5 gồm:

- Sau khi vé có status `USED`, mở khóa đánh giá phim.
- User đánh giá phim 1-5 sao và viết nhận xét.
- Backend lưu review.
- Cập nhật điểm trung bình review của phim.
- Cộng loyalty point sau đánh giá/check-in.
- Gửi notification cảm ơn và báo điểm thưởng.

### Trạng thái hiện tại

- Loyalty point: đã có một phần.
- Notification: đã có một phần.
- Review: mới thấy entity/repository/status, chưa xác nhận API/flow đầy đủ.
- Chưa xác nhận đầy đủ luồng mở khóa review sau check-in.
- Chưa xác nhận cập nhật điểm trung bình phim từ review.
- Chưa xác nhận notification tự động sau review.

## 8. Các phần sau mục 4 trong tài liệu chưa tính là hoàn thành đầy đủ

Các phần sau 4.4 trong tài liệu vẫn cần đối chiếu/hoàn thiện riêng:

- `4.5 Luồng đánh giá & tích điểm`
- `5. API Endpoints` theo đúng endpoint naming trong tài liệu gốc.
- `6. Màn hình Frontend`
- `7. Bảo mật & Validation` ở mức checklist đầy đủ.
- `8. Kế hoạch phát triển`
- `9. Cấu hình & Deploy`
- `10. Phụ lục`

## 9. Kết luận

Theo `CineAI_Project_Documentation.docx`, project hiện được ghi nhận là đã hoàn thành đến:

> **4.4 Luồng quản lý lịch chiếu (Admin)**

Phần đã hoàn thành bao gồm:

- AI phân tích phim.
- Đăng ký/đăng nhập/JWT.
- Đặt vé, giữ ghế, F&B, voucher, payment, QR.
- Admin quản lý lịch chiếu, rạp, phòng, ghế và giá vé.

Phần chưa tính là hoàn thành đầy đủ bắt đầu từ:

> **4.5 Luồng đánh giá & tích điểm**

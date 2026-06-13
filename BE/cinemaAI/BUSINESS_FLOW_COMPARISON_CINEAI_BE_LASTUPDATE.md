# Đối chiếu luồng nghiệp vụ giữa CineAI_Project_Documentation và BE-LastUpdate

Ngày đối chiếu: 2026-06-11  
Tài liệu được kiểm tra: `C:\Users\quyet\Downloads\CineAI_Project_Documentation.docx`  
Tài liệu đối chiếu: `D:\FPTK8\SBA301\BE-LastUpdate.docx`

> Phạm vi: **chỉ xét luồng nghiệp vụ**. Không xét tech stack, package, class, entity, migration, test, deploy hay cấu trúc code.

## 1. Kết luận nhanh

Theo `BE-LastUpdate.docx` bản mới, `CineAI_Project_Documentation.docx` đã có các luồng nghiệp vụ chính:

- AI phân tích phim.
- Đăng ký / đăng nhập.
- Đặt vé.
- Quản lý lịch chiếu Admin.
- Đánh giá & tích điểm ở mức mô tả ngắn.
- Một phần payment, promotion, wishlist, loyalty, notification, dashboard/admin API.

Tuy nhiên nếu đối chiếu với các luồng nghiệp vụ trong `BE-LastUpdate.docx`, tài liệu CineAI còn thiếu hoặc chưa đủ sâu ở các mảng:

- AI gợi ý phim cá nhân hóa.
- Quản lý một rạp, phòng, ghế theo scope single-cinema.
- Cấu hình loại vé, giá vé, combo vé và kiểm tra độ tuổi.
- Khóa ghế tạm, chống trùng ghế và xử lý hold hết hạn.
- Hủy suất do sự cố/cúp điện, hoàn tiền hoặc đổi suất.
- Thanh toán/hoàn tiền đa nhà cung cấp theo Strategy Pattern.
- Quan hệ giữa điểm thành viên và promotion.
- Wishlist kèm thông báo mở bán/suất chiếu mới.
- Review ảnh hưởng đến AI preference.
- Staff operations, audit log và báo cáo vận hành cơ bản.
- Email vé và WebSocket cập nhật trạng thái ghế realtime.
- API contract/QA readiness cho toàn backend.

## 2. Các luồng nghiệp vụ CineAI đã có

### 2.1 Luồng AI phân tích phim

CineAI đã có:

- Admin vào trang quản lý phim.
- Admin thêm phim mới.
- Admin yêu cầu AI phân tích.
- Backend tạo bản ghi AI analysis.
- AI Service gọi OpenAI/Gemini.
- AI trả về JSON gồm điểm số, nhãn nội dung, tóm tắt và timeline cảm xúc.
- Backend parse và lưu kết quả.
- Admin duyệt kết quả AI.
- Khán giả xem thông tin AI sau khi kết quả được duyệt.

Đánh giá so với BE-LastUpdate:

- Luồng này có trong CineAI và được mô tả khá tốt.
- BE-LastUpdate bản mới không tách phase riêng cho AI movie analysis; BE nhấn mạnh AI personalized recommendation hơn.

### 2.2 Luồng đăng ký / đăng nhập

CineAI đã có:

- Khán giả đăng ký bằng email, mật khẩu, tên, số điện thoại.
- Backend kiểm tra email chưa tồn tại.
- Backend hash password.
- Tạo user role CUSTOMER.
- Gửi email xác nhận.
- Người dùng xác nhận tài khoản.
- Người dùng đăng nhập bằng email/password.
- Backend tạo access token và refresh token.
- Frontend gắn Bearer token vào request.
- Khi access token hết hạn, frontend gọi refresh token.

Đánh giá so với BE-LastUpdate:

- Đã bao phủ luồng auth chính của Phase 2.
- Còn thiếu hoặc chưa nói rõ các nhánh:
  - Quên mật khẩu.
  - Gửi lại xác minh email/OTP.
  - Google login.
  - Admin khóa/mở user.
  - Phân quyền STAFF trong các API vận hành.

### 2.3 Luồng đặt vé

CineAI đã có:

1. Chọn phim.
2. Xem chi tiết phim và AI analysis.
3. Chọn ngày/suất chiếu.
4. Xem sơ đồ ghế.
5. Chọn ghế.
6. Lock ghế tạm thời.
7. Thêm F&B.
8. Áp voucher.
9. Xem tổng tiền.
10. Chọn phương thức thanh toán.
11. Cổng thanh toán callback.
12. Nhận vé QR.
13. Gửi email/thông báo.

Đánh giá so với BE-LastUpdate:

- Đã có luồng booking tổng thể của Phase 6.
- Còn thiếu hoặc chưa đủ sâu:
  - Kiểm tra phim phù hợp với độ tuổi người xem.
  - Loại vé ADULT/CHILD/SENIOR/STUDENT.
  - Rule giá riêng cho từng loại vé.
  - Giá khác ngày thường/cuối tuần/ngày lễ/loại phòng/suất chiếu.
  - Combo vé như 2 vé người lớn + 1 vé trẻ em.
  - Hold ghế tự hết hạn.
  - Chống hai user đặt cùng một ghế trong cùng suất chiếu.
  - Hủy/hoàn tiền khi suất chiếu bị sự cố.
  - Đổi suất khi suất bị hủy.

### 2.4 Luồng quản lý lịch chiếu Admin

CineAI đã có:

- Admin vào trang lịch chiếu.
- Admin chọn ngày cần xếp.
- Admin chọn phim đang chiếu/sắp chiếu.
- Admin chọn phòng chiếu.
- Hệ thống kiểm tra conflict tự động.
- Admin nhập giờ bắt đầu.
- Hệ thống tính giờ kết thúc bằng thời lượng phim cộng thời gian dọn dẹp.
- Admin nhập giá vé theo loại ghế.
- Admin lưu lịch chiếu.
- Hệ thống sinh danh sách ghế từ cấu hình phòng.

Đánh giá so với BE-LastUpdate:

- Đã có luồng chính của Phase 5.
- Còn thiếu hoặc chưa đủ sâu:
  - Scope một rạp duy nhất.
  - Chặn tạo rạp thứ hai.
  - Admin tạo/cập nhật rạp.
  - Admin tạo/cập nhật phòng.
  - Admin sinh sơ đồ ghế chi tiết.
  - Trạng thái hoạt động của rạp/phòng/ghế/suất chiếu.
  - Quy tắc conflict trong cùng phòng.

### 2.5 Luồng đánh giá & tích điểm

CineAI đã có:

- Sau khi vé có status USED/check-in thành công, mở khóa đánh giá.
- Khán giả vào My Tickets để đánh giá phim.
- User chọn 1-5 sao và viết nhận xét.
- Backend lưu review.
- Cập nhật điểm trung bình review của phim.
- Cộng loyalty point.
- Gửi thông báo cảm ơn và báo điểm thưởng.

Đánh giá so với BE-LastUpdate:

- Đã có phần lõi của Phase 9 và một phần Phase 8.
- Còn thiếu hoặc chưa đủ sâu:
  - Admin ẩn đánh giá không phù hợp.
  - Dữ liệu review dùng để cập nhật sở thích AI cá nhân.
  - Ví dụ user chấm anime thấp, action cao thì tăng trọng số action.
  - Lịch sử điểm.
  - Quy đổi điểm.
  - Quan hệ điểm và promotion.

### 2.6 Luồng payment

CineAI đã có:

- User chọn VNPAY/MoMo.
- Backend tạo payment redirect URL.
- Cổng thanh toán callback về backend.
- Backend verify/cập nhật trạng thái thanh toán.
- User nhận vé sau thanh toán.

Đánh giá so với BE-LastUpdate:

- Đã có payment flow cơ bản của Phase 7.
- Còn thiếu hoặc chưa đủ sâu:
  - Kiến trúc thanh toán/hoàn tiền đa nhà cung cấp theo Strategy Pattern.
  - Mock payment cho giai đoạn đầu.
  - Callback/webhook idempotent để tránh xử lý trùng.
  - Xác thực chữ ký chi tiết.
  - Refund foundation gắn với payment provider.

### 2.7 Luồng promotion, wishlist, loyalty, notification

CineAI đã có:

- Voucher trong luồng đặt vé.
- Promotion trong admin API.
- Wishlist trong database.
- Loyalty point trong database và luồng review.
- Notification khi nhận vé/đánh giá.

Đánh giá so với BE-LastUpdate:

- Đã nhắc các nghiệp vụ chính của Phase 8.
- Còn thiếu hoặc chưa đủ sâu:
  - User theo dõi phim.
  - User nhận thông báo mở bán/suất chiếu mới.
  - Tích điểm sau booking thanh toán thành công hoặc check-in hợp lệ.
  - Cộng điểm dựa trên số tiền vé và F&B.
  - Cấu hình điểm theo số vé.
  - Dùng điểm để đổi promotion/mã giảm giá.
  - Rule điểm có được kết hợp coupon không.
  - Promotion cần bao nhiêu point, có giới hạn thời gian không.

## 3. Các luồng nghiệp vụ CineAI còn thiếu so với BE-LastUpdate

### 3.1 AI gợi ý phim cá nhân hóa

BE-LastUpdate có, CineAI chưa mô tả đủ:

- AI học sở thích người dùng từ trailer behavior.
- AI học từ lịch sử mua vé.
- AI học từ review sau khi xem.
- User xem hết trailer hành động nhưng thoát sớm trailer anime thì hệ thống tăng trọng số action.
- Hệ thống phát hiện diễn viên yêu thích nếu user xem/mua nhiều phim có cùng diễn viên.
- Phim mới của diễn viên yêu thích được recommend dù khác thể loại.
- Recommendation kết hợp:
  - Content-based filtering.
  - User cohort filtering.
- Cohort theo nhóm tuổi/năm sinh/hành vi.
- Không đưa full movie 2 tiếng vào AI, chỉ dùng metadata, genre, trailer events, ticket history, review text/rating.

### 3.2 Single cinema, room, seat

BE-LastUpdate có, CineAI chưa mô tả đủ:

- Hệ thống hiện tại quản lý một rạp.
- `Cinema` là rạp duy nhất, gom nhiều phòng.
- Nếu mở multi-cinema sau này, `Cinema` mới là chi nhánh/rạp.
- Admin tạo/cập nhật rạp duy nhất.
- Hệ thống chặn tạo rạp thứ hai.
- Admin tạo phòng.
- Admin sinh sơ đồ ghế.
- Trong cùng khung giờ, nhiều phim được chiếu nếu khác phòng.
- Chỉ cấm trùng lịch trong cùng phòng.

### 3.3 Giá vé, loại vé, combo vé, kiểm tra tuổi

BE-LastUpdate có, CineAI chưa mô tả đủ:

- Kiểm tra phim phù hợp độ tuổi người xem.
- TicketType:
  - ADULT.
  - CHILD.
  - SENIOR.
  - STUDENT.
- Mỗi loại vé có rule giá và điều kiện riêng.
- Giá khác theo:
  - Ngày thường.
  - Cuối tuần.
  - Ngày lễ.
  - Loại phòng.
  - Suất chiếu.
- Combo vé.
- Tính lại tổng tiền theo combo trước thanh toán.

### 3.4 Hủy suất, sự cố vận hành, hoàn tiền hoặc đổi suất

BE-LastUpdate có, CineAI chưa mô tả đủ:

- Suất chiếu bị hủy do cúp điện/sự cố vận hành.
- Booking chuyển sang trạng thái cần hoàn tiền hoặc đổi suất.
- Staff/admin tạo luồng refund cho khách.
- Refund khi suất bị hủy.
- Đổi suất cho khách nếu cần.

### 3.5 Point, promotion và loyalty nâng cao

BE-LastUpdate có, CineAI chưa mô tả đủ:

- Sau booking thanh toán thành công/check-in hợp lệ, hệ thống tạo `LoyaltyPoint`.
- Cộng điểm dựa trên số tiền vé và F&B.
- Có thể cấu hình mỗi vé = 10 point.
- Point dùng để đổi promotion/mã giảm giá.
- Promotion phải có rule:
  - Cần bao nhiêu point.
  - Có giới hạn thời gian không.
  - Có kết hợp coupon khác không.
- Điểm có thể dùng như discount riêng hoặc kết hợp promotion theo rule cấu hình.

### 3.6 Staff, audit, reports

BE-LastUpdate có, CineAI chưa mô tả đủ:

- Quản lý nhân viên.
- Quản lý ca làm.
- Audit log theo dõi hành động quan trọng.
- Báo cáo doanh thu.
- Báo cáo tỷ lệ lấp đầy.
- Báo cáo hiệu quả phim.
- Báo cáo độ lệch giữa điểm AI và đánh giá thật.

CineAI có dashboard/revenue API, nhưng chưa mô tả các luồng vận hành này đầy đủ.

### 3.7 Email Ticket & Realtime Seat Updates dưới góc nhìn nghiệp vụ

BE-LastUpdate có nhiều hạng mục rộng, nhưng với web đặt vé phim nên ưu tiên:

- Email vé sau thanh toán thành công.
- WebSocket cập nhật trạng thái ghế realtime.
- Notification realtime cho user/admin là optional.

### 3.8 API Contract & QA Readiness

BE-LastUpdate có, CineAI chưa mô tả đủ:

- API contract chuẩn hóa cho các module chính.
- Postman collection có thứ tự chạy rõ ràng.
- End-to-end flow:
  - Auth.
  - Movie.
  - Recommendation.
  - Showtime.
  - Booking.
  - Payment/refund.
  - Review.
  - Reports.
- Dọn Swagger.
- Chuẩn hóa API contract.
- Tạo Postman collection.
- Đóng gói chất lượng trước khi bàn giao/kết nối frontend.

## 4. Bảng tóm tắt luồng nghiệp vụ

| Luồng nghiệp vụ | CineAI đã có? | Mức độ | Cần bổ sung từ BE-LastUpdate |
| --- | --- | --- | --- |
| AI phân tích phim | Có | Khá đầy đủ | Có thể giữ làm core flow riêng |
| Đăng ký / đăng nhập | Có | Tốt ở luồng chính | Quên mật khẩu, Google login, admin user status |
| Đặt vé | Có | Có end-to-end | Age rule, ticket type, combo, hold timeout, refund/đổi suất |
| Quản lý lịch chiếu Admin | Có | Có luồng chính | Single-cinema, room/seat management, conflict chi tiết |
| Đánh giá & tích điểm | Có | Ngắn | Review ảnh hưởng AI, admin ẩn review, loyalty/promotion rule |
| Payment | Có | Cơ bản | Strategy, mock, idempotency, refund |
| Promotion/wishlist/loyalty/notification | Có một phần | Chưa đủ sâu | Wishlist notification, point exchange, promotion rule |
| AI personalized recommendation | Thiếu | Chưa đủ | Trailer behavior, ticket history, review, favorite actor, cohort |
| Staff Operations/Audit/Reports | Có rất ít | Thiếu | Staff scan/check-in vé, confirm combo pickup, audit admin action, doanh thu/vé bán/combo bán chạy |
| Email Ticket/Realtime Seat Updates | Có nhắc | Chưa thành luồng | Email vé sau thanh toán, realtime seat status; notification user/admin optional |
| API Contract/QA Readiness | Có rất ít | Thiếu | API contract, Postman collection, E2E flow, Swagger cleanup, NFR checklist |

## 5. Kết luận để generate lại phần luồng nghiệp vụ

Khi generate lại phần **luồng nghiệp vụ**, nên giữ từ CineAI:

- Luồng AI phân tích phim.
- Luồng đăng ký / đăng nhập.
- Luồng đặt vé.
- Luồng quản lý lịch chiếu Admin.
- Luồng đánh giá & tích điểm.
- Luồng API/Frontend ở mức product journey nếu cần.

Nên bổ sung từ BE-LastUpdate:

- Luồng AI gợi ý phim cá nhân hóa.
- Luồng single-cinema, phòng, ghế.
- Luồng giá vé, loại vé, combo vé, kiểm tra tuổi.
- Luồng khóa ghế, hold hết hạn và chống trùng ghế.
- Luồng hủy suất, hoàn tiền hoặc đổi suất khi sự cố.
- Luồng payment/refund đa provider và callback idempotent.
- Luồng point-promotion-loyalty nâng cao.
- Luồng wishlist và notification mở bán/suất chiếu mới.
- Luồng staff, audit, reports.
- Luồng email/WebSocket/scheduler.
- Luồng integration & QA trước bàn giao.

Trạng thái nên ghi:

> Theo luồng nghiệp vụ trong CineAI, project/tài liệu đã hoàn thành tốt đến **4.4 Luồng quản lý lịch chiếu (Admin)**. Phần **4.5 Đánh giá & tích điểm** đã có mô tả nhưng cần bổ sung thêm các nhánh review, loyalty, promotion và AI preference theo BE-LastUpdate để xem là đầy đủ.

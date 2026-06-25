# ROLE-BASED BUSINESS FLOWS

## CinemaAI / CinePremier

> Nguồn tham chiếu: `docs/SRS_CINEMA_SYSTEM_COMPLETE.md`  
> Ngày cập nhật: 16/06/2026  
> Phạm vi: mô tả luồng nghiệp vụ theo role và actor hệ thống cho mô hình một rạp duy nhất.

---

## 1. Quy ước chung

### 1.1 Role và actor

| Actor | Ý nghĩa | Ghi chú |
|---|---|---|
| `GUEST` | Người chưa đăng nhập | Chỉ được xem dữ liệu công khai. |
| `CUSTOMER` | Khách hàng đã đăng nhập | Role trong code là `CUSTOMER`, thay cho cách gọi `USER`. |
| `STAFF` | Nhân viên rạp | Chỉ vận hành check-in vé. |
| `ADMIN` | Quản trị viên | Quản trị danh mục, vận hành, tài khoản và cấu hình hệ thống. Không có quyền check-in theo nghiệp vụ. |
| `SYSTEM` | Tác vụ nền | Scheduler, callback, cộng/hoàn điểm, notification tự động. |
| `VNPAY` | Cổng thanh toán ngoài | Xử lý thanh toán return/IPN sandbox hoặc thật. |
| `SMTP` | Dịch vụ email | Gửi OTP, reset password, email vé khi triển khai. |
| `CLOUDINARY` | Dịch vụ lưu ảnh | Lưu ảnh upload của admin/customer. |

### 1.2 Ranh giới GUEST/CUSTOMER

GUEST được xem phim, thể loại, diễn viên, thông tin rạp, suất chiếu, seat map và đồ ăn công khai.

CUSTOMER bắt buộc đăng nhập trước khi:

- Hold ghế.
- Tạo booking.
- Thanh toán.
- Xem vé cá nhân.
- Thêm/xóa wishlist.
- Xem điểm loyalty.
- Gửi review.
- Nhận recommendation cá nhân hóa.

### 1.3 Quy tắc một rạp duy nhất

- Không có chọn thành phố, chi nhánh hoặc rạp khi xem lịch chiếu/đặt vé.
- Mọi phòng, ghế, suất chiếu, booking, staff và báo cáo thuộc rạp duy nhất.
- ADMIN chỉ xem, cập nhật, vô hiệu hóa hoặc kích hoạt lại rạp.
- ADMIN không tạo mới hoặc xóa rạp.

---

## 2. Ma trận quyền tổng quan

| Nhóm chức năng | GUEST | CUSTOMER | STAFF | ADMIN | SYSTEM |
|---|---:|---:|---:|---:|---:|
| Xem phim/thể loại/diễn viên | Có | Có | Có | Có | Không |
| Xem suất chiếu/seat map | Có | Có | Có | Có | Không |
| Hold ghế/tạo booking | Không | Có | Không | Không | Không |
| Thanh toán | Không | Có | Không | Không | Callback |
| Xem vé cá nhân | Không | Có | Không | Không | Không |
| Check-in QR | Không | Không | Có | Không | Không |
| Wishlist | Không | Có | Không | Không | Sự kiện thông báo chưa có |
| Loyalty | Không | Có | Không | Quản trị trực tiếp chưa có | Cộng/hoàn điểm |
| Review | Xem review công khai | Tạo/sửa review sau khi xem | Không | Ẩn/xóa review vi phạm | Tính điểm khi có service |
| Quản lý catalog | Không | Không | Không | Có | Không |
| Quản lý rạp/phòng/ghế/suất | Không | Không | Không | Có | Scheduler trạng thái suất chưa có |
| Quản lý tài khoản | Không | Hồ sơ cá nhân | Không | Có | Không |
| Cấp tài khoản STAFF | Không | Không | Không | Có | Không |
| Báo cáo | Không | Không | Không | Chưa có API thật | Tổng hợp khi triển khai |

---

## 3. Luồng GUEST

### GUEST-01: Xem danh mục phim

Liên quan SRS: `MOV-01`, `MOV-02`, `MOV-05`, `MOV-07`.

Tiền điều kiện: không cần đăng nhập.

Luồng chính:

1. GUEST mở trang chủ hoặc trang khám phá.
2. Hệ thống tải danh sách phim công khai.
3. GUEST lọc/tìm kiếm theo từ khóa, thể loại hoặc trạng thái phim.
4. GUEST mở chi tiết phim.
5. Hệ thống hiển thị thông tin phim, diễn viên, thể loại và trailer nếu có.

Ngoại lệ:

- Nếu phim inactive hoặc không tồn tại, hệ thống hiển thị lỗi hoặc trang không tìm thấy.
- Public actor filmography đang hoàn thành một phần.

Trạng thái: hoàn thành phần lõi.

### GUEST-02: Xem suất chiếu và seat map

Liên quan SRS: `SHOW-01`, `SHOW-02`, `BOOK-01`.

Tiền điều kiện: không cần đăng nhập.

Luồng chính:

1. GUEST chọn phim.
2. Hệ thống hiển thị suất chiếu công khai của rạp duy nhất.
3. GUEST chọn một suất chiếu.
4. Hệ thống tải seat map và trạng thái ghế hiện tại.
5. GUEST xem ghế trống, ghế đã hold, ghế đã bán hoặc đã check-in.

Ranh giới quyền:

- GUEST chỉ được xem.
- Khi bấm giữ ghế hoặc đặt vé, hệ thống yêu cầu đăng nhập để chuyển sang role `CUSTOMER`.

Trạng thái: hoàn thành phần xem; realtime seat map chưa có.

### GUEST-03: Đăng ký, đăng nhập và reset mật khẩu

Liên quan SRS: `AUTH-01` đến `AUTH-07`.

Luồng chính:

1. GUEST đăng ký bằng email, mật khẩu, họ tên, SĐT và năm sinh.
2. Hệ thống gửi OTP xác minh email.
3. GUEST nhập OTP.
4. Hệ thống tạo tài khoản `CUSTOMER`.
5. CUSTOMER đăng nhập bằng email/mật khẩu hoặc Google.
6. Hệ thống cấp access token và refresh token.

Ngoại lệ:

- Email/SĐT trùng: từ chối đăng ký.
- OTP sai/hết hạn: yêu cầu nhập lại hoặc gửi lại OTP.
- Quên mật khẩu: GUEST gửi yêu cầu reset và đặt mật khẩu mới bằng token/OTP.

Trạng thái: đã hoàn thành.

---

## 4. Luồng CUSTOMER

### CUSTOMER-01: Quản lý hồ sơ cá nhân

Liên quan SRS: `AUTH-08`, `AUTH-09`, `AUTH-10`.

Tiền điều kiện: CUSTOMER đã đăng nhập.

Luồng chính:

1. CUSTOMER mở trang hồ sơ.
2. Hệ thống hiển thị email, họ tên, SĐT, năm sinh, avatar và trạng thái xác minh.
3. CUSTOMER cập nhật hồ sơ hoặc upload avatar.
4. CUSTOMER có thể đổi mật khẩu bằng mật khẩu cũ và mật khẩu mới.

Ngoại lệ:

- Mật khẩu cũ sai: từ chối đổi mật khẩu.
- Avatar upload lỗi Cloudinary: giữ avatar cũ.

Trạng thái: đã hoàn thành.

### CUSTOMER-02: Hold ghế và tạo booking

Liên quan SRS: `BOOK-01` đến `BOOK-06`, `PRICE-01` đến `PRICE-04`, `FOOD-03`.

Tiền điều kiện:

- CUSTOMER đã đăng nhập.
- Suất chiếu còn mở để đặt.
- Ghế được chọn đang khả dụng.

Luồng chính:

1. CUSTOMER chọn phim và suất chiếu.
2. Hệ thống tải seat map.
3. CUSTOMER chọn một hoặc nhiều ghế.
4. Hệ thống hold ghế trong 2 phút.
5. CUSTOMER chọn loại vé, nhập tuổi người xem nếu cần.
6. Hệ thống kiểm tra age rating và loại vé.
7. CUSTOMER chọn đồ ăn/combo nếu muốn.
8. Hệ thống tính tổng tiền.
9. CUSTOMER xác nhận để tạo booking từ hold.

Ngoại lệ:

- Ghế đã bị hold/bán/check-in: hệ thống từ chối.
- Hold hết hạn: ghế được giải phóng.
- Tuổi không phù hợp age rating: không cho tiếp tục.
- Chưa có database lock tuyệt đối: còn rủi ro double booking khi request đồng thời.

Trạng thái: hoàn thành phần lõi; cần bổ sung khóa DB chống giữ ghế đồng thời.

### CUSTOMER-03: Thanh toán booking

Liên quan SRS: `PAY-01` đến `PAY-05`, `TICKET-01`.

Tiền điều kiện:

- Booking hợp lệ.
- Booking ở trạng thái có thể thanh toán.

Luồng chính:

1. CUSTOMER chọn thanh toán VNPay.
2. Hệ thống tạo payment record và URL thanh toán.
3. CUSTOMER được chuyển sang VNPay.
4. VNPAY trả kết quả qua return/IPN.
5. Hệ thống xác minh chữ ký, số tiền và idempotency.
6. Nếu thành công, booking chuyển `PAID`.
7. Hệ thống sinh QR cho booking.
8. CUSTOMER xem vé trong trang vé cá nhân.

Ngoại lệ:

- Thanh toán thất bại: payment `FAILED`, booking chưa thành vé hợp lệ.
- Callback lặp: hệ thống không xử lý trùng.
- Mock payment chỉ dùng dev/demo và phải được bảo vệ trước production.

Trạng thái: hoàn thành phần lõi.

### CUSTOMER-04: Xem vé và lịch sử booking

Liên quan SRS: `BOOK-07`, `TICKET-01`.

Tiền điều kiện: CUSTOMER đã đăng nhập.

Luồng chính:

1. CUSTOMER mở trang vé của tôi.
2. Hệ thống tải danh sách booking cá nhân.
3. CUSTOMER xem chi tiết booking, ghế, đồ ăn, tổng tiền, trạng thái và QR nếu đã thanh toán.

Ngoại lệ:

- Booking chưa thanh toán: không sinh QR hợp lệ.
- Booking đã được hoàn tiền do hủy suất/cancel/expire: hiển thị trạng thái tương ứng.

Trạng thái: đã hoàn thành.

### CUSTOMER-05: Hủy booking trước thanh toán

Liên quan SRS: `BOOK-08`.

Tiền điều kiện: CUSTOMER sở hữu booking.

Luồng hủy booking:

1. Nếu booking ở `HOLDING` hoặc `PENDING_PAYMENT`, CUSTOMER có thể hủy khi còn hợp lệ.
2. Hệ thống chuyển booking sang `CANCELLED` và giải phóng ghế.

Không hợp lệ:

- Booking `PAID` không được hủy hoặc yêu cầu hoàn tiền từ phía CUSTOMER.
- Booking `USED`, `REFUNDED`, `CANCELLED`, `EXPIRED` không được hủy lại.
- Vé đã thanh toán là vé đã bán ra; hệ thống không hỗ trợ hoàn tiền theo yêu cầu khách hàng sau khi mua vé.

Trạng thái: đã hoàn thành BE rule + FE nút hủy trước thanh toán trong Vé của tôi.


### CUSTOMER-06: Wishlist

Liên quan SRS: `WISH-01`, `WISH-02`.

Tiền điều kiện: CUSTOMER đã đăng nhập.

Luồng chính:

1. CUSTOMER thêm phim vào wishlist.
2. Hệ thống lưu phim yêu thích.
3. CUSTOMER xem hoặc xóa phim khỏi wishlist.


Trạng thái: thêm/xóa/xem đã hoàn thành.

### CUSTOMER-07: Loyalty

Liên quan SRS: `LOY-01` đến `LOY-05`.

Tiền điều kiện: CUSTOMER có booking thanh toán thành công.

Luồng cộng điểm:

1. Mỗi phim cấu hình số điểm cộng trên một ghế/vé.
2. Khi booking thanh toán thành công, SYSTEM tính điểm bằng điểm của phim nhân với số ghế hợp lệ.
3. Điểm được cộng vào tài khoản CUSTOMER.
4. Điểm tồn tại vĩnh viễn.

Luồng đổi điểm:

1. CUSTOMER dùng điểm khi thanh toán.
2. Tỷ lệ đổi là `1000 điểm = 1.000 VND`.
3. Hệ thống trừ điểm và giảm số tiền thanh toán tương ứng.

Luồng thu hồi/hoàn điểm khi rạp hủy suất:

1. Khi booking được hoàn tiền do ADMIN hủy suất, SYSTEM hoàn lại/trừ phần điểm đã cộng hoặc đã sử dụng theo ledger.
2. Cần lịch sử giao dịch điểm chi tiết để xử lý chính xác.

Trạng thái: hoàn thành một phần; đổi điểm và ledger hoàn điểm chưa hoàn chỉnh.

### CUSTOMER-08: Review phim

Liên quan SRS: `REV-01` đến `REV-05`.

Tiền điều kiện:

- CUSTOMER đã có booking `USED` của phim đó.
- Mỗi CUSTOMER chỉ có một review cho mỗi phim.

Luồng chính:

1. CUSTOMER mở phim đã xem.
2. CUSTOMER nhập rating và nội dung review.
3. Hệ thống lưu review ở trạng thái công khai/đã chấp nhận tự động.
4. Review được hiển thị công khai ngay và tính vào điểm trung bình phim.
5. ADMIN có thể ẩn hoặc xóa review vi phạm sau khi review đã được đăng.

Trạng thái: chưa thực hiện.

### CUSTOMER-09: Recommendation cá nhân hóa

Liên quan SRS: `REC-01` đến `REC-04`, `MOV-09`.

Tiền điều kiện: CUSTOMER đã đăng nhập.

Luồng chính:

1. CUSTOMER xem trailer, booking hoặc review phim.
2. Hệ thống ghi nhận tín hiệu sở thích.
3. CUSTOMER yêu cầu refresh hồ sơ sở thích.
4. Hệ thống trả danh sách phim gợi ý hoặc gợi ý theo diễn viên yêu thích.

Trạng thái: BE có nền tảng; FE tích hợp chưa rõ.

---

## 5. Luồng STAFF

### STAFF-01: Đăng nhập tài khoản STAFF

Liên quan SRS: `AUTH-03`, `AUTH-12`.

Tiền điều kiện:

- ADMIN đã cấp tài khoản STAFF.
- Tài khoản STAFF ở trạng thái active.

Luồng chính:

1. STAFF đăng nhập bằng email và mật khẩu được cấp.
2. Hệ thống xác thực role `STAFF`.
3. STAFF truy cập màn hình check-in.

Ghi chú:

- AUTH-12 hiện chỉ cấp tài khoản đăng nhập STAFF.
- Quản lý hồ sơ nhân viên cơ bản thuộc `OPS-03` và đã có API/UI.
- Nên bổ sung chính sách bắt buộc đổi mật khẩu lần đầu trong tương lai.

Trạng thái: cấp tài khoản và staff profile cơ bản đã hoàn thành.

### STAFF-02: Check-in booking bằng QR

Liên quan SRS: `TICKET-03`, `TICKET-04`, `OPS-01`.

Tiền điều kiện:

- STAFF đã đăng nhập.
- Booking đã thanh toán (`PAID`).
- QR thuộc booking hợp lệ.

Luồng chính:

1. STAFF mở màn hình check-in.
2. STAFF quét hoặc nhập QR booking.
3. Hệ thống xác thực QR.
4. Hệ thống kiểm tra booking đã thanh toán, chưa check-in và chưa bị hoàn tiền do hủy suất/cancel.
5. Hệ thống chuyển booking sang `USED`.
6. Hệ thống ghi nhận thời điểm check-in.

Không hợp lệ:

- QR sai hoặc không tồn tại.
- Booking chưa thanh toán.
- Booking đã check-in.
- Booking đã cancel/được hoàn tiền do hủy suất/expire.

Phạm vi hiện tại:

- QR gắn với booking, một lần quét xác nhận toàn bộ booking.
- Nếu cần check-in từng vé/ghế riêng lẻ, phải bổ sung QR và trạng thái riêng cho từng vé.

Trạng thái: đã hoàn thành với API thật cho role `STAFF`.

### STAFF-03: Tra cứu booking thủ công

Liên quan SRS: `TICKET-05`, `OPS-02`.

Tiền điều kiện: STAFF đã đăng nhập.

Luồng chính:

1. STAFF nhập booking code hoặc QR.
2. Hệ thống trả booking phù hợp.
3. STAFF xem trạng thái thanh toán/check-in.
4. STAFF check-in booking hợp lệ.

Phạm vi hiện tại:

- Đã có tra cứu theo booking code hoặc QR.
- Đã có danh sách booking theo suất chiếu cho STAFF bằng `showtimeId`.

Trạng thái: hoàn thành tra cứu thủ công theo mã/QR và xem danh sách theo suất chiếu.

---

## 6. Luồng ADMIN

### ADMIN-01: Quản lý tài khoản CUSTOMER/STAFF

Liên quan SRS: `AUTH-11`, `AUTH-12`, `OPS-03`.

Tiền điều kiện: ADMIN đã đăng nhập.

Luồng xem và khóa/mở tài khoản:

1. ADMIN mở quản lý người dùng.
2. Hệ thống hiển thị danh sách tài khoản.
3. ADMIN xem chi tiết tài khoản.
4. ADMIN chuyển trạng thái tài khoản sang active/disabled theo quy tắc.

Quy tắc bảo vệ:

- ADMIN không được tự khóa chính mình.
- Hệ thống nên chặn khóa admin cuối cùng.

Luồng cấp tài khoản STAFF:

1. ADMIN nhập email, mật khẩu, họ tên, SĐT và năm sinh.
2. Hệ thống kiểm tra trùng email/SĐT.
3. Hệ thống tạo tài khoản active, xác minh email và gán role `STAFF`.
4. STAFF có thể đăng nhập ngay.

Luồng staff profile cơ bản cần bổ sung:

1. ADMIN tạo/cập nhật mã nhân viên, vị trí, SĐT, trạng thái và rạp duy nhất.
2. ADMIN vô hiệu hóa/kích hoạt hồ sơ nhân viên.

Trạng thái: AUTH-11/AUTH-12 và staff profile cơ bản đã hoàn thành.

### ADMIN-02: Quản lý phim, thể loại và diễn viên

Liên quan SRS: `MOV-03`, `MOV-04`, `MOV-06`, `MOV-08`, `UP-01`.

Luồng chính:

1. ADMIN tạo/cập nhật/xóa hoặc đổi trạng thái phim.
2. ADMIN quản lý thể loại.
3. ADMIN quản lý diễn viên.
4. ADMIN gán thể loại và diễn viên chính cho phim.
5. ADMIN upload ảnh poster/banner/avatar qua Cloudinary.

Trạng thái: đã hoàn thành phần lõi.

### ADMIN-03: Quản lý rạp duy nhất

Liên quan SRS: `CIN-01` đến `CIN-06`.

Luồng chính:

1. ADMIN xem thông tin rạp duy nhất.
2. ADMIN cập nhật tên, địa chỉ, thành phố, SĐT hoặc trạng thái.
3. ADMIN có thể vô hiệu hóa hoặc kích hoạt lại rạp.

Không được phép:

- Tạo rạp mới.
- Xóa rạp.
- Chuyển dữ liệu giữa nhiều rạp.

Trạng thái: đã hoàn thành.

### ADMIN-04: Quản lý phòng và ghế

Liên quan SRS: `CIN-07` đến `CIN-11`.

Luồng chính:

1. ADMIN tạo/cập nhật phòng.
2. ADMIN sinh sơ đồ ghế theo hàng/cột.
3. ADMIN thay thế layout ghế.
4. ADMIN cập nhật hoặc vô hiệu hóa ghế riêng lẻ.

Ngoại lệ:

- Không được sửa layout nếu có suất hoặc booking đang hoạt động.

Trạng thái: đã hoàn thành.

### ADMIN-05: Quản lý suất chiếu

Liên quan SRS: `SHOW-03` đến `SHOW-08`, `PRICE-05`.

Luồng tạo/cập nhật:

1. ADMIN chọn phim, phòng, thời gian, trạng thái và cấu hình giá.
2. Hệ thống kiểm tra xung đột phòng/thời gian.
3. Hệ thống tạo suất chiếu đơn hoặc bulk.
4. ADMIN cập nhật suất chiếu khi cần.

Luồng hủy suất do sự cố rạp:

1. ADMIN yêu cầu hủy suất.
2. ADMIN nhập lý do sự cố vận hành, ví dụ lỗi kỹ thuật, mất điện, sự cố phòng chiếu hoặc lịch chiếu bắt buộc phải dừng.
3. Hệ thống chuyển suất sang `CANCELLED`.
4. Nếu suất đã bán vé, hệ thống tự động chuyển các booking hợp lệ sang `REFUNDED`, hoàn tiền vào wallet của CUSTOMER, thu hồi/trừ loyalty đã cộng từ booking đó và gửi notification cho khách.
5. Nếu suất chưa bán vé, hệ thống chỉ chuyển trạng thái suất và không phát sinh refund.

Không thuộc STAFF:

- STAFF không xử lý hủy suất.
- STAFF không xử lý hoàn tiền do hủy suất.

Trạng thái: cần đồng bộ code để hủy suất có booking tự động refund vào wallet, thu hồi loyalty và gửi notification.

### ADMIN-06: Quản lý đồ ăn và combo

Liên quan SRS: `FOOD-01` đến `FOOD-04`.

Luồng chính:

1. ADMIN tạo/cập nhật món ăn.
2. ADMIN tạo/cập nhật combo.
3. ADMIN đổi trạng thái active/inactive/out-of-stock.

Chưa có:

- Quản lý tồn kho thực tế.

Trạng thái: CRUD đã hoàn thành.

### ADMIN-07: Quản lý booking và hoàn tiền do hủy suất

Liên quan SRS: `BOOK-08`, `PAY-07`, `PAY-08`, `PAY-10`, `SHOW-06`, `SHOW-07`.

Luồng chính:

1. ADMIN xem booking/giao dịch.
2. CUSTOMER không có luồng gửi yêu cầu refund sau khi đã thanh toán.
3. Khi rạp có sự cố, ADMIN hủy suất chiếu từ màn hình quản lý suất.
4. SYSTEM tự động hoàn tiền vào wallet của CUSTOMER cho các booking đã thanh toán của suất bị hủy.
5. SYSTEM thu hồi/trừ loyalty đã cộng từ booking và gửi notification cho CUSTOMER.

Chưa có:

- Đối soát thanh toán đầy đủ.
- Wallet/ledger hoàn tiền do hủy suất.
- Notification tự động cho khách khi suất bị hủy.

Trạng thái: cần đồng bộ code/UI theo nghiệp vụ mới.

### ADMIN-08: Review moderation

Liên quan SRS: `REV-03`.

Luồng mong muốn:

1. ADMIN xem danh sách review đã được user đăng.
2. ADMIN ẩn hoặc xóa review vi phạm nội quy.
3. Hệ thống không yêu cầu ADMIN duyệt review trước khi hiển thị.
4. Hệ thống chỉ hiển thị review chưa bị ẩn/xóa và tính lại điểm trung bình phim theo các review công khai.

Trạng thái: chưa thực hiện.

### ADMIN-09: Báo cáo

Liên quan SRS: `RPT-01` đến `RPT-05`.

Luồng mong muốn:

1. ADMIN chọn khoảng thời gian.
2. Hệ thống thống kê doanh thu rạp duy nhất.
3. Hệ thống thống kê vé bán, phim bán chạy, suất chiếu và tỷ lệ lấp đầy.
4. ADMIN export báo cáo nếu cần.

Không có:

- Báo cáo theo nhiều thành phố/rạp.

Trạng thái: report API chưa thực hiện.

---

## 7. Luồng SYSTEM

### SYSTEM-01: Giải phóng hold hết hạn

Liên quan SRS: `BOOK-09`, `NFR-PERF-02`.

Luồng chính:

1. Scheduler tìm các hold quá hạn.
2. Hệ thống chuyển booking/seat hold hết hạn sang `EXPIRED` hoặc `RELEASED`.
3. Ghế trở lại trạng thái có thể đặt.

Trạng thái: đã có scheduler; cần batch/paging/lock phân tán cho production.

### SYSTEM-02: Cập nhật trạng thái suất chiếu

Liên quan SRS: `SHOW-08`.

Luồng mong muốn:

1. SYSTEM chuyển `SCHEDULED` sang `OPEN` khi đến thời điểm mở bán/vận hành.
2. SYSTEM chuyển `OPEN` sang `COMPLETED` khi suất kết thúc.
3. SYSTEM bỏ qua suất `CANCELLED`.

Trạng thái: chưa thực hiện.

### SYSTEM-03: Xử lý callback thanh toán

Liên quan SRS: `PAY-02`, `PAY-03`, `PAY-04`.

Luồng chính:

1. VNPAY gửi return/IPN.
2. SYSTEM xác minh chữ ký và số tiền.
3. SYSTEM kiểm tra callback đã xử lý chưa.
4. SYSTEM cập nhật payment và booking.
5. SYSTEM sinh QR và cộng điểm loyalty nếu thành công.

Trạng thái: đã hoàn thành phần lõi.

### SYSTEM-04: Loyalty ledger

Liên quan SRS: `LOY-01` đến `LOY-05`.

Luồng mong muốn:

1. Khi booking `PAID`, SYSTEM cộng điểm theo phim và số ghế.
2. Khi CUSTOMER đổi điểm, SYSTEM ghi ledger trừ điểm.
3. Khi booking được hoàn tiền do ADMIN hủy suất chiếu, SYSTEM thu hồi/trừ điểm đã phát sinh từ booking đó.
4. Điểm không hết hạn.

Trạng thái: cần ledger chi tiết.

### SYSTEM-05: Notification tự động

Liên quan SRS: `NOTI-03`, `WISH-02`.

Luồng mong muốn:

1. Khi thanh toán thành công, SYSTEM tạo notification vé.
2. Khi booking bị hủy trước thanh toán hoặc được hoàn tiền do suất chiếu bị ADMIN hủy, SYSTEM tạo notification trạng thái.
3. Khi phim trong wishlist có suất mới, SYSTEM thông báo cho CUSTOMER.
4. Nếu WebSocket được triển khai, thông báo được đẩy realtime.

Trạng thái: chưa hoàn chỉnh.

---

## 8. Luồng dịch vụ ngoài

### VNPAY-01: Thanh toán

Actor: `VNPAY`, `SYSTEM`, `CUSTOMER`.

1. SYSTEM tạo URL thanh toán.
2. CUSTOMER thanh toán trên VNPay.
3. VNPAY trả kết quả qua return/IPN.
4. SYSTEM xác minh và cập nhật booking.

Trạng thái: đã hoàn thành sandbox/core.

### WALLET-01: Hoàn tiền do hủy suất

Actor: `SYSTEM`, `ADMIN`, `CUSTOMER`.

1. ADMIN hủy suất chiếu do sự cố từ rạp.
2. SYSTEM xác định các booking đã thanh toán của suất bị hủy.
3. SYSTEM hoàn tiền vào wallet của CUSTOMER theo số tiền booking đã thanh toán.
4. SYSTEM cập nhật booking `REFUNDED`, thu hồi/trừ loyalty đã cộng và gửi notification cho khách.

Trạng thái: cần triển khai wallet/ledger và notification tự động.

### SMTP-01: Email xác thực và vé

Actor: `SMTP`, `SYSTEM`.

Đã có:

- Gửi OTP email.
- Reset password.

Chưa có:

- Gửi vé QR qua email sau thanh toán.

### CLOUDINARY-01: Upload ảnh

Actor: `CLOUDINARY`, `ADMIN`, `CUSTOMER`.

Đã có:

- ADMIN upload ảnh phim/diễn viên.
- CUSTOMER upload avatar.

Chưa có:

- UI quản lý file upload.
- Xóa file và xóa trên Cloudinary.

## 9. Điểm cần đồng bộ code với nghiệp vụ

1. **Refund:** bỏ luồng CUSTOMER yêu cầu refund sau khi mua vé; chỉ hoàn tiền tự động vào wallet khi ADMIN hủy suất do sự cố rạp.
2. **Loyalty:** cần ledger để cộng điểm theo ghế, đổi điểm, và thu hồi/trừ điểm khi booking được hoàn tiền do hủy suất.
3. **Review:** cần controller/service, điều kiện booking `USED`, một review mỗi CUSTOMER mỗi phim, và moderation.
4. **Promotion:** đã loại khỏi phạm vi nghiệp vụ hiện tại; nếu code còn API promotion thì không đưa vào luồng bàn giao.
5. **Hủy suất:** cần cho phép ADMIN hủy suất do sự cố kể cả khi đã bán vé; hệ thống tự notification, hoàn tiền vào wallet và thu hồi loyalty.

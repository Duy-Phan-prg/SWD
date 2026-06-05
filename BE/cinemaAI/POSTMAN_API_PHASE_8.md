Promotion

01 - Admin Create Promotion
POST /api/v1/admin/promotions
Admin tạo mã khuyến mãi mới.
Body:
{
  "code": "SUMMER2026",
  "name": "Summer Sale",
  "type": "PERCENTAGE",
  "value": 15,
  "minOrderAmount": 100000,
  "maxDiscountAmount": 50000,
  "usageLimit": 100,
  "startsAt": "2026-06-01T00:00:00",
  "endsAt": "2026-06-30T23:59:59"
}

02 - Admin Update Promotion
PUT /api/v1/admin/promotions/{id}
Admin cập nhật promotion theo id.
Body:
{
  "name": "Summer Sale Updated",
  "type": "PERCENTAGE",
  "value": 20,
  "minOrderAmount": 150000,
  "maxDiscountAmount": 60000,
  "usageLimit": 150,
  "startsAt": "2026-06-01T00:00:00",
  "endsAt": "2026-07-05T23:59:59",
  "status": "ACTIVE"
}

03 - Admin Delete Promotion
DELETE /api/v1/admin/promotions/{id}
Admin xóa promotion.

04 - Admin List Promotions
GET /api/v1/admin/promotions?page=0&size=20
Admin xem danh sách promotion.

05 - Admin Get Promotion By Code
GET /api/v1/admin/promotions/{code}
Admin xem chi tiết promotion theo code.

06 - Get Promotion By Code
GET /api/v1/promotions/{code}
Public/customer xem promotion theo code.

07 - Apply Promotion To Booking
POST /api/v1/promotions/apply?bookingId=1&code=SUMMER2026
Áp mã giảm giá vào booking.

08 - Remove Promotion From Booking
DELETE /api/v1/promotions/remove?bookingId=1
Gỡ promotion khỏi booking.

09 - Validate/Preview Promotion
POST /api/v1/promotions/validate
Kiểm tra điều kiện promotion (không apply).
Body:
{
  "code": "SUMMER2026",
  "orderAmount": 200000
}

Wishlist

10 - Add Movie To Wishlist
POST /api/v1/wishlist
Thêm phim vào wishlist của user hiện tại.
Body:
{
  "movieId": 1
}

11 - Get My Wishlist
GET /api/v1/wishlist
Xem danh sách wishlist của user hiện tại.

12 - Remove Movie From Wishlist
DELETE /api/v1/wishlist/{movieId}
Xóa phim khỏi wishlist của user hiện tại.

Loyalty

13 - Get My Loyalty Points
GET /api/v1/loyalty/me
Xem điểm loyalty của user hiện tại.

14 - Admin Add Loyalty Points
POST /api/v1/admin/loyalty/add
Admin cộng điểm cho user.
Body:
{
  "userId": 1,
  "points": 10,
  "reason": "Compensation"
}

15 - Admin Redeem Loyalty Points
POST /api/v1/admin/loyalty/{userId}/redeem?points=5
Admin trừ điểm của user.

Notification

16 - Admin Create Notification
POST /api/v1/notifications
Admin tạo thông báo cho user.
Body:
{
  "userId": 1,
  "title": "Phim mới sắp chiếu",
  "message": "Avatar 3 mở bán vé từ 01/06",
  "type": "SHOWTIME"
}

17 - Get My Notifications
GET /api/v1/notifications/me
User xem thông báo của mình.

18 - Get My Unread Notifications
GET /api/v1/notifications/me/unread
User xem thông báo chưa đọc.

19 - Mark Notification As Read
PATCH /api/v1/notifications/{id}/read
User đánh dấu thông báo đã đọc.


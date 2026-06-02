# Phase 5 - Một rạp, phòng chiếu, ghế, suất chiếu và giá vé

## 1. Tạo rạp

### Tên mô tả API
Admin tạo rạp chính của hệ thống. Scope hiện tại là một rạp, nên khi đã có rạp trong hệ thống thì tạo rạp thứ hai sẽ bị conflict.

### API
```http
POST /api/v1/admin/cinemas
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "name": "CinemaAI Main",
  "address": "123 Nguyễn Trãi",
  "city": "Hồ Chí Minh",
  "phone": "0900999888",
  "status": "ACTIVE"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "CinemaAI Main",
    "address": "123 Nguyễn Trãi",
    "city": "Hồ Chí Minh",
    "phone": "0900999888",
    "status": "ACTIVE"
  },
  "message": "Cinema created successfully"
}
```

## 2. Lấy danh sách rạp public

### Tên mô tả API
Khách xem danh sách rạp đang hoạt động.

### API
```http
GET /api/v1/cinemas
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CinemaAI Main",
      "address": "123 Nguyễn Trãi",
      "city": "Hồ Chí Minh",
      "status": "ACTIVE"
    }
  ]
}
```

## 3. Tạo phòng chiếu

### Tên mô tả API
Admin tạo phòng chiếu thuộc rạp hiện tại.

### API
```http
POST /api/v1/admin/rooms
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "cinemaId": 1,
  "name": "Phòng 2D số 1",
  "roomType": "TWO_D",
  "rowCount": 3,
  "columnCount": 4,
  "status": "ACTIVE"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "cinemaId": 1,
    "name": "Phòng 2D số 1",
    "roomType": "TWO_D",
    "rowCount": 3,
    "columnCount": 4,
    "status": "ACTIVE"
  },
  "message": "Room created successfully"
}
```

## 4. Sinh sơ đồ ghế

### Tên mô tả API
Admin sinh ghế theo số hàng/cột của phòng. Nếu `overwrite=false`, hệ thống không ghi đè sơ đồ ghế đã có.

### API
```http
POST /api/v1/admin/rooms/1/seats/generate
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "seatType": "NORMAL",
  "overwrite": false
}
```

### Post-response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roomId": 1,
      "rowLabel": "A",
      "seatNumber": 1,
      "seatType": "NORMAL",
      "status": "AVAILABLE"
    }
  ]
}
```

## 5. Tạo suất chiếu

### Tên mô tả API
Admin tạo suất chiếu. Backend tự tính giờ kết thúc bằng thời lượng phim cộng thời gian dọn phòng và chặn trùng lịch trong cùng một phòng.

### API
```http
POST /api/v1/admin/showtimes
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "movieId": 1,
  "roomId": 1,
  "startTime": "2026-07-01T19:00:00",
  "basePrice": 90000,
  "status": "OPEN"
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "movieId": 1,
    "movieTitle": "Action Movie A",
    "roomId": 1,
    "roomName": "Phòng 2D số 1",
    "startTime": "2026-07-01T19:00:00",
    "endTime": "2026-07-01T21:15:00",
    "basePrice": 90000,
    "status": "OPEN"
  },
  "message": "Showtime created successfully"
}
```

## 6. Tìm suất chiếu public

### Tên mô tả API
Khách tìm suất chiếu theo phim, phòng hoặc ngày.

### API
```http
GET /api/v1/showtimes?movieId=1&date=2026-07-01
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "movieId": 1,
      "roomId": 1,
      "startTime": "2026-07-01T19:00:00",
      "basePrice": 90000,
      "status": "OPEN"
    }
  ]
}
```

## 7. Xem sơ đồ ghế theo suất chiếu

### Tên mô tả API
Khách xem sơ đồ ghế theo suất chiếu, bao gồm trạng thái runtime từ booking: `AVAILABLE`, `HOLDING`, `BOOKED`, `CHECKED_IN`, `UNAVAILABLE`.

### API
```http
GET /api/v1/showtimes/1/seat-map
```

### JSON
```json
{}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "showtime": {
      "id": 1,
      "movieTitle": "Action Movie A",
      "roomName": "Phòng 2D số 1"
    },
    "rowCount": 3,
    "columnCount": 4,
    "seats": [
      {
        "id": 1,
        "rowLabel": "A",
        "seatNumber": 1,
        "seatType": "NORMAL",
        "runtimeStatus": "AVAILABLE"
      }
    ]
  }
}
```

## 8. Tạo luật giá vé

### Tên mô tả API
Admin tạo giá vé theo loại vé, loại phòng, ngày thường/cuối tuần/ngày lễ.

### API
```http
POST /api/v1/admin/ticket-pricing/rules
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "ticketType": "ADULT",
  "roomType": "TWO_D",
  "weekend": false,
  "holiday": false,
  "price": 95000,
  "active": true
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketType": "ADULT",
    "roomType": "TWO_D",
    "weekend": false,
    "holiday": false,
    "price": 95000,
    "active": true
  },
  "message": "Ticket pricing rule created successfully"
}
```

## 9. Tạo combo vé

### Tên mô tả API
Admin tạo combo vé, ví dụ 1 vé người lớn hoặc 2 vé người lớn + 1 vé trẻ em.

### API
```http
POST /api/v1/admin/ticket-pricing/combos
Authorization: Bearer ADMIN_TOKEN
```

### JSON
```json
{
  "name": "Combo 2 người lớn 1 trẻ em",
  "description": "Combo gia đình gồm 2 vé người lớn và 1 vé trẻ em.",
  "adultCount": 2,
  "childCount": 1,
  "seniorCount": 0,
  "studentCount": 0,
  "price": 250000,
  "active": true
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Combo 2 người lớn 1 trẻ em",
    "adultCount": 2,
    "childCount": 1,
    "price": 250000,
    "active": true
  },
  "message": "Ticket combo created successfully"
}
```

## 10. Validate tuổi, loại vé và tổng tiền

### Tên mô tả API
Kiểm tra vé có hợp lệ với tuổi người xem và giới hạn tuổi của phim hay không, sau đó tính tổng tiền theo rule hoặc combo.

### API
```http
POST /api/v1/ticket-pricing/validate
Authorization: Bearer CUSTOMER_TOKEN
```

### JSON
```json
{
  "showtimeId": 1,
  "comboId": 1,
  "holiday": false,
  "tickets": [
    {
      "ticketType": "ADULT",
      "viewerAge": 30,
      "quantity": 2
    },
    {
      "ticketType": "CHILD",
      "viewerAge": 10,
      "quantity": 1
    }
  ]
}
```

### Post-response
```json
{
  "success": true,
  "data": {
    "showtimeId": 1,
    "movieId": 1,
    "movieTitle": "Action Movie A",
    "ageRating": "13+",
    "eligible": false,
    "ticketSubtotal": 285000,
    "comboPrice": 250000,
    "finalAmount": 250000,
    "tickets": [
      {
        "ticketType": "ADULT",
        "viewerAge": 30,
        "quantity": 2,
        "unitPrice": 95000,
        "lineTotal": 190000,
        "eligible": true,
        "message": "Eligible"
      },
      {
        "ticketType": "CHILD",
        "viewerAge": 10,
        "quantity": 1,
        "unitPrice": 95000,
        "lineTotal": 95000,
        "eligible": false,
        "message": "Viewer age does not meet movie age rating 13+"
      }
    ],
    "warnings": []
  },
  "message": "Ticket price validated successfully"
}
```

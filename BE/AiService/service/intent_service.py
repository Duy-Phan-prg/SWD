BOOKING_KEYWORDS = ["đặt vé", "mua vé", "book", "còn vé", "chỗ ngồi", "ghế"]
SHOWTIME_KEYWORDS = ["lịch chiếu", "giờ chiếu", "suất chiếu", "khi nào chiếu", "mấy giờ"]
MOVIE_KEYWORDS = ["phim", "nội dung", "cốt truyện", "diễn viên", "đạo diễn", "thể loại", "mô tả"]
PRICE_KEYWORDS = ["giá vé", "bao nhiêu tiền", "chi phí", "combo", "ưu đãi", "khuyến mãi"]


def detect_intent(message: str) -> str:
    msg = message.lower()
    if any(k in msg for k in BOOKING_KEYWORDS):
        return "booking"
    if any(k in msg for k in SHOWTIME_KEYWORDS):
        return "showtime"
    if any(k in msg for k in PRICE_KEYWORDS):
        return "price"
    if any(k in msg for k in MOVIE_KEYWORDS):
        return "movie_info"
    return "general"

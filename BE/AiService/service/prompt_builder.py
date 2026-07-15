import psycopg2.extras
from service.db import get_connection


def get_movie_context(movie_id: int) -> str:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("""
            SELECT m.title, m.description, m.director, m.main_actors,
                   m.duration_minutes, m.release_date, m.language, m.rating
            FROM movies m WHERE m.id = %s
        """, (movie_id,))
        movie = cursor.fetchone()
        if not movie:
            return ""

        cursor.execute("""
            SELECT g.name FROM genres g
            JOIN movie_genres mg ON mg.genre_id = g.id
            WHERE mg.movie_id = %s
        """, (movie_id,))
        genres = ", ".join(r["name"] for r in cursor.fetchall())

        cursor.execute("""
            SELECT s.show_date, s.start_time, c.name AS cinema_name, r.name AS room_name
            FROM showtimes s
            JOIN rooms r ON r.id = s.room_id
            JOIN cinemas c ON c.id = r.cinema_id
            WHERE s.movie_id = %s AND s.show_date >= CURRENT_DATE
            ORDER BY s.show_date, s.start_time
            LIMIT 5
        """, (movie_id,))
        showtimes = cursor.fetchall()

        lines = [
            f"Phim: {movie['title']}",
            f"Thể loại: {genres}",
            f"Mô tả: {movie['description'] or 'Chưa có'}",
            f"Đạo diễn: {movie['director'] or 'Chưa có'}",
            f"Diễn viên: {movie['main_actors'] or 'Chưa có'}",
            f"Thời lượng: {movie['duration_minutes']} phút" if movie['duration_minutes'] else "",
            f"Ngôn ngữ: {movie['language'] or 'Chưa có'}",
            f"Điểm đánh giá: {movie['rating']}" if movie['rating'] else "",
        ]

        if showtimes:
            lines.append("Lịch chiếu sắp tới:")
            for s in showtimes:
                lines.append(f"  - {s['show_date']} {s['start_time']} | {s['cinema_name']} - {s['room_name']}")

        return "\n".join(l for l in lines if l)
    finally:
        cursor.close()
        conn.close()


def build_system_prompt(movie_context: str) -> str:
    base = (
        "Bạn là trợ lý AI của hệ thống đặt vé xem phim CinePremier. "
        "Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. "
        "Chỉ trả lời các câu hỏi liên quan đến phim, lịch chiếu, đặt vé, ưu đãi. "
        "Không trả lời các chủ đề ngoài lề."
    )
    if movie_context:
        return base + f"\n\nThông tin phim hiện tại:\n{movie_context}"
    return base

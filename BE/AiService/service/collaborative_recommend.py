import numpy as np
from service.db import get_connection

TOP_K = 10
TOP_USERS = 20


def get_user_ratings(user_id: int) -> dict:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT movie_id, score FROM ratings WHERE user_id = %s
        """, (user_id,))
        return {r["movie_id"]: r["score"] for r in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()


def get_watched_ids(user_id: int) -> set:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT movie_id FROM watch_history WHERE user_id = %s
        """, (user_id,))
        return {r["movie_id"] for r in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()


def get_all_ratings() -> dict:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT user_id, movie_id, score FROM ratings")
        result: dict[int, dict[int, float]] = {}
        for r in cursor.fetchall():
            uid = r["user_id"]
            if uid not in result:
                result[uid] = {}
            result[uid][r["movie_id"]] = r["score"]
        return result
    finally:
        cursor.close()
        conn.close()


def get_movie_info(movie_ids: list) -> dict:
    if not movie_ids:
        return {}
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        fmt = ",".join(["%s"] * len(movie_ids))
        cursor.execute(f"SELECT id, title, poster_url FROM movies WHERE id IN ({fmt})", movie_ids)
        return {r["id"]: r for r in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()


def cosine_similarity_dicts(a: dict, b: dict) -> float:
    common = set(a.keys()) & set(b.keys())
    if not common:
        return 0.0
    dot = sum(a[k] * b[k] for k in common)
    norm_a = np.sqrt(sum(v ** 2 for v in a.values()))
    norm_b = np.sqrt(sum(v ** 2 for v in b.values()))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def recommend_collaborative(user_id: int) -> list:
    user_vec = get_user_ratings(user_id)
    seen = get_watched_ids(user_id) | set(user_vec.keys())

    all_ratings = get_all_ratings()

    if not user_vec:
        return _fallback(seen)

    similar_users = sorted(
        [(uid, cosine_similarity_dicts(user_vec, vec))
         for uid, vec in all_ratings.items() if uid != user_id],
        key=lambda x: x[1], reverse=True
    )[:TOP_USERS]

    movie_scores: dict[int, float] = {}
    for uid, sim in similar_users:
        for mid, score in all_ratings[uid].items():
            if mid in seen:
                continue
            movie_scores[mid] = movie_scores.get(mid, 0) + sim * score

    top_ids = sorted(movie_scores, key=movie_scores.get, reverse=True)[:TOP_K]
    movies = get_movie_info(top_ids)

    return [
        {
            "movieId": mid,
            "title": movies[mid]["title"] if mid in movies else "",
            "posterUrl": movies[mid].get("poster_url", "") if mid in movies else "",
            "similarity": round(movie_scores[mid], 4)
        }
        for mid in top_ids if mid in movies
    ]


def _fallback(seen: set) -> list:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT m.id, m.title, m.poster_url, AVG(r.score) as avg_score
            FROM movies m
            JOIN ratings r ON r.movie_id = m.id
            GROUP BY m.id, m.title, m.poster_url
            ORDER BY avg_score DESC
            LIMIT %s
        """, (TOP_K + len(seen),))
        results = []
        for row in cursor.fetchall():
            if row["id"] in seen:
                continue
            results.append({
                "movieId": row["id"],
                "title": row["title"],
                "posterUrl": row.get("poster_url", ""),
                "similarity": round(float(row["avg_score"]) / 5.0, 4)
            })
            if len(results) >= TOP_K:
                break
        return results
    finally:
        cursor.close()
        conn.close()

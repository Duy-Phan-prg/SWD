import numpy as np
import psycopg2.extras
from service.db import get_connection
from service.embedding_service import get_embedding_service

TOP_K = 10
TOP_K_BUFFER = 20  # lấy dư để bù cho các movieId không còn trong DB


def get_movie_data(movie_id: int) -> dict | None:
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("""
            SELECT m.id, m.title, m.description, m.director, m.main_actors, m.poster_url
            FROM movies m
            WHERE m.id = %s
        """, (movie_id,))
        movie = cursor.fetchone()
        if not movie:
            return None

        movie = dict(movie)

        cursor.execute("""
            SELECT g.name FROM genres g
            JOIN movie_genres mg ON mg.genre_id = g.id
            WHERE mg.movie_id = %s
        """, (movie_id,))
        genres = [r["name"] for r in cursor.fetchall()]

        cursor.execute("""
            SELECT a.name FROM actors a
            JOIN movie_actors ma ON ma.actor_id = a.id
            WHERE ma.movie_id = %s
        """, (movie_id,))
        actors = [r["name"] for r in cursor.fetchall()]

        movie["genres"] = genres
        movie["actors"] = actors
        return movie
    finally:
        cursor.close()
        conn.close()


def build_text(movie: dict) -> str:
    genres = " ".join(movie.get("genres") or [])
    actors = " ".join(movie.get("actors") or [])
    return f"{movie.get('description') or ''} {movie.get('director') or ''} {actors} {genres}"


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def get_movies_info(movie_ids: list) -> dict:
    if not movie_ids:
        return {}
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute(
            "SELECT id, title, poster_url FROM movies WHERE id = ANY(%s)",
            (movie_ids,)
        )
        return {r["id"]: dict(r) for r in cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()


def recommend_content(movie_id: int) -> list:
    movie = get_movie_data(movie_id)
    if not movie:
        return []

    svc = get_embedding_service()
    query_vec = svc.encode(build_text(movie))
    embeddings = svc.get_embeddings()

    scores = []
    for mid, data in embeddings.items():
        if mid == movie_id:
            continue
        sim = cosine_similarity(query_vec, data["embedding"])
        scores.append({"movieId": mid, "similarity": round(float(sim), 4)})

    scores.sort(key=lambda x: x["similarity"], reverse=True)
    candidates = scores[:TOP_K_BUFFER]

    db_info = get_movies_info([s["movieId"] for s in candidates])
    result = [
        {
            "movieId": s["movieId"],
            "title": db_info[s["movieId"]]["title"],
            "posterUrl": db_info[s["movieId"]].get("poster_url", ""),
            "similarity": s["similarity"],
        }
        for s in candidates if s["movieId"] in db_info
    ]
    return result[:TOP_K]

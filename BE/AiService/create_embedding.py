"""
Chạy 1 lần để build embeddings từ MySQL.
Usage: python create_embedding.py
"""
import pickle
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from service.db import get_connection

load_dotenv()

MODEL_NAME = "all-MiniLM-L6-v2"
OUTPUT_PATH = "model/movie_embeddings.pkl"

conn = get_connection()
cursor = conn.cursor(dictionary=True)

cursor.execute("""
    SELECT m.id, m.title, m.description, m.director, m.main_actors, m.poster_url,
           GROUP_CONCAT(DISTINCT g.name SEPARATOR ' ') as genres,
           GROUP_CONCAT(DISTINCT a.name SEPARATOR ' ') as actors
    FROM movies m
    LEFT JOIN movie_genres mg ON mg.movie_id = m.id
    LEFT JOIN genres g ON g.id = mg.genre_id
    LEFT JOIN movie_actors ma ON ma.movie_id = m.id
    LEFT JOIN actors a ON a.id = ma.actor_id
    GROUP BY m.id
""")
movies = cursor.fetchall()
cursor.close()
conn.close()

model = SentenceTransformer(MODEL_NAME)
embeddings = {}

for movie in movies:
    text = f"{movie.get('description') or ''} {movie.get('director') or ''} {movie.get('actors') or ''} {movie.get('genres') or ''}"
    vec = model.encode(text, convert_to_numpy=True)
    embeddings[movie["id"]] = {
        "embedding": vec,
        "title": movie["title"],
        "posterUrl": movie.get("poster_url", "") or ""
    }

os.makedirs("model", exist_ok=True)
with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(embeddings, f)

print(f"Done: {len(embeddings)} movies → {OUTPUT_PATH}")

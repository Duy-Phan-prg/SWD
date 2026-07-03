"""
Chạy script này 1 lần để tạo embeddings từ movies.csv
Usage: python create_embedding.py
"""
import pandas as pd
import pickle
import os
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
MOVIES_PATH = "data/movies.csv"
OUTPUT_PATH = "model/movie_embeddings.pkl"

model = SentenceTransformer(MODEL_NAME)
df = pd.read_csv(MOVIES_PATH)

embeddings = {}
for _, row in df.iterrows():
    text = f"{row.get('description', '')} {row.get('director', '')} {row.get('actors', '')} {row.get('genres', '')}"
    vec = model.encode(text, convert_to_numpy=True)
    embeddings[int(row["movieId"])] = {
        "embedding": vec,
        "title": str(row["title"]),
        "posterUrl": str(row.get("posterUrl", ""))
    }

os.makedirs("model", exist_ok=True)
with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(embeddings, f)

print(f"Done: {len(embeddings)} movies embedded → {OUTPUT_PATH}")

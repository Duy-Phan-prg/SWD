import pickle
import os
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDINGS_PATH = os.path.join(os.path.dirname(__file__), "../model/movie_embeddings.pkl")


class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(MODEL_NAME)

    def encode(self, text: str):
        return self.model.encode(text, convert_to_numpy=True)

    def load_embeddings(self):
        with open(EMBEDDINGS_PATH, "rb") as f:
            return pickle.load(f)

    def save_embeddings(self, data: dict):
        os.makedirs(os.path.dirname(EMBEDDINGS_PATH), exist_ok=True)
        with open(EMBEDDINGS_PATH, "wb") as f:
            pickle.dump(data, f)

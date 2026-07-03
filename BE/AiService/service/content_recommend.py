import numpy as np
from service.embedding_service import EmbeddingService

TOP_K = 10


class ContentRecommendService:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    def recommend(self, request):
        text = self._build_text(request)
        query_vec = self.embedding_service.encode(text)

        embeddings = self.embedding_service.load_embeddings()

        scores = []
        for movie_id, data in embeddings.items():
            if movie_id == request.movieId:
                continue
            sim = self._cosine_similarity(query_vec, data["embedding"])
            scores.append({
                "movieId": movie_id,
                "title": data["title"],
                "posterUrl": data.get("posterUrl", ""),
                "similarity": float(sim)
            })

        scores.sort(key=lambda x: x["similarity"], reverse=True)
        return scores[:TOP_K]

    def _build_text(self, request) -> str:
        genres = " ".join(request.genres)
        return f"{request.description} {request.director} {request.actors} {genres}"

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

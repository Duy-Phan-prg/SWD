import pandas as pd
import numpy as np
import os

RATINGS_PATH = os.path.join(os.path.dirname(__file__), "../data/ratings.csv")
MOVIES_PATH = os.path.join(os.path.dirname(__file__), "../data/movies.csv")

TOP_K = 10


class CollaborativeRecommendService:
    def __init__(self):
        self.ratings_df = pd.read_csv(RATINGS_PATH)
        self.movies_df = pd.read_csv(MOVIES_PATH)

    def recommend(self, request):
        seen = set(request.watchedMovies + request.ratedMovies)

        user_ratings = self.ratings_df[
            self.ratings_df["userId"] == request.userId
        ]

        if user_ratings.empty:
            return self._fallback(seen)

        user_vec = self._build_user_vector(user_ratings)
        scores = self._score_movies(user_vec, seen)
        return scores[:TOP_K]

    def _build_user_vector(self, user_ratings) -> dict:
        return dict(zip(user_ratings["movieId"], user_ratings["score"]))

    def _score_movies(self, user_vec: dict, seen: set) -> list:
        similar_users = self._find_similar_users(user_vec)

        movie_scores: dict[int, float] = {}
        for other_user_id, sim in similar_users:
            other_ratings = self.ratings_df[
                self.ratings_df["userId"] == other_user_id
            ]
            for _, row in other_ratings.iterrows():
                mid = int(row["movieId"])
                if mid in seen:
                    continue
                movie_scores[mid] = movie_scores.get(mid, 0) + sim * row["score"]

        results = []
        for movie_id, score in movie_scores.items():
            movie = self.movies_df[self.movies_df["movieId"] == movie_id]
            if movie.empty:
                continue
            results.append({
                "movieId": movie_id,
                "title": str(movie.iloc[0]["title"]),
                "posterUrl": str(movie.iloc[0].get("posterUrl", "")),
                "similarity": round(score, 4)
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results

    def _find_similar_users(self, user_vec: dict, top_n: int = 20) -> list:
        other_users = self.ratings_df[
            ~self.ratings_df["userId"].isin([])
        ]["userId"].unique()

        sims = []
        for uid in other_users:
            other_ratings = self.ratings_df[self.ratings_df["userId"] == uid]
            other_vec = dict(zip(other_ratings["movieId"], other_ratings["score"]))
            sim = self._cosine_similarity_dicts(user_vec, other_vec)
            if sim > 0:
                sims.append((uid, sim))

        sims.sort(key=lambda x: x[1], reverse=True)
        return sims[:top_n]

    def _cosine_similarity_dicts(self, a: dict, b: dict) -> float:
        common = set(a.keys()) & set(b.keys())
        if not common:
            return 0.0
        dot = sum(a[k] * b[k] for k in common)
        norm_a = np.sqrt(sum(v ** 2 for v in a.values()))
        norm_b = np.sqrt(sum(v ** 2 for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _fallback(self, seen: set) -> list:
        popular = self.ratings_df.groupby("movieId")["score"].mean().reset_index()
        popular = popular.sort_values("score", ascending=False)
        results = []
        for _, row in popular.iterrows():
            mid = int(row["movieId"])
            if mid in seen:
                continue
            movie = self.movies_df[self.movies_df["movieId"] == mid]
            if movie.empty:
                continue
            results.append({
                "movieId": mid,
                "title": str(movie.iloc[0]["title"]),
                "posterUrl": str(movie.iloc[0].get("posterUrl", "")),
                "similarity": round(float(row["score"]) / 5.0, 4)
            })
            if len(results) >= TOP_K:
                break
        return results

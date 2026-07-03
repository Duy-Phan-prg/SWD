from fastapi import APIRouter
from service.collaborative_recommend import CollaborativeRecommendService
from pydantic import BaseModel
from typing import List

router = APIRouter()
service = CollaborativeRecommendService()


class CollaborativeRecommendRequest(BaseModel):
    userId: int
    watchedMovies: List[int]
    ratedMovies: List[int]


class RecommendMovieResponse(BaseModel):
    movieId: int
    title: str
    posterUrl: str
    similarity: float


@router.post("/recommend/collaborative", response_model=List[RecommendMovieResponse])
def recommend_collaborative(request: CollaborativeRecommendRequest):
    return service.recommend(request)

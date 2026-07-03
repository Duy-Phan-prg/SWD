from fastapi import APIRouter
from service.content_recommend import ContentRecommendService
from pydantic import BaseModel
from typing import List

router = APIRouter()
service = ContentRecommendService()


class ContentRecommendRequest(BaseModel):
    movieId: int
    description: str
    director: str
    actors: str
    genres: List[str]


class RecommendMovieResponse(BaseModel):
    movieId: int
    title: str
    posterUrl: str
    similarity: float


@router.post("/recommend/content", response_model=List[RecommendMovieResponse])
def recommend_content(request: ContentRecommendRequest):
    return service.recommend(request)

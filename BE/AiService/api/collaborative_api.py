from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from service.collaborative_recommend import recommend_collaborative

router = APIRouter()


class RecommendMovieResponse(BaseModel):
    movieId: int
    title: str
    posterUrl: str
    similarity: float


@router.get("/recommend/collaborative/{user_id}", response_model=List[RecommendMovieResponse])
def collaborative(user_id: int):
    return recommend_collaborative(user_id)

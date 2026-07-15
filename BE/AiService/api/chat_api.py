from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from service.chat_service import chat

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    movieId: int | None = None


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="message không được để trống")
    reply = chat(request.message, request.movieId)
    return ChatResponse(message=reply)

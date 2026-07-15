import os
from service.prompt_builder import get_movie_context, build_system_prompt
from service.intent_service import detect_intent

_client = None


def get_openai_client():
    from openai import OpenAI
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client



def chat(message: str, movie_id: int | None = None) -> str:
    movie_context = get_movie_context(movie_id) if movie_id else ""
    system_prompt = build_system_prompt(movie_context)
    intent = detect_intent(message)

    # Gợi ý thêm context cho model theo intent
    intent_hint = {
        "booking": "Người dùng muốn đặt vé. Hướng dẫn họ chọn suất chiếu và tiến hành đặt vé.",
        "showtime": "Người dùng hỏi lịch chiếu. Cung cấp thông tin lịch chiếu từ context nếu có.",
        "price": "Người dùng hỏi giá vé hoặc ưu đãi. Trả lời ngắn gọn.",
        "movie_info": "Người dùng hỏi về nội dung phim. Dựa vào thông tin phim đã cho.",
        "general": "",
    }.get(intent, "")

    messages = [{"role": "system", "content": system_prompt}]
    if intent_hint:
        messages.append({"role": "system", "content": intent_hint})
    messages.append({"role": "user", "content": message})

    response = get_openai_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=512,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()

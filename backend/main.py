from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import time
import re

from llama_runner import query_llama
from search_engine import search_searxng, searxng_health
from prompt_builder import (
    build_prompt,
    is_greeting_or_ack,
    get_quick_reply
)
from weather_service import get_weather_answer

app = FastAPI()

# CORS config (tighten allow_origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Message class to represent each turn in history
class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

# Input schema for API
class Query(BaseModel):
    question: str
    history: Optional[List[Dict[str, str]]] = None


def _fallback_answer(user_question: str) -> str:
    q = (user_question or "").strip()
    return (
        "I could not reach a live service right now, but I can still guide you.\n\n"
        "What to do now:\n"
        f"- Your question: {q}\n"
        "- Share crop name, growth stage, and district for a more precise answer.\n"
        "- For pest issues, include symptoms on leaf/stem/root and when it started.\n"
        "- For irrigation, include soil type and last watering date.\n"
        "- For market or scheme queries, include your state and crop."
    )


def _normalize_answer(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"^\s*quick answer\s*:\s*", "", text, flags=re.IGNORECASE)
    return cleaned.strip()


@app.get("/health/rag")
async def rag_health() -> Dict[str, Any]:
    ok, active_url = searxng_health()
    return {
        "searxng_up": ok,
        "active_url": active_url or None,
    }

# API endpoint to handle user question
@app.post("/ask")
async def ask(query: Query) -> Dict[str, Any]:
    try:
        t0 = time.perf_counter()
        user_question = query.question.strip()
        if not user_question:
            raise HTTPException(status_code=400, detail="Question cannot be empty.")

        # Fast path: Skip model + search for short greetings, thanks, etc.
        if is_greeting_or_ack(user_question):
            response_text = get_quick_reply(user_question)
            return {
                "answer": response_text,
                "sources": []
            }

        # Fast path for weather queries (avoids slow LLM path and dependency on SearXNG).
        weather = get_weather_answer(user_question)
        if weather:
            weather_answer, weather_sources = weather
            return {"answer": weather_answer, "sources": weather_sources}

        # Convert history to Message format
        history = [Message(msg["role"], msg["content"]) for msg in query.history] if query.history else []

        # Step 1: Perform SearXNG search for the query
        search_results = search_searxng(user_question)

        # Step 2: Build final LLM prompt using query, history, and search results
        prompt = build_prompt(user_question, search_results, history)

        # Step 3: Run the prompt through the local LLaMA model
        response_text = query_llama(prompt, max_tokens=320)

        # Step 4: Format URLs as clickable sources
        sources = []
        for result in search_results[:5]:
            url = result.get("url")
            title = result.get("title")
            if url and title:
                sources.append({"title": title, "url": url})

        return {
            "answer": _normalize_answer(response_text),
            "sources": sources,
            "rag_used": len(sources) > 0,
        }

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        # Return a graceful answer instead of hard-failing the chat turn.
        return {
            "answer": _normalize_answer(_fallback_answer(query.question)),
            "sources": [],
            "rag_used": False,
            "degraded_mode": True,
        }
    finally:
        elapsed = time.perf_counter() - t0
        print(f"[ASK] total_latency_sec={elapsed:.2f}")


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from llama_runner import query_llama
from search_engine import search_searxng
from prompt_builder import build_prompt

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to only allow specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content

class Query(BaseModel):
    question: str
    history: Optional[List[Dict[str, str]]] = None

@app.post("/ask")
async def ask(query: Query) -> Dict[str, Any]:
    try:
        # Convert history to Message objects if provided
        history = []
        if query.history:
            history = [Message(msg["role"], msg["content"]) for msg in query.history]
        
        # Search for information
        search_results = search_searxng(query.question)
        
        # Build prompt with question, search results, and conversation history
        prompt = build_prompt(query.question, search_results, history)
        
        # Get response from LLM
        response = query_llama(prompt)
        
        # Return response and sources
        return {"answer": response, "sources": search_results}
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

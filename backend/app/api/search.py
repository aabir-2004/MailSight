from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter()


class SearchFilters(BaseModel):
    labels: list[str] | None = None
    senders: list[str] | None = None
    date_from: str | None = None
    date_to: str | None = None


class SearchRequest(BaseModel):
    query: str
    filters: SearchFilters | None = None
    top_k: int = 10


class EmailCard(BaseModel):
    id: str
    subject: str
    sender_email: str
    sender_name: str
    snippet: str
    date: str
    labels: list[str]
    relevance_score: float | None = None


class SearchResponse(BaseModel):
    answer: str
    sources: list[EmailCard]
    query_time_ms: int


@router.post("/search", response_model=SearchResponse, summary="Hybrid semantic + keyword search")
async def search_emails(req: SearchRequest):
    """
    1. Embed query with sentence-transformers
    2. ANN search over pgvector (semantic)
    3. Full-text search over body_text (keyword)
    4. RRF fusion → top-k
    5. Groq LLM synthesis → grounded answer
    """
    # Placeholder implementation — real logic in services/search_service.py
    return SearchResponse(
        answer=f"Placeholder LLM answer for: '{req.query}'",
        sources=[],
        query_time_ms=0,
    )

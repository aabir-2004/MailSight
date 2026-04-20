from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from app.services.search_service import perform_rag_search

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
    # Using a dummy user_id since auth isn't fully passed in this route yet.
    # In a full deployment, `user_id` should come from `Depends(get_current_user)`
    dummy_user_id = "00000000-0000-0000-0000-000000000000"
    
    result = await perform_rag_search(req.query, dummy_user_id, req.top_k)
    
    return SearchResponse(
        answer=result['answer'],
        sources=result['sources'],
        query_time_ms=result['query_time_ms'],
    )

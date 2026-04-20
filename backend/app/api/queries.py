from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from datetime import datetime
import uuid

router = APIRouter()

# In-memory store (replace with Supabase in production)
_store: list[dict[str, Any]] = []


class SaveQueryRequest(BaseModel):
    name: str
    query_text: str
    chart_spec_json: dict[str, Any]


class SavedQuery(BaseModel):
    id: str
    name: str
    query_text: str
    chart_spec_json: dict[str, Any]
    created_at: str


@router.get("", response_model=list[SavedQuery])
async def list_queries():
    return _store


@router.post("", response_model=SavedQuery, status_code=201)
async def save_query(req: SaveQueryRequest):
    record = SavedQuery(
        id=str(uuid.uuid4()),
        name=req.name,
        query_text=req.query_text,
        chart_spec_json=req.chart_spec_json,
        created_at=datetime.utcnow().isoformat(),
    )
    _store.append(record.model_dump())
    return record

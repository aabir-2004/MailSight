from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class SyncRequest(BaseModel):
    mode: Literal["full", "incremental"] = "incremental"
    date_from: str | None = None
    date_to: str | None = None


class SyncStatus(BaseModel):
    status: str
    emails_total: int
    emails_synced: int
    last_synced_at: str | None


@router.post("/start", summary="Trigger Gmail sync")
async def start_sync(req: SyncRequest):
    """Enqueues a Celery task to sync Gmail messages."""
    # In production: dispatch Celery task
    return {"task_id": "mock-task-id", "mode": req.mode, "status": "queued"}


@router.get("/status", summary="Poll sync progress (SSE)")
async def sync_status():
    """Returns current sync state from the database."""
    return SyncStatus(
        status="done",
        emails_total=12847,
        emails_synced=12847,
        last_synced_at="2025-04-20T12:00:00Z",
    )

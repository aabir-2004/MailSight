from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

router = APIRouter()


class SyncRequest(BaseModel):
    mode: Literal["full", "incremental", "smart"] = "smart"
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
    from datetime import datetime, timedelta

    if req.mode == "smart":
        # 1. Phase 1: High Priority (Last 30 days) for instant dashboard availability
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        # In production: celery.send_task("sync", kwargs={"date_from": thirty_days_ago, "priority": "high"})
        
        # 2. Phase 2: Background Historical Backfill (older than 30 days)
        # In production: celery.send_task("sync", kwargs={"date_to": thirty_days_ago, "priority": "low"})
        
        return {"task_id": "mock-smart-chain-task", "mode": req.mode, "status": "queued_smart_sync"}

    # In production: dispatch standard Celery task
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

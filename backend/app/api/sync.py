from __future__ import annotations
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
from app.core.db import supabase
from app.core.security import get_current_user_id
from app.services.gmail_sync_service import sync_gmail_messages

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


def _first_row(response) -> dict | None:
    data = getattr(response, "data", None) or []
    return data[0] if data else None


async def _run_sync_task(user_id: str, req: SyncRequest) -> None:
    await sync_gmail_messages(user_id, date_from=req.date_from, date_to=req.date_to)


@router.post("/start", summary="Trigger Gmail sync")
async def start_sync(
    req: SyncRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """Starts Gmail ingestion for the authenticated user."""
    existing = (
        supabase.table("sync_state")
        .select("status")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    existing_row = _first_row(existing)
    if existing_row and existing_row.get("status") == "syncing":
        return {"task_id": f"sync-{user_id}", "mode": req.mode, "status": "already_syncing"}

    supabase.table("sync_state").upsert(
        {
            "user_id": user_id,
            "status": "syncing",
            "emails_total": 0,
            "emails_synced": 0,
        },
        on_conflict="user_id",
    ).execute()

    background_tasks.add_task(_run_sync_task, user_id, req)
    return {"task_id": f"sync-{user_id}", "mode": req.mode, "status": "queued"}


@router.get("/status", summary="Poll sync progress (SSE)")
async def sync_status(user_id: str = Depends(get_current_user_id)):
    """Returns current sync state from the database."""
    response = (
        supabase.table("sync_state")
        .select("status,emails_total,emails_synced,last_synced_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    sync_row = _first_row(response)
    if not sync_row:
        return SyncStatus(status="idle", emails_total=0, emails_synced=0, last_synced_at=None)

    status = sync_row.get("status", "idle")
    if status not in {"idle", "syncing", "done", "error"}:
        raise HTTPException(status_code=500, detail="Invalid sync status in database")

    return SyncStatus(
        status=status,
        emails_total=sync_row.get("emails_total") or 0,
        emails_synced=sync_row.get("emails_synced") or 0,
        last_synced_at=sync_row.get("last_synced_at"),
    )

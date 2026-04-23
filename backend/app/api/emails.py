from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.core.security import get_current_user_id
from app.core.db import supabase
from pydantic import BaseModel

router = APIRouter()

class EmailCard(BaseModel):
    id: str
    subject: str
    sender_email: str
    sender_name: str
    snippet: str
    date: str
    labels: List[str]

@router.get("/emails", response_model=List[EmailCard])
async def list_emails(
    label: Optional[str] = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc"),
    user_id: str = Depends(get_current_user_id)
):
    """
    List emails with optional label filtering and sorting.
    """
    try:
        # 1. Fetch base emails (matching analytics pattern)
        # We fetch more than the display limit to handle local filtering if needed, 
        # but for now we rely on the DB query.
        query = supabase.table("emails").select("id, subject, sender_email, sender_name, snippet, date")
        query = query.eq("user_id", user_id)

        # 2. Filtering by label
        if label:
            label_res = supabase.table("labels").select("id").eq("user_id", user_id).eq("name", label).execute()
            if label_res.data:
                lid = label_res.data[0]["id"]
                join_res = supabase.table("email_labels").select("email_id").eq("label_id", lid).execute()
                eids = [r["email_id"] for r in (join_res.data or [])]
                if not eids:
                    return []
                query = query.in_("id", eids)
            else:
                return []

        # 3. Sorting & Range
        is_desc = (sort_order == "desc")
        if sort_by == "sender":
            query = query.order("sender_name", desc=is_desc)
        else:
            query = query.order("date", desc=is_desc)
            
        # Use range instead of limit to match analytics service style
        response = query.range(0, 99).execute()
        email_rows = response.data or []

        if not email_rows:
            return []

        # 4. Fetch labels for badges
        email_uuids = [r["id"] for r in email_rows]
        labels_resp = (
            supabase.table("email_labels")
            .select("email_id, labels(name)")
            .in_("email_id", email_uuids)
            .execute()
        )
        
        label_map = {}
        for r in (labels_resp.data or []):
            eid = r.get("email_id")
            lname = r.get("labels", {}).get("name") if r.get("labels") else None
            if eid and lname:
                if eid not in label_map:
                    label_map[eid] = []
                label_map[eid].append(lname)

        # 5. Map results
        return [
            EmailCard(
                id=str(row["id"]),
                subject=row.get("subject") or "(No Subject)",
                sender_email=row.get("sender_email") or "",
                sender_name=row.get("sender_name") or row.get("sender_email") or "Unknown",
                snippet=row.get("snippet") or "",
                date=str(row.get("date") or ""),
                labels=label_map.get(row["id"], [])
            )
            for row in email_rows
        ]
    except Exception as e:
        print(f"[Emails API] Critical Error: {e}")
        return []

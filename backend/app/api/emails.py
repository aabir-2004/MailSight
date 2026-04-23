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
    # 1. Start query on emails table
    query = supabase.table("emails").select("id, subject, sender_email, sender_name, snippet, date")
    query = query.eq("user_id", user_id)

    # 2. Filtering by label if requested
    if label:
        # We need to find emails that have this label
        # Since email_labels is a join table, we can use a subquery or join
        # In Supabase/PostgREST, we can use filter on joined table if defined in schema
        # For simplicity, let's fetch email IDs from email_labels first
        label_resp = supabase.table("labels").select("id").eq("user_id", user_id).eq("name", label).execute()
        if label_resp.data:
            label_uuid = label_resp.data[0]["id"]
            join_resp = supabase.table("email_labels").select("email_id").eq("label_id", label_uuid).execute()
            email_ids = [r["email_id"] for r in join_resp.data or []]
            if not email_ids:
                return []
            query = query.in_("id", email_ids)
        else:
            return []

    # 3. Sorting
    if sort_by == "sender":
        query = query.order("sender_name", desc=(sort_order == "desc"))
    else:
        query = query.order("date", desc=(sort_order == "desc"))

    # 4. Execute
    response = query.limit(50).execute()
    email_rows = response.data or []

    if not email_rows:
        return []

    # 5. Fetch labels for these emails
    email_uuids = [r["id"] for r in email_rows]
    labels_resp = (
        supabase.table("email_labels")
        .select("email_id, labels(name)")
        .in_("email_id", email_uuids)
        .execute()
    )
    
    label_map = {}
    for r in labels_resp.data or []:
        eid = r["email_id"]
        lname = r["labels"]["name"]
        if eid not in label_map:
            label_map[eid] = []
        label_map[eid].append(lname)

    # 6. Map to response model
    results = []
    for row in email_rows:
        results.append(EmailCard(
            id=str(row["id"]),
            subject=row.get("subject") or "(No Subject)",
            sender_email=row.get("sender_email") or "",
            sender_name=row.get("sender_name") or row.get("sender_email") or "Unknown",
            snippet=row.get("snippet") or "",
            date=str(row.get("date") or ""),
            labels=label_map.get(row["id"], [])
        ))

    return results

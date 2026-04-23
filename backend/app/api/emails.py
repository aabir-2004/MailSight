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
        # 1. Start query on emails table
        query = supabase.table("emails").select("id, subject, sender_email, sender_name, snippet, date")
        query = query.eq("user_id", user_id)

        # 2. Filtering by label if requested
        if label:
            # Find the label ID first
            label_resp = supabase.table("labels").select("id").eq("user_id", user_id).eq("name", label).execute()
            if label_resp.data:
                label_id = label_resp.data[0]["id"]
                # Get email IDs that have this label
                join_resp = supabase.table("email_labels").select("email_id").eq("label_id", label_id).execute()
                email_ids = [r["email_id"] for r in join_resp.data or []]
                if not email_ids:
                    return []
                query = query.in_("id", email_ids)
            else:
                return []

        # 3. Sorting
        is_desc = (sort_order == "desc")
        if sort_by == "sender":
            query = query.order("sender_name", desc=is_desc).order("date", desc=True)
        else:
            query = query.order("date", desc=is_desc)

        # 4. Execute with a reasonable limit
        response = query.limit(100).execute()
        email_rows = response.data or []

        if not email_rows:
            return []

        # 5. Fetch labels for these emails to display badges
        email_uuids = [r["id"] for r in email_rows]
        # We use a join select to get the label names
        labels_resp = (
            supabase.table("email_labels")
            .select("email_id, labels(name)")
            .in_("email_id", email_uuids)
            .execute()
        )
        
        # Build a map of email_id -> list of label names
        label_map = {}
        for r in (labels_resp.data or []):
            eid = r.get("email_id")
            label_data = r.get("labels")
            if not eid or not label_data:
                continue
                
            lname = label_data.get("name")
            if lname:
                if eid not in label_map:
                    label_map[eid] = []
                label_map[eid].append(lname)

        # 6. Map to response model
        results = []
        for row in email_rows:
            eid = row["id"]
            results.append(EmailCard(
                id=str(eid),
                subject=row.get("subject") or "(No Subject)",
                sender_email=row.get("sender_email") or "",
                sender_name=row.get("sender_name") or row.get("sender_email") or "Unknown",
                snippet=row.get("snippet") or "",
                date=str(row.get("date") or ""),
                labels=label_map.get(eid, [])
            ))

        return results
    except Exception as e:
        print(f"[Emails API] Error listing emails: {e}")
        return []

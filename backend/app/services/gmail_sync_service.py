from __future__ import annotations

import base64
import email.utils
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.core.db import supabase
from app.core.security import decrypt_token

GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"
TOKEN_URL = "https://oauth2.googleapis.com/token"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _headers_by_name(headers: list[dict[str, str]] | None) -> dict[str, str]:
    return {h.get("name", "").lower(): h.get("value", "") for h in headers or []}


def _parse_sender(raw_from: str) -> tuple[str, str]:
    name, address = email.utils.parseaddr(raw_from or "")
    return address.lower(), name or address


def _parse_gmail_date(raw_date: str | None, internal_date: str | None) -> str | None:
    if raw_date:
        try:
            parsed = email.utils.parsedate_to_datetime(raw_date)
            if parsed:
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed.astimezone(timezone.utc).isoformat()
        except (TypeError, ValueError, IndexError):
            pass

    if internal_date:
        return datetime.fromtimestamp(int(internal_date) / 1000, tz=timezone.utc).isoformat()

    return None


def _decode_body_data(data: str | None) -> str:
    if not data:
        return ""
    padded = data + ("=" * (-len(data) % 4))
    decoded = base64.urlsafe_b64decode(padded.encode("utf-8"))
    return decoded.decode("utf-8", errors="replace")


def _strip_html(value: str) -> str:
    value = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", value)
    value = re.sub(r"(?s)<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _extract_body(payload: dict[str, Any] | None) -> str:
    if not payload:
        return ""

    text_chunks: list[str] = []
    html_chunks: list[str] = []

    def walk(part: dict[str, Any]) -> None:
        mime_type = part.get("mimeType", "")
        body_data = part.get("body", {}).get("data")
        if body_data and mime_type == "text/plain":
            text_chunks.append(_decode_body_data(body_data))
        elif body_data and mime_type == "text/html":
            html_chunks.append(_strip_html(_decode_body_data(body_data)))

        for child in part.get("parts", []) or []:
            walk(child)

    walk(payload)
    body = "\n".join(chunk.strip() for chunk in text_chunks if chunk.strip())
    if body:
        return body
    return "\n".join(chunk for chunk in html_chunks if chunk)


def _gmail_query(date_from: str | None, date_to: str | None) -> str | None:
    parts: list[str] = []
    if date_from:
        parts.append(f"after:{date_from.replace('-', '/')}")
    if date_to:
        parts.append(f"before:{date_to.replace('-', '/')}")
    return " ".join(parts) or None


def _set_sync_state(
    user_id: str,
    *,
    status: str,
    emails_total: int | None = None,
    emails_synced: int | None = None,
    history_id: str | None = None,
    last_synced_at: str | None = None,
) -> None:
    record: dict[str, Any] = {
        "user_id": user_id,
        "status": status,
    }
    if emails_total is not None:
        record["emails_total"] = emails_total
    if emails_synced is not None:
        record["emails_synced"] = emails_synced
    if history_id is not None:
        record["history_id"] = history_id
    if last_synced_at is not None:
        record["last_synced_at"] = last_synced_at

    supabase.table("sync_state").upsert(record, on_conflict="user_id").execute()


def _fetch_user(user_id: str) -> dict[str, Any]:
    response = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data


async def _refresh_access_token(refresh_token: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=401, detail={"google_token_error": response.json()})
    token_data = response.json()
    return token_data["access_token"]


async def _gmail_get(client: httpx.AsyncClient, path: str, access_token: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = await client.get(
        f"{GMAIL_API_BASE}/{path}",
        headers={"Authorization": f"Bearer {access_token}"},
        params=params,
    )
    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail={"gmail_error": response.json()})
    return response.json()


def _upsert_labels(user_id: str, gmail_label_ids: set[str]) -> dict[str, str]:
    if not gmail_label_ids:
        return {}

    rows = [
        {
            "user_id": user_id,
            "gmail_label_id": label_id,
            "name": label_id,
            "type": "system" if label_id.isupper() else "user",
        }
        for label_id in sorted(gmail_label_ids)
    ]
    supabase.table("labels").upsert(rows, on_conflict="user_id,gmail_label_id").execute()
    label_response = (
        supabase.table("labels")
        .select("id,gmail_label_id")
        .eq("user_id", user_id)
        .in_("gmail_label_id", list(gmail_label_ids))
        .execute()
    )
    return {row["gmail_label_id"]: row["id"] for row in label_response.data or []}


def _upsert_threads(user_id: str, emails: list[dict[str, Any]]) -> None:
    by_thread: dict[str, dict[str, Any]] = {}
    for row in emails:
        thread_id = row.get("thread_id")
        if not thread_id:
            continue
        current = by_thread.get(thread_id)
        row_date = row.get("date") or ""
        if not current or row_date > (current.get("last_date") or ""):
            by_thread[thread_id] = {
                "user_id": user_id,
                "gmail_thread_id": thread_id,
                "subject": row.get("subject"),
                "last_date": row.get("date"),
                "message_count": 1,
            }
        else:
            current["message_count"] += 1

    if by_thread:
        supabase.table("threads").upsert(list(by_thread.values()), on_conflict="user_id,gmail_thread_id").execute()


def _upsert_senders(user_id: str, emails: list[dict[str, Any]]) -> None:
    grouped: dict[str, dict[str, Any]] = {}
    counts = Counter(row.get("sender_email") for row in emails if row.get("sender_email"))
    for row in emails:
        sender_email = row.get("sender_email")
        if not sender_email or sender_email in grouped:
            continue
        dates = [r.get("date") for r in emails if r.get("sender_email") == sender_email and r.get("date")]
        grouped[sender_email] = {
            "user_id": user_id,
            "email": sender_email,
            "name": row.get("sender_name"),
            "domain": sender_email.split("@")[-1] if "@" in sender_email else "",
            "first_seen": min(dates) if dates else row.get("date"),
            "last_seen": max(dates) if dates else row.get("date"),
            "total_count": counts[sender_email],
        }

    if grouped:
        supabase.table("senders").upsert(list(grouped.values()), on_conflict="user_id,email").execute()


def _upsert_email_labels(label_ids_by_gmail_id: dict[str, str], email_rows: list[dict[str, Any]], labels_by_message: dict[str, list[str]]) -> None:
    gmail_ids = [row["gmail_id"] for row in email_rows]
    if not gmail_ids:
        return

    email_response = (
        supabase.table("emails")
        .select("id,gmail_id")
        .eq("user_id", email_rows[0]["user_id"])
        .in_("gmail_id", gmail_ids)
        .execute()
    )
    email_ids_by_gmail_id = {row["gmail_id"]: row["id"] for row in email_response.data or []}

    joins = []
    for gmail_id, gmail_label_ids in labels_by_message.items():
        email_id = email_ids_by_gmail_id.get(gmail_id)
        if not email_id:
            continue
        for gmail_label_id in gmail_label_ids:
            label_id = label_ids_by_gmail_id.get(gmail_label_id)
            if label_id:
                joins.append({"email_id": email_id, "label_id": label_id})

    if joins:
        supabase.table("email_labels").upsert(joins, on_conflict="email_id,label_id").execute()


async def sync_gmail_messages(user_id: str, date_from: str | None = None, date_to: str | None = None) -> dict[str, Any]:
    user = _fetch_user(user_id)
    refresh_token_enc = user.get("refresh_token_enc")
    if not refresh_token_enc:
        raise HTTPException(status_code=409, detail="Google refresh token missing. Reconnect Gmail.")

    _set_sync_state(user_id, status="syncing", emails_total=0, emails_synced=0)

    try:
        access_token = await _refresh_access_token(decrypt_token(refresh_token_enc))
        messages: list[dict[str, str]] = []
        page_token: str | None = None
        query = _gmail_query(date_from, date_to)

        async with httpx.AsyncClient(timeout=60) as client:
            while True:
                params: dict[str, Any] = {
                    "maxResults": min(settings.GMAIL_MAX_RESULTS, 500),
                }
                if query:
                    params["q"] = query
                if page_token:
                    params["pageToken"] = page_token

                page = await _gmail_get(client, "messages", access_token, params)
                messages.extend(page.get("messages", []) or [])
                total = max(page.get("resultSizeEstimate", 0), len(messages))
                _set_sync_state(user_id, status="syncing", emails_total=total, emails_synced=0)

                if len(messages) >= settings.GMAIL_MAX_RESULTS:
                    messages = messages[: settings.GMAIL_MAX_RESULTS]
                    break

                page_token = page.get("nextPageToken")
                if not page_token:
                    break

            email_rows: list[dict[str, Any]] = []
            all_label_ids: set[str] = set()
            labels_by_message: dict[str, list[str]] = {}
            latest_history_id: str | None = None

            for index, message in enumerate(messages, start=1):
                gmail_id = message["id"]
                detail = await _gmail_get(
                    client,
                    f"messages/{gmail_id}",
                    access_token,
                    {
                        "format": "full",
                        "metadataHeaders": ["Subject", "From", "Date"],
                    },
                )
                headers = _headers_by_name(detail.get("payload", {}).get("headers"))
                sender_email, sender_name = _parse_sender(headers.get("from", ""))
                label_ids = detail.get("labelIds", []) or []
                all_label_ids.update(label_ids)
                labels_by_message[gmail_id] = label_ids
                latest_history_id = detail.get("historyId") or latest_history_id

                email_rows.append(
                    {
                        "user_id": user_id,
                        "gmail_id": gmail_id,
                        "thread_id": detail.get("threadId"),
                        "subject": headers.get("subject", ""),
                        "sender_email": sender_email,
                        "sender_name": sender_name,
                        "body_text": _extract_body(detail.get("payload")),
                        "snippet": detail.get("snippet", ""),
                        "date": _parse_gmail_date(headers.get("date"), detail.get("internalDate")),
                        "is_read": "UNREAD" not in label_ids,
                        "is_starred": "STARRED" in label_ids,
                        "raw_size_bytes": detail.get("sizeEstimate", 0),
                    }
                )

                if index % 10 == 0:
                    _set_sync_state(user_id, status="syncing", emails_total=len(messages), emails_synced=index)

        if email_rows:
            supabase.table("emails").upsert(email_rows, on_conflict="user_id,gmail_id").execute()
            labels_by_id = _upsert_labels(user_id, all_label_ids)
            _upsert_email_labels(labels_by_id, email_rows, labels_by_message)
            _upsert_threads(user_id, email_rows)
            _upsert_senders(user_id, email_rows)

        finished_at = _utc_now()
        _set_sync_state(
            user_id,
            status="done",
            emails_total=len(email_rows),
            emails_synced=len(email_rows),
            history_id=latest_history_id,
            last_synced_at=finished_at,
        )
        return {
            "status": "done",
            "emails_total": len(email_rows),
            "emails_synced": len(email_rows),
            "last_synced_at": finished_at,
            "history_id": latest_history_id,
        }
    except Exception:
        _set_sync_state(user_id, status="error")
        raise

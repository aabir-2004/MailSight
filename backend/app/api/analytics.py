from __future__ import annotations
from fastapi import APIRouter, Query
from pydantic import BaseModel
from datetime import date

router = APIRouter()


class LabelFrequency(BaseModel):
    label: str
    count: int
    percentage: float


class VolumeDataPoint(BaseModel):
    date: str
    count: int


class SenderStat(BaseModel):
    sender_email: str
    sender_name: str
    domain: str
    count: int
    first_seen: str
    last_seen: str


class HeatmapCell(BaseModel):
    hour: int
    day: int
    count: int


class ThreadDepthBin(BaseModel):
    depth: str
    count: int


class AnalyticsSummary(BaseModel):
    total_emails: int
    total_senders: int
    total_labels: int
    total_threads: int
    avg_emails_per_day: float
    busiest_day: str
    busiest_hour: int
    top_label: str
    top_sender: str
    unread_count: int
    starred_count: int


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary():
    return AnalyticsSummary(
        total_emails=12847, total_senders=438, total_labels=24,
        total_threads=3211, avg_emails_per_day=35.2, busiest_day="Tuesday",
        busiest_hour=10, top_label="INBOX", top_sender="github.com",
        unread_count=1204, starred_count=87,
    )


@router.get("/labels", response_model=list[LabelFrequency])
async def get_label_frequency(
    date_from: str = Query(default=str(date.today().replace(month=1, day=1))),
    date_to: str = Query(default=str(date.today())),
):
    return [
        LabelFrequency(label="INBOX",      count=5420, percentage=42.2),
        LabelFrequency(label="Promotions", count=3180, percentage=24.8),
        LabelFrequency(label="Social",     count=1840, percentage=14.3),
        LabelFrequency(label="Updates",    count=1120, percentage=8.7),
        LabelFrequency(label="Important",  count=720,  percentage=5.6),
    ]


@router.get("/volume", response_model=list[VolumeDataPoint])
async def get_volume(
    date_from: str = Query(default=""),
    date_to: str = Query(default=""),
    granularity: str = Query(default="day"),
):
    import random
    from datetime import datetime, timedelta
    start = datetime.strptime(date_from, "%Y-%m-%d") if date_from else datetime.now() - timedelta(days=30)
    end   = datetime.strptime(date_to,   "%Y-%m-%d") if date_to   else datetime.now()
    delta = (end - start).days
    return [
        VolumeDataPoint(date=(start + timedelta(days=i)).strftime("%Y-%m-%d"), count=random.randint(20, 80))
        for i in range(max(delta, 1))
    ]


@router.get("/senders", response_model=list[SenderStat])
async def get_top_senders(limit: int = Query(default=10)):
    senders = [
        SenderStat(sender_email="notifications@github.com", sender_name="GitHub",       domain="github.com",       count=1240, first_seen="2024-01-01", last_seen="2025-04-20"),
        SenderStat(sender_email="newsletter@producthunt.com", sender_name="Product Hunt", domain="producthunt.com", count=890,  first_seen="2024-02-10", last_seen="2025-04-18"),
        SenderStat(sender_email="team@notion.so",           sender_name="Notion",        domain="notion.so",       count=670,  first_seen="2024-03-05", last_seen="2025-04-15"),
    ]
    return senders[:limit]


@router.get("/heatmap", response_model=list[HeatmapCell])
async def get_heatmap(date_from: str = Query(default=""), date_to: str = Query(default="")):
    import random
    cells = []
    for day in range(7):
        for hour in range(24):
            isWorkHour = 9 <= hour <= 18
            base = 30 if day < 5 and isWorkHour else 5
            cells.append(HeatmapCell(day=day, hour=hour, count=random.randint(base, base + 40)))
    return cells


@router.get("/threads", response_model=list[ThreadDepthBin])
async def get_threads(date_from: str = Query(default=""), date_to: str = Query(default="")):
    return [
        ThreadDepthBin(depth="1",    count=1240),
        ThreadDepthBin(depth="2–3",  count=980),
        ThreadDepthBin(depth="4–6",  count=540),
        ThreadDepthBin(depth="7–10", count=280),
        ThreadDepthBin(depth="11+",  count=171),
    ]

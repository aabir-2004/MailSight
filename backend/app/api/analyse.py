from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Literal

router = APIRouter()

ChartType = Literal["bar", "line", "pie", "scatter", "heatmap", "table"]


class ChartSpec(BaseModel):
    type: ChartType
    title: str
    x_label: str | None = None
    y_label: str | None = None
    data: list[dict[str, Any]]


class CustomQueryRequest(BaseModel):
    query: str
    preferred_chart_type: ChartType | None = None


class CustomQueryResponse(BaseModel):
    query_text: str
    chart_spec: ChartSpec
    explanation: str
    query_time_ms: int


@router.post("/analyse/custom", response_model=CustomQueryResponse)
async def custom_analyse(req: CustomQueryRequest):
    """
    1. Pass user query + DB schema description to Groq mixtral-8x7b
    2. LLM outputs chart_type, SQL-like analysis spec, explanation
    3. Execute query against Supabase
    4. Return chart data + explanation
    """
    return CustomQueryResponse(
        query_text=req.query,
        chart_spec=ChartSpec(
            type="bar",
            title="Email Volume by Sender Domain",
            x_label="domain",
            y_label="count",
            data=[{"domain": "github.com", "count": 142}, {"domain": "notion.so", "count": 63}],
        ),
        explanation=f"Placeholder explanation for: '{req.query}'",
        query_time_ms=0,
    )

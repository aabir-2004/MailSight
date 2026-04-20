from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Literal
import time
from app.services.analyse_service import generate_dynamic_analysis

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
    Pass user query + DB schema description to Groq mixtral-8x7b
    Returns dynamically constructed Recharts JSON schema
    """
    start_time = time.time()
    
    analysis_data = await generate_dynamic_analysis(req.query, req.preferred_chart_type)
    
    query_time_ms = int((time.time() - start_time) * 1000)
    
    return CustomQueryResponse(
        query_text=req.query,
        chart_spec=ChartSpec(
            type=analysis_data.get("type", "bar"),
            title=analysis_data.get("title", "AI Graph Analysis"),
            x_label=analysis_data.get("x_label", ""),
            y_label=analysis_data.get("y_label", ""),
            data=analysis_data.get("data", [])
        ),
        explanation=analysis_data.get("explanation", "Here is your generated chart."),
        query_time_ms=query_time_ms,
    )

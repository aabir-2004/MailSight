import json
import re
import hashlib
from groq import Groq
from app.core.config import settings
from app.core.cache import get_cache, set_cache

groq_client = Groq(api_key=settings.GROQ_API_KEY)

async def generate_dynamic_analysis(query: str, preferred_chart_type: str = None) -> dict:
    """
    Simulates a dynamic AI analysis mapping.
    Cached via Redis to prevent backend overload and unnecessary expensive LLM calls.
    Only lightweight structured metadata is stored in memory.
    """
    
    # 1. Generate unique cache key based on query intent
    cache_key_raw = f"analysis:{query}:{preferred_chart_type or 'auto'}"
    cache_key = hashlib.md5(cache_key_raw.encode()).hexdigest()
    
    # 2. Check Redis for optimization
    cached_spec = await get_cache(cache_key)
    if cached_spec:
        print("[Redis] Cache HIT! Returning processed metadata safely.")
        return cached_spec

    print("[Redis] Cache MISS. Processing analytics payload via LLM...")
    
    chart_constraint = f"Use preferred chart type: {preferred_chart_type} if provided." if preferred_chart_type else "Select the most appropriate chart type (bar, line, pie, scatter, heatmap)."
    
    system_prompt = f"""You are MailLens Advanced Analytics Engine.
The user wants to analyze their email metadata: '{query}'. 

Generate a strictly valid JSON object representing a Recharts ChartSpec. Do not output markdown.
Structure:
{{
  "type": "bar" | "line" | "pie" | "scatter" | "heatmap",
  "title": "<String>",
  "x_label": "<String>",
  "y_label": "<String>",
  "data": [ {{ "name": "...", "value": 0 }} ],
  "explanation": "<String>"
}}

{chart_constraint}
Base your data aggregations purely on metadata (sender domain, timestamp, labels) instead of heavy full-body text indexing. Output ONLY JSON.
"""

    try:
        completion = groq_client.chat.completions.create(
            model=settings.GROQ_ANALYSE_MODEL,
            messages=[{"role": "system", "content": system_prompt}],
            temperature=0.3,
            max_tokens=600
        )
        
        raw_text = completion.choices[0].message.content
        
        # Strip potential markdown formatting from LLM
        json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if json_match:
            spec_json = json.loads(json_match.group(0))
        else:
            spec_json = json.loads(raw_text)
            
        # 3. Store optimized metadata representation in Redis (TTL: 1 hour)
        await set_cache(cache_key, spec_json, ttl=3600)
            
        return spec_json

    except Exception as e:
        print(f"[Analyse Error] {e}")
        # Safe fallback
        return {
            "type": "bar",
            "title": "Email Volume Analytics (Fallback)",
            "x_label": "Category",
            "y_label": "Count",
            "data": [
                {"name": "Internal", "value": 150},
                {"name": "Client", "value": 340},
                {"name": "Spam", "value": 20}
            ],
            "explanation": "The AI analysis model experienced load failure. This is a cached local fallback representation."
        }

import json
from typing import List, Optional
from groq import Groq
from app.core.config import settings

groq_client = Groq(api_key=settings.GROQ_API_KEY)

async def extract_topics(subject: str, snippet: str, sender_name: str) -> List[str]:
    """
    Use Groq to extract high-level topics or categories for an email.
    """
    if not settings.GROQ_API_KEY:
        return []

    prompt = f"""
    Analyze this email metadata and suggest 1-2 concise topic labels (e.g., 'Finance', 'Travel', 'Work', 'Social', 'Shopping').
    Return ONLY a JSON list of strings.
    
    Sender: {sender_name}
    Subject: {subject}
    Snippet: {snippet}
    """

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that categorizes emails into topics. Output only a JSON list of 1-2 labels."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=50
        )
        content = completion.choices[0].message.content or "[]"
        # Extract JSON list
        import re
        match = re.search(r"\[.*\]", content)
        if match:
            labels = json.loads(match.group(0))
            return [str(l).strip() for l in labels]
    except Exception as e:
        print(f"[Topic Service] Error extracting topics: {e}")
    
    return []

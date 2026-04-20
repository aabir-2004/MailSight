from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.core.config import settings

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"


@router.get("/google", summary="Initiate Google OAuth 2.0 flow")
async def auth_google():
    """Redirects the browser to Google's OAuth consent screen."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": f"openid email profile {GMAIL_SCOPE}",
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/callback", summary="Handle OAuth callback")
async def auth_callback(code: str, state: str | None = None):
    """Exchanges the authorization code for tokens and creates a user session."""
    # In production: exchange code → tokens → upsert user in Supabase
    # For now, return a placeholder
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    return {"message": "OAuth callback received", "code": code[:8] + "..."}

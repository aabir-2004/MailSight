from supabase import create_client, Client
from app.core.config import settings

import os

# Global Supabase client using Service Role key
# If secrets are missing from the environment (e.g. Hugging Face configuration typo), we fallback to a safe dummy
# to ensure the container boots up successfully instead of throwing a fatal exception during uvicorn loading.
try:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        print("[WARNING] Supabase keys missing. Generating safely isolated local mock client...")
        supabase: Client = create_client("https://dummy-mock.supabase.co", "dummy-key")
    else:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
except Exception as e:
    print(f"Supabase Client Error: {e}")
    supabase: Client = create_client("https://dummy-mock.supabase.co", "dummy-key")

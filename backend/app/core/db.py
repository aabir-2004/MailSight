from supabase import create_client, Client
from app.core.config import settings

# Global Supabase client using Service Role key
# This client bypasses RLS, so it's safe for backend admin tasks like creating users
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

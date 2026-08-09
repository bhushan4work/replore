from supabase import Client, create_client

from app.config import settings


_supabase: Client | None = None


def get_supabase() -> Client:
    """
    Returns a singleton Supabase client.
    """

    global _supabase

    if _supabase is None:
        _supabase = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY,
        )

    return _supabase


supabase: Client = get_supabase()
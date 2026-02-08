"""OAuth client for Google login (authlib). State and token exchange handled by authlib."""

from __future__ import annotations

from functools import lru_cache

from authlib.integrations.starlette_client import OAuth

from app.core.config import get_settings


@lru_cache
def get_oauth() -> OAuth:
    settings = get_settings()
    oauth = OAuth()
    if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET:
        oauth.register(
            name="google",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )
    return oauth

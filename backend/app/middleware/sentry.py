import sentry_sdk
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.security import decode_access_token


class SentryUserContextMiddleware(BaseHTTPMiddleware):
    """
    Middleware that extracts user email from JWT and adds it to Sentry context.
    Does NOT query the database, just decodes the token.
    """

    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = decode_access_token(token)
                email = payload.get("sub")
                if email:
                    sentry_sdk.set_user({"email": email})
            except Exception:
                # Token invalid or expired - ignore, user is anonymous for Sentry
                pass

        return await call_next(request)


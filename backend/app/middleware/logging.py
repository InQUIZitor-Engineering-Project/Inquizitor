import logging
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware logging ONLY errors.
    Success logs are removed to reduce synchronous I/O overhead.
    Use Sentry for tracing and monitoring.
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start_time = time.time()
        try:
            return await call_next(request)
        except Exception as exc:
            process_time = time.time() - start_time
            logger.error(
                "✗ %s %s - Error: %s - Time: %.3fs",
                request.method,
                request.url.path,
                str(exc),
                process_time,
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(exc),
                    "process_time": process_time,
                },
            )
            raise

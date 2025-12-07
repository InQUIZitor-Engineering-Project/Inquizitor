import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware do logowania wszystkich requestów HTTP."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Loguj request
        logger.info(
            "→ %s %s",
            request.method,
            request.url.path,
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client": request.client.host if request.client else None,
            }
        )
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Loguj response
            logger.info(
                "← %s %s - Status: %d - Time: %.3fs",
                request.method,
                request.url.path,
                response.status_code,
                process_time,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "process_time": process_time,
                }
            )
            
            return response
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
                }
            )
            raise

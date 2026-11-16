import time
from typing import Callable, Awaitable
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import JSONResponse


class RateLimitMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        max_requests: int = 100,
        window_seconds: int = 60,
    ) -> None:
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = {}

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        client_ip = self._get_client_ip(scope)
        if self._is_rate_limited(client_ip):
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    def _get_client_ip(self, scope: Scope) -> str:
        headers = dict(scope.get("headers", []))
        forwarded = headers.get(b"x-forwarded-for")
        if forwarded:
            return forwarded.decode().split(",")[0].strip()
        client = scope.get("client")
        if client:
            return client[0]
        return "unknown"

    def _is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds

        if ip not in self._requests:
            self._requests[ip] = []

        self._requests[ip] = [t for t in self._requests[ip] if t > window_start]

        if len(self._requests[ip]) >= self.max_requests:
            return True

        self._requests[ip].append(now)
        return False

import time
from starlette.types import ASGIApp, Receive, Scope, Send
from app.core.logger import logger


class LoggingMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "/")

        async def send_wrapper(message: dict) -> None:
            if message["type"] == "http.response.start":
                status_code = message.get("status", 0)
                duration = (time.time() - start_time) * 1000
                logger.info(
                    "%s %s -> %d (%.2fms)",
                    method,
                    path,
                    status_code,
                    duration,
                )
            await send(message)

        await self.app(scope, receive, send_wrapper)

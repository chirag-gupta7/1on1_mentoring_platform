import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import routes as auth_routes
from app.api.v1.users import routes as user_routes
from app.api.v1.sessions import routes as session_routes
from app.api.v1.chat import routes as chat_routes
from app.api.v1.editor import routes as editor_routes
from app.api.v1.feedback import routes as feedback_routes
from app.api.v1.notifications import routes as notification_routes
from app.api.v1.subscriptions import routes as subscription_routes

from app.websocket.chat_socket import chat_handler
from app.websocket.editor_socket import editor_handler
from app.websocket.signaling_socket import signaling_handler
from app.websocket.presence_socket import presence_handler
from app.websocket.yjs_socket import yjs_handler

from app.core.config import get_settings
from app.core.logger import logger
from app.core.redis import close_redis, get_redis
from app.database.session import engine, Base
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import RateLimitMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Mentor-Student Platform...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await get_redis()
    logger.info("Application started successfully")
    yield
    logger.info("Shutting down...")
    await close_redis()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

# REST API routers
app.include_router(auth_routes.router, prefix=f"{settings.API_V1_PREFIX}/auth")
app.include_router(user_routes.router, prefix=f"{settings.API_V1_PREFIX}/users")
app.include_router(session_routes.router, prefix=f"{settings.API_V1_PREFIX}/sessions")
app.include_router(chat_routes.router, prefix=f"{settings.API_V1_PREFIX}/chat")
app.include_router(editor_routes.router, prefix=f"{settings.API_V1_PREFIX}/editor")
app.include_router(feedback_routes.router, prefix=f"{settings.API_V1_PREFIX}/feedback")
app.include_router(notification_routes.router, prefix=f"{settings.API_V1_PREFIX}/notifications")
app.include_router(subscription_routes.router, prefix=f"{settings.API_V1_PREFIX}/subscriptions")

# WebSocket endpoints
app.websocket("/ws/chat/{session_id}")(chat_handler)
app.websocket("/ws/editor/{session_id}")(editor_handler)
app.websocket("/ws/signaling/{session_id}")(signaling_handler)
app.websocket("/ws/presence/{session_id}")(presence_handler)
app.websocket("/ws/yjs/{session_id}")(yjs_handler)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)

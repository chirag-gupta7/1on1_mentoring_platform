from app.core.config import get_settings

settings = get_settings()

try:
    import redis.asyncio as aioredis

    redis_client: aioredis.Redis | None = None

    async def get_redis() -> aioredis.Redis | None:
        global redis_client
        if redis_client is None:
            try:
                redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                await redis_client.ping()
            except Exception:
                redis_client = None
        return redis_client

    async def close_redis() -> None:
        global redis_client
        if redis_client:
            await redis_client.close()
            redis_client = None

except ImportError:
    redis_client = None

    async def get_redis():
        return None

    async def close_redis():
        pass

from datetime import datetime, timedelta, timezone

from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core.logger import logger
from app.models.session import Session, SessionStatus
from app.models.notification import Notification


async def cleanup_expired_sessions(db_factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)

    async with db_factory() as db:
        result = await db.execute(
            update(Session)
            .where(
                Session.status == SessionStatus.SCHEDULED,
                Session.start_time < now,
            )
            .values(status=SessionStatus.CANCELLED)
        )
        await db.commit()
        count = result.rowcount

    logger.info("Cleaned up %d expired sessions", count)


async def cleanup_old_notifications(db_factory: async_sessionmaker[AsyncSession]) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)

    async with db_factory() as db:
        result = await db.execute(
            delete(Notification).where(
                Notification.is_read == True,
                Notification.created_at < cutoff,
            )
        )
        await db.commit()
        count = result.rowcount

    logger.info("Cleaned up %d old notifications", count)

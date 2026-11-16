import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core.logger import logger
from app.models.notification import NotificationType
from app.models.session import Session, SessionStatus
from app.services.notification_service import create_notification


async def send_session_reminders(db_factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(minutes=15)
    window_end = now + timedelta(minutes=16)

    async with db_factory() as db:
        result = await db.execute(
            select(Session).where(
                Session.status == SessionStatus.SCHEDULED,
                Session.start_time >= window_start,
                Session.start_time < window_end,
            )
        )
        sessions = result.scalars().all()

        for session in sessions:
            await create_notification(
                db,
                user_id=session.mentor_id,
                title="Upcoming Session",
                message=f"Your session '{session.title}' starts in 15 minutes.",
                ntype=NotificationType.SESSION_REMINDER,
                session_id=session.id,
            )
            if session.student_id:
                await create_notification(
                    db,
                    user_id=session.student_id,
                    title="Upcoming Session",
                    message=f"Your session '{session.title}' starts in 15 minutes.",
                    ntype=NotificationType.SESSION_REMINDER,
                    session_id=session.id,
                )

        await db.commit()

    logger.info("Sent %d session reminders", len(sessions))


def setup_scheduler() -> None:
    logger.info("Background scheduler initialized (placeholder)")

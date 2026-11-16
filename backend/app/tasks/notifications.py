from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.core.logger import logger
from app.models.notification import NotificationType
from app.models.session import Session, SessionStatus
from app.services.notification_service import create_notification


async def notify_session_start(db_factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)
    window_start = now
    window_end = now + timedelta(minutes=1)

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
                title="Session Starting",
                message=f"Your session '{session.title}' is starting now.",
                ntype=NotificationType.SESSION_REMINDER,
                session_id=session.id,
            )
            if session.student_id:
                await create_notification(
                    db,
                    user_id=session.student_id,
                    title="Session Starting",
                    message=f"Your session '{session.title}' is starting now.",
                    ntype=NotificationType.SESSION_REMINDER,
                    session_id=session.id,
                )

        await db.commit()

    logger.info("Sent %d session start notifications", len(sessions))


async def notify_feedback_request(db_factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=5)
    window_end = now

    async with db_factory() as db:
        result = await db.execute(
            select(Session).where(
                Session.status == SessionStatus.COMPLETED,
                Session.end_time >= window_start,
                Session.end_time < window_end,
            )
        )
        sessions = result.scalars().all()

        for session in sessions:
            if session.student_id:
                await create_notification(
                    db,
                    user_id=session.student_id,
                    title="Leave Feedback",
                    message=f"Please leave feedback for your session '{session.title}'.",
                    ntype=NotificationType.FEEDBACK_REQUEST,
                    session_id=session.id,
                )

        await db.commit()

    logger.info("Sent %d feedback request notifications", len(sessions))

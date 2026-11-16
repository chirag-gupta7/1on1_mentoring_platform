from uuid import UUID

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(db: AsyncSession, **kwargs) -> Notification:
    notification = Notification(**kwargs)
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def get_notifications_by_user(db: AsyncSession, user_id: UUID) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_notification_read(db: AsyncSession, notification_id: UUID) -> None:
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()


async def mark_all_notifications_read(db: AsyncSession, user_id: UUID) -> None:
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()


async def get_unread_notification_count(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    return result.scalar() or 0

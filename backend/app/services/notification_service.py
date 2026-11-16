from uuid import UUID
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.notification_repository import (
    create_notification as create_notification_repo,
    get_notifications_by_user as get_notifications_repo,
    mark_notification_read as mark_read_repo,
    mark_all_notifications_read as mark_all_read_repo,
    get_unread_notification_count as get_unread_repo,
)


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    title: str,
    message: str,
    ntype: str,
    session_id: Optional[UUID] = None,
) -> Notification:
    notification = await create_notification_repo(
        db,
        user_id=user_id,
        title=title,
        message=message,
        notification_type=ntype,
        related_session_id=session_id,
    )
    return notification


async def get_user_notifications(db: AsyncSession, user_id: UUID) -> list[Notification]:
    return await get_notifications_repo(db, user_id)


async def mark_as_read(
    db: AsyncSession, notification_id: UUID, user_id: UUID
) -> None:
    notifications = await get_notifications_repo(db, user_id)
    notification_ids = [n.id for n in notifications]
    if notification_id not in notification_ids:
        raise HTTPException(status_code=404, detail="Notification not found")

    await mark_read_repo(db, notification_id)


async def mark_all_read(db: AsyncSession, user_id: UUID) -> None:
    await mark_all_read_repo(db, user_id)


async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
    return await get_unread_repo(db, user_id)

from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.notification import NotificationListResponse
from app.services.notification_service import (
    get_user_notifications,
    mark_as_read,
    mark_all_read,
    get_unread_count,
)
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["notifications"])


@router.get("/")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifications = await get_user_notifications(db, current_user.id)
    unread_count = await get_unread_count(db, current_user.id)
    return NotificationListResponse(items=notifications, unread_count=unread_count)


@router.put("/read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await mark_all_read(db, current_user.id)
    return {"message": "All notifications marked as read"}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await mark_as_read(db, notification_id, current_user.id)
    return {"message": "Notification marked as read"}

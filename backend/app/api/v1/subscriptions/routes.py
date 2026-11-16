from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.models.subscription import Subscription
from app.repositories.notification_repository import create_notification
from app.api.v1.auth.dependencies import get_current_user
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

router = APIRouter(tags=["subscriptions"])


@router.post("/{mentor_id}", status_code=201)
async def subscribe_to_mentor(
    mentor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can subscribe to mentors")

    mentor = await db.get(User, mentor_id)
    if not mentor or mentor.role != "mentor":
        raise HTTPException(status_code=404, detail="Mentor not found")

    existing = await db.execute(
        select(Subscription).where(
            Subscription.student_id == current_user.id,
            Subscription.mentor_id == mentor_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already subscribed to this mentor")

    sub = Subscription(student_id=current_user.id, mentor_id=mentor_id)
    db.add(sub)
    await db.commit()

    await create_notification(
        db,
        user_id=mentor_id,
        title="New Subscriber",
        message=f"{current_user.full_name} has subscribed to you.",
        notification_type="new_subscriber",
    )

    return {"message": "Subscribed successfully", "mentor_id": str(mentor_id)}


@router.delete("/{mentor_id}")
async def unsubscribe_from_mentor(
    mentor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        delete(Subscription).where(
            Subscription.student_id == current_user.id,
            Subscription.mentor_id == mentor_id,
        )
    )
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return {"message": "Unsubscribed successfully"}


@router.get("/check/{mentor_id}")
async def check_subscription(
    mentor_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription).where(
            Subscription.student_id == current_user.id,
            Subscription.mentor_id == mentor_id,
        )
    )
    sub = result.scalar_one_or_none()
    return {"subscribed": sub is not None}


@router.get("/my-students")
async def get_my_students(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=403, detail="Only mentors can view their students")

    result = await db.execute(
        select(Subscription)
        .where(Subscription.mentor_id == current_user.id, Subscription.status == "active")
        .options(selectinload(Subscription.student))
    )
    subs = result.scalars().all()

    students = []
    for sub in subs:
        if sub.student:
            students.append({
                "id": str(sub.student.id),
                "full_name": sub.student.full_name,
                "email": sub.student.email,
                "avatar_url": sub.student.avatar_url,
                "subscribed_at": sub.created_at.isoformat() if sub.created_at else None,
            })

    return students


@router.get("/my-mentors")
async def get_my_mentors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view their mentors")

    result = await db.execute(
        select(Subscription)
        .where(Subscription.student_id == current_user.id, Subscription.status == "active")
        .options(selectinload(Subscription.mentor))
    )
    subs = result.scalars().all()

    mentors = []
    for sub in subs:
        if sub.mentor:
            mentors.append({
                "id": str(sub.mentor.id),
                "full_name": sub.mentor.full_name,
                "email": sub.mentor.email,
                "avatar_url": sub.mentor.avatar_url,
                "subscribed_at": sub.created_at.isoformat() if sub.created_at else None,
            })

    return mentors

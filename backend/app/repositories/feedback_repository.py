from uuid import UUID
from typing import Optional

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Feedback


async def create_feedback(db: AsyncSession, **kwargs) -> Feedback:
    feedback = Feedback(**kwargs)
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return feedback


async def get_feedback_by_mentor(db: AsyncSession, mentor_id: UUID) -> list[Feedback]:
    result = await db.execute(select(Feedback).where(Feedback.mentor_id == mentor_id))
    return list(result.scalars().all())


async def get_feedback_by_session(db: AsyncSession, session_id: UUID) -> Optional[Feedback]:
    result = await db.execute(select(Feedback).where(Feedback.session_id == session_id))
    return result.scalar_one_or_none()


async def get_average_rating(db: AsyncSession, mentor_id: UUID) -> float:
    result = await db.execute(
        select(func.avg(Feedback.rating)).where(Feedback.mentor_id == mentor_id)
    )
    avg = result.scalar()
    return float(avg) if avg is not None else 0.0

from uuid import UUID
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Feedback
from app.repositories.feedback_repository import (
    create_feedback,
    get_feedback_by_mentor,
    get_feedback_by_session,
)
from app.repositories.session_repository import get_session_by_id
from app.schemas.feedback import FeedbackCreate


async def submit_feedback(
    db: AsyncSession, student_id: UUID, data: FeedbackCreate
) -> Feedback:
    session = await get_session_by_id(db, data.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != student_id:
        raise HTTPException(status_code=403, detail="You can only submit feedback for your own sessions")

    existing = await get_feedback_by_session(db, data.session_id)
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this session")

    feedback = await create_feedback(
        db,
        session_id=data.session_id,
        mentor_id=session.mentor_id,
        student_id=student_id,
        rating=data.rating,
        review=data.review,
    )
    return feedback


async def get_mentor_feedback(db: AsyncSession, mentor_id: UUID) -> list[Feedback]:
    return await get_feedback_by_mentor(db, mentor_id)


async def get_session_feedback(
    db: AsyncSession, session_id: UUID
) -> Optional[Feedback]:
    return await get_feedback_by_session(db, session_id)

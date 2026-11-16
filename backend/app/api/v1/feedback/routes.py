from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.services.feedback_service import submit_feedback, get_mentor_feedback
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    feedback = await submit_feedback(db, current_user.id, data)
    return feedback


@router.get("/mentor/{mentor_id}")
async def get_feedback_for_mentor(mentor_id: UUID, db: AsyncSession = Depends(get_db)):
    feedbacks = await get_mentor_feedback(db, mentor_id)
    return feedbacks

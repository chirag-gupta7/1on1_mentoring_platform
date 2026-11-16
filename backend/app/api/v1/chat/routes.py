from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.message import ChatHistoryResponse
from app.services.chat_service import get_history
from app.services.session_service import get_session
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["chat"])


@router.get("/{session_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await get_session(db, session_id)
    if session.mentor_id != current_user.id and session.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this session")
    messages = await get_history(db, session_id)
    return ChatHistoryResponse(items=messages)

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse, SessionRequest
from app.services.session_service import (
    create_session,
    get_session,
    get_my_sessions,
    update_session,
    delete_session,
    join_session,
    end_session,
    cancel_session,
)
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session_route(
    data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentors can create sessions")
    session = await create_session(db, current_user.id, data)
    return session


@router.post("/request", response_model=SessionResponse, status_code=201)
async def request_session_route(
    data: SessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can request sessions")
    from uuid import uuid4
    from app.repositories.session_repository import create_session as create_session_repo
    from app.models.session import SessionStatus
    from app.repositories.notification_repository import create_notification

    session = await create_session_repo(
        db,
        mentor_id=data.mentor_id,
        student_id=current_user.id,
        title=data.title,
        description=data.description,
        language=data.language,
        start_time=data.start_time,
        room_id=str(uuid4()),
        status=SessionStatus.CREATED,
    )

    await create_notification(
        db,
        user_id=data.mentor_id,
        title="New Session Request",
        message=f"A student has requested a session: {data.title}",
        notification_type="session_request",
        related_session_id=session.id,
    )

    from app.repositories.session_repository import get_session_by_id
    return await get_session_by_id(db, session.id)


@router.get("/my")
async def get_my_sessions_route(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await get_my_sessions(db, current_user.id, current_user.role)
    return sessions


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_route(session_id: UUID, db: AsyncSession = Depends(get_db)):
    session = await get_session(db, session_id)
    return session


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session_route(
    session_id: UUID,
    data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentors can update sessions")
    updated = await update_session(db, session_id, current_user.id, data)
    return updated


@router.post("/{session_id}/approve", response_model=SessionResponse)
async def approve_session_route(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentors can approve sessions")
    from app.repositories.session_repository import get_session_by_id, update_session as update_session_repo
    from app.repositories.notification_repository import create_notification

    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")

    await update_session_repo(db, session_id, {"status": "scheduled"})

    if session.student_id:
        await create_notification(
            db,
            user_id=session.student_id,
            title="Session Approved",
            message=f'Your session "{session.title}" has been approved by the mentor.',
            notification_type="session_approved",
            related_session_id=session.id,
        )

    return await get_session_by_id(db, session_id)


@router.post("/{session_id}/reschedule", response_model=SessionResponse)
async def reschedule_session_route(
    session_id: UUID,
    data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentors can reschedule sessions")
    from app.repositories.session_repository import get_session_by_id, update_session as update_session_repo
    from app.repositories.notification_repository import create_notification

    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")

    update_data = data.model_dump(exclude_unset=True)
    update_data["status"] = "scheduled"
    await update_session_repo(db, session_id, update_data)

    new_time = data.start_time.strftime("%B %d at %H:%M") if data.start_time else "a new time"
    if session.student_id:
        await create_notification(
            db,
            user_id=session.student_id,
            title="Session Rescheduled",
            message=f'Your session "{session.title}" has been rescheduled to {new_time}.',
            notification_type="session_rescheduled",
            related_session_id=session.id,
        )

    return await get_session_by_id(db, session_id)


@router.delete("/{session_id}", status_code=204)
async def delete_session_route(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "mentor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentors can delete sessions")
    await delete_session(db, session_id, current_user.id)


@router.post("/{session_id}/join", response_model=SessionResponse)
async def join_session_route(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can join sessions")
    session = await join_session(db, session_id, current_user.id)
    return session


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session_route(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await end_session(db, session_id, current_user.id)
    return session


@router.post("/{session_id}/cancel", response_model=SessionResponse)
async def cancel_session_route(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await cancel_session(db, session_id, current_user.id)
    return session

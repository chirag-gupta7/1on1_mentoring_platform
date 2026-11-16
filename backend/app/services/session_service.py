from uuid import UUID, uuid4
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.session import Session, SessionStatus
from app.models.session_participant import SessionParticipant
from app.repositories.session_repository import (
    create_session as create_session_repo,
    get_session_by_id,
    get_sessions_by_mentor,
    get_sessions_by_student,
    update_session as update_session_repo,
    delete_session as delete_session_repo,
    add_participant,
)
from app.repositories.notification_repository import create_notification as create_notification_repo
from app.schemas.session import SessionCreate, SessionUpdate


async def create_session(db: AsyncSession, mentor_id: UUID, data: SessionCreate) -> Session:
    room_id = str(uuid4())

    session = await create_session_repo(
        db,
        mentor_id=mentor_id,
        student_id=data.student_id,
        title=data.title,
        description=data.description,
        language=data.language,
        start_time=data.start_time,
        room_id=room_id,
        status=SessionStatus.SCHEDULED,
    )

    if data.student_id:
        await create_notification_repo(
            db,
            user_id=data.student_id,
            title="New Session Invitation",
            message=f"You have been invited to a session: {data.title}",
            notification_type="session_invite",
            related_session_id=session.id,
        )

    return session


async def get_session(db: AsyncSession, session_id: UUID) -> Session:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


async def get_my_sessions(db: AsyncSession, user_id: UUID, role: str) -> list[Session]:
    if role == "mentor":
        sessions = await get_sessions_by_mentor(db, user_id)
    elif role == "student":
        sessions = await get_sessions_by_student(db, user_id)
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    return list(sessions)


async def update_session(
    db: AsyncSession, session_id: UUID, user_id: UUID, data: SessionUpdate
) -> Session:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != user_id:
        raise HTTPException(status_code=403, detail="Only the mentor can update this session")

    update_data = data.model_dump(exclude_unset=True)
    updated = await update_session_repo(db, session_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")

    if update_data.get("status") == "active" and session.student_id:
        await create_notification_repo(
            db,
            user_id=session.student_id,
            title="Session Started",
            message=f'The session "{session.title}" has started.',
            notification_type="session_started",
            related_session_id=session.id,
        )

    if "start_time" in update_data and update_data.get("status") != "active" and session.student_id:
        new_time = update_data["start_time"].strftime("%B %d at %H:%M") if hasattr(update_data["start_time"], "strftime") else str(update_data["start_time"])
        await create_notification_repo(
            db,
            user_id=session.student_id,
            title="Session Rescheduled",
            message=f'The session "{session.title}" has been rescheduled to {new_time}.',
            notification_type="session_rescheduled",
            related_session_id=session.id,
        )

    return updated


async def delete_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> bool:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != user_id:
        raise HTTPException(status_code=403, detail="Only the mentor can delete this session")

    if session.student_id:
        await create_notification_repo(
            db,
            user_id=session.student_id,
            title="Session Deleted",
            message=f'The session "{session.title}" has been deleted by the mentor.',
            notification_type="session_deleted",
            related_session_id=session.id,
        )

    result = await delete_session_repo(db, session_id)
    return result


async def join_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> Session:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status in (SessionStatus.COMPLETED, SessionStatus.CANCELLED):
        raise HTTPException(status_code=400, detail="Cannot join a completed or cancelled session")

    if session.student_id is not None and str(session.student_id) != str(user_id):
        raise HTTPException(status_code=403, detail="This session already has a student assigned")

    if session.student_id is None:
        await update_session_repo(db, session_id, {"student_id": user_id})

    await add_participant(db, session_id, user_id)

    await update_session_repo(db, session_id, {"status": SessionStatus.ACTIVE, "start_time": datetime.now(timezone.utc)})

    await create_notification_repo(
        db,
        user_id=session.mentor_id,
        title="Student Joined",
        message=f'A student has joined the session "{session.title}".',
        notification_type="student_joined",
        related_session_id=session.id,
    )

    return await get_session_by_id(db, session_id)


async def end_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> Session:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != user_id:
        raise HTTPException(status_code=403, detail="Only the mentor can end this session")

    await update_session_repo(
        db,
        session_id,
        {
            "status": SessionStatus.COMPLETED,
            "end_time": datetime.now(timezone.utc),
        },
    )

    if session.student_id:
        await create_notification_repo(
            db,
            user_id=session.student_id,
            title="Session Ended",
            message=f'The session "{session.title}" has ended.',
            notification_type="session_ended",
            related_session_id=session.id,
        )

    return await get_session_by_id(db, session_id)


async def cancel_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> Session:
    session = await get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.mentor_id != user_id:
        raise HTTPException(status_code=403, detail="Only the mentor can cancel this session")

    await update_session_repo(db, session_id, {"status": SessionStatus.CANCELLED})

    if session.student_id:
        await create_notification_repo(
            db,
            user_id=session.student_id,
            title="Session Cancelled",
            message=f'The session "{session.title}" has been cancelled by the mentor.',
            notification_type="session_cancelled",
            related_session_id=session.id,
        )

    return await get_session_by_id(db, session_id)

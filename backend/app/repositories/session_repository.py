from uuid import UUID
from typing import Optional

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.session import Session
from app.models.session_participant import SessionParticipant


async def create_session(db: AsyncSession, **kwargs) -> Session:
    session = Session(**kwargs)
    db.add(session)
    await db.flush()
    result = await db.execute(
        select(Session)
        .where(Session.id == session.id)
        .options(selectinload(Session.mentor), selectinload(Session.student))
    )
    return result.scalar_one()


async def get_session_by_id(db: AsyncSession, session_id: UUID) -> Optional[Session]:
    stmt = (
        select(Session)
        .where(Session.id == session_id)
        .options(selectinload(Session.mentor), selectinload(Session.student))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_sessions_by_mentor(db: AsyncSession, mentor_id: UUID, status: Optional[str] = None) -> list[Session]:
    stmt = select(Session).where(Session.mentor_id == mentor_id)
    if status is not None:
        stmt = stmt.where(Session.status == status)
    stmt = stmt.options(selectinload(Session.mentor), selectinload(Session.student))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_sessions_by_student(db: AsyncSession, student_id: UUID, status: Optional[str] = None) -> list[Session]:
    stmt = select(Session).where(Session.student_id == student_id)
    if status is not None:
        stmt = stmt.where(Session.status == status)
    stmt = stmt.options(selectinload(Session.mentor), selectinload(Session.student))
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_session(db: AsyncSession, session_id: UUID, update_data: dict) -> Optional[Session]:
    await db.execute(update(Session).where(Session.id == session_id).values(**update_data))
    await db.flush()
    result = await db.execute(select(Session).where(Session.id == session_id).options(selectinload(Session.mentor), selectinload(Session.student)))
    return result.scalar_one_or_none()


async def delete_session(db: AsyncSession, session_id: UUID) -> bool:
    result = await db.execute(delete(Session).where(Session.id == session_id))
    await db.flush()
    return result.rowcount > 0


async def get_upcoming_sessions(db: AsyncSession, user_id: UUID) -> list[Session]:
    stmt = (
        select(Session)
        .where(
            Session.start_time > func.now(),
            (Session.mentor_id == user_id) | (Session.student_id == user_id),
        )
        .options(selectinload(Session.mentor), selectinload(Session.student))
        .order_by(Session.start_time.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_session_by_room_id(db: AsyncSession, room_id: str) -> Optional[Session]:
    result = await db.execute(select(Session).where(Session.room_id == room_id))
    return result.scalar_one_or_none()


async def add_participant(db: AsyncSession, session_id: UUID, user_id: UUID) -> SessionParticipant:
    participant = SessionParticipant(session_id=session_id, user_id=user_id)
    db.add(participant)
    await db.flush()
    await db.refresh(participant)
    return participant


async def remove_participant(db: AsyncSession, session_id: UUID, user_id: UUID) -> None:
    await db.execute(
        delete(SessionParticipant).where(
            SessionParticipant.session_id == session_id,
            SessionParticipant.user_id == user_id,
        )
    )
    await db.flush()

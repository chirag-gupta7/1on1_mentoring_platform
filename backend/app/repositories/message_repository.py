from uuid import UUID
from datetime import datetime

from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.message import Message


async def save_message(db: AsyncSession, session_id: UUID, sender_id: UUID, content: str, message_type: str = "text") -> Message:
    message = Message(
        session_id=session_id,
        sender_id=sender_id,
        content=content,
        message_type=message_type,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def get_chat_history(db: AsyncSession, session_id: UUID, limit: int = 100) -> list[Message]:
    stmt = (
        select(Message)
        .where(Message.session_id == session_id)
        .options(selectinload(Message.sender))
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_messages_since(db: AsyncSession, session_id: UUID, since: datetime) -> list[Message]:
    stmt = (
        select(Message)
        .where(Message.session_id == session_id, Message.created_at >= since)
        .options(selectinload(Message.sender))
        .order_by(Message.created_at.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

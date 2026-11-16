from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories.message_repository import save_message, get_chat_history


async def save_and_broadcast(
    db: AsyncSession, session_id: UUID, sender_id: UUID, content: str
) -> Message:
    message = await save_message(db, session_id=session_id, sender_id=sender_id, content=content)
    return message


async def get_history(
    db: AsyncSession, session_id: UUID, limit: int = 100
) -> list[Message]:
    messages = await get_chat_history(db, session_id=session_id, limit=limit)
    return messages

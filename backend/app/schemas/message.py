from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    sender_id: UUID
    content: str
    message_type: str
    sender: UserPublic
    created_at: datetime


class ChatHistoryResponse(BaseModel):
    items: List[MessageResponse]

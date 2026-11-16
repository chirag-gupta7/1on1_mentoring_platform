from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class SessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    language: str
    start_time: datetime
    student_id: Optional[UUID] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    start_time: Optional[datetime] = None
    student_id: Optional[UUID] = None
    status: Optional[str] = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    mentor_id: UUID
    student_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    language: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    room_id: str
    mentor: UserPublic
    student: Optional[UserPublic] = None
    created_at: datetime


class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int


class JoinSessionRequest(BaseModel):
    pass


class SessionRequest(BaseModel):
    mentor_id: UUID
    title: str
    description: Optional[str] = None
    language: str
    start_time: datetime


class SessionStatusUpdate(BaseModel):
    status: str

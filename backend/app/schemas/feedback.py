from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    session_id: UUID
    rating: int = Field(ge=1, le=5)
    review: Optional[str] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    mentor_id: UUID
    student_id: UUID
    rating: int
    review: Optional[str] = None
    created_at: datetime

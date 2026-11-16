import uuid
import enum

from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.session import Base


class SessionStatus(str, enum.Enum):
    CREATED = "created"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(50), nullable=True)
    status = Column(String(20), default=SessionStatus.CREATED.value, server_default="created", nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    room_id = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="mentor_sessions")
    student = relationship("User", foreign_keys=[student_id], back_populates="student_sessions")
    participants = relationship("SessionParticipant", back_populates="session", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    code_snapshots = relationship("CodeSnapshot", back_populates="session", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="session", cascade="all, delete-orphan")
    recordings = relationship("Recording", back_populates="session", cascade="all, delete-orphan")

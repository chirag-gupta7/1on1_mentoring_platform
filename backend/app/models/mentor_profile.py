import uuid

from sqlalchemy import Column, String, Text, Float, Integer, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.session import Base


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    expertise = Column(JSON, nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    rating = Column(Float, default=0.0, server_default="0.0")
    total_sessions = Column(Integer, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="mentor_profile")

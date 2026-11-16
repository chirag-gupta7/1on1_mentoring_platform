from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["student", "mentor"]


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[Literal["student", "mentor"]] = None
    password: Optional[str] = Field(default=None, min_length=6)
    bio: Optional[str] = None
    expertise: Optional[str] = None
    hourly_rate: Optional[float] = None
    education: Optional[str] = None
    goals: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

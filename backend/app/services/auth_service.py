from uuid import UUID
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole
from app.models.mentor_profile import MentorProfile
from app.models.student_profile import StudentProfile
from app.repositories.user_repository import get_user_by_email, get_user_by_id, update_user
from app.schemas.auth import RegisterRequest
from app.utils.email import send_email


async def register_user(db: AsyncSession, data: RegisterRequest) -> tuple[User, str, str]:
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = get_password_hash(data.password)

    user = User(
        email=data.email,
        password_hash=password_hash,
        full_name=data.full_name,
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    if data.role == UserRole.MENTOR:
        profile = MentorProfile(user_id=user.id)
    else:
        profile = StudentProfile(user_id=user.id)
    db.add(profile)
    await db.commit()

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return user, access_token, refresh_token


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, str, str]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return user, access_token, refresh_token


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    user = await get_user_by_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token = create_access_token(str(user.id))
    new_refresh_token = create_refresh_token(str(user.id))

    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}


async def get_current_user(db: AsyncSession, token: str) -> User:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    user = await get_user_by_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


async def change_password(db: AsyncSession, user_id: UUID, old_pw: str, new_pw: str) -> None:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(old_pw, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")

    new_hash = get_password_hash(new_pw)
    await update_user(db, user_id, {"password_hash": new_hash})


async def forgot_password(db: AsyncSession, email: str) -> None:
    user = await get_user_by_email(db, email)
    if not user:
        return

    settings = get_settings()
    reset_token = create_access_token(
        str(user.id),
        expires_delta=timedelta(minutes=15),
    )

    reset_link = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/reset-password?token={reset_token}"

    body = f"""
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password (valid for 15 minutes):</p>
    <a href="{reset_link}">{reset_link}</a>
    <p>If you did not request this, ignore this email.</p>
    """

    await send_email(user.email, "Password Reset - MentorHub", body)


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = await get_user_by_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    new_hash = get_password_hash(new_password)
    await update_user(db, user.id, {"password_hash": new_hash})


async def verify_email(db: AsyncSession, token: str) -> None:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = await get_user_by_id(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    await update_user(db, user.id, {"is_verified": True})

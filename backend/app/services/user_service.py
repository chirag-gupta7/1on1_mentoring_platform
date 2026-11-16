from uuid import UUID
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User, UserRole
from app.models.mentor_profile import MentorProfile
from app.models.student_profile import StudentProfile
from app.repositories.user_repository import get_user_by_id, update_user, delete_user


async def get_user_profile(db: AsyncSession, user_id: UUID) -> dict:
    user = await db.execute(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.mentor_profile), selectinload(User.student_profile))
    )
    user = user.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile_data = {}
    if user.role == UserRole.MENTOR and user.mentor_profile:
        mp = user.mentor_profile
        profile_data = {
            "bio": mp.bio,
            "expertise": mp.expertise,
            "hourly_rate": str(mp.hourly_rate) if mp.hourly_rate else None,
            "rating": mp.rating,
            "total_sessions": mp.total_sessions,
        }
    elif user.role == UserRole.STUDENT and user.student_profile:
        sp = user.student_profile
        profile_data = {
            "education": sp.education,
            "goals": sp.goals,
            "learning_preferences": sp.learning_preferences,
        }

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "avatar_url": user.avatar_url,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "profile": profile_data,
    }


async def update_user_profile(db: AsyncSession, user_id: UUID, data) -> User:
    from app.repositories.mentor_profile_repository import upsert_mentor_profile
    from app.repositories.student_profile_repository import upsert_student_profile

    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    profile_fields = {"bio", "expertise", "hourly_rate", "education", "goals"}
    user_fields = {k: v for k, v in update_data.items() if k not in profile_fields}

    if "password" in user_fields:
        raise HTTPException(status_code=400, detail="Use /change-password endpoint to update password")

    if user_fields:
        updated = await update_user(db, user_id, user_fields)
    else:
        updated = user

    role_profile = {}
    if data.bio is not None:
        role_profile["bio"] = data.bio
    if data.expertise is not None:
        role_profile["expertise"] = [s.strip() for s in data.expertise.split(",") if s.strip()]
    if data.hourly_rate is not None:
        role_profile["hourly_rate"] = data.hourly_rate
    if data.education is not None:
        role_profile["education"] = data.education
    if data.goals is not None:
        role_profile["goals"] = data.goals

    if role_profile:
        if user.role == UserRole.MENTOR:
            await upsert_mentor_profile(db, user_id, role_profile)
        elif user.role == UserRole.STUDENT:
            await upsert_student_profile(db, user_id, role_profile)

    await db.refresh(updated)
    return updated


async def delete_user_account(db: AsyncSession, user_id: UUID) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await delete_user(db, user_id)
    return result


async def get_mentors(
    db: AsyncSession, skill: Optional[str] = None, skip: int = 0, limit: int = 20
) -> list[dict]:
    stmt = (
        select(User)
        .where(User.role == UserRole.MENTOR)
        .options(selectinload(User.mentor_profile))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    mentors = list(result.scalars().all())

    output = []
    for mentor in mentors:
        mp = mentor.mentor_profile
        item = {
            "id": str(mentor.id),
            "email": mentor.email,
            "full_name": mentor.full_name,
            "avatar_url": mentor.avatar_url,
            "bio": mp.bio if mp else None,
            "expertise": mp.expertise if mp else None,
            "hourly_rate": str(mp.hourly_rate) if mp and mp.hourly_rate else None,
            "rating": mp.rating if mp else 0.0,
            "total_sessions": mp.total_sessions if mp else 0,
        }
        if skill:
            expertise = item["expertise"] or []
            if isinstance(expertise, list) and skill.lower() not in [s.lower() for s in expertise]:
                continue
        output.append(item)

    return output


async def get_mentor_detail(db: AsyncSession, mentor_id: UUID) -> dict:
    stmt = (
        select(User)
        .where(User.id == mentor_id, User.role == UserRole.MENTOR)
        .options(selectinload(User.mentor_profile))
    )
    result = await db.execute(stmt)
    mentor = result.scalar_one_or_none()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    mp = mentor.mentor_profile
    return {
        "id": str(mentor.id),
        "email": mentor.email,
        "full_name": mentor.full_name,
        "avatar_url": mentor.avatar_url,
        "is_verified": mentor.is_verified,
        "created_at": mentor.created_at.isoformat() if mentor.created_at else None,
        "profile": {
            "bio": mp.bio if mp else None,
            "expertise": mp.expertise if mp else None,
            "hourly_rate": str(mp.hourly_rate) if mp and mp.hourly_rate else None,
            "rating": mp.rating if mp else 0.0,
            "total_sessions": mp.total_sessions if mp else 0,
        },
    }


async def search_mentors(
    db: AsyncSession, query: str, skills: Optional[list[str]] = None
) -> list[User]:
    stmt = (
        select(User)
        .where(
            User.role == UserRole.MENTOR,
            or_(
                User.full_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
            ),
        )
        .options(selectinload(User.mentor_profile))
    )
    result = await db.execute(stmt)
    mentors = list(result.scalars().all())

    if skills:
        filtered = []
        for mentor in mentors:
            mp = mentor.mentor_profile
            if mp and mp.expertise:
                expertise_lower = [s.lower() for s in mp.expertise]
                if any(s.lower() in expertise_lower for s in skills):
                    filtered.append(mentor)
        return filtered

    return mentors

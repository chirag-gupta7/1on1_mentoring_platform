from uuid import UUID
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mentor_profile import MentorProfile


async def create_mentor_profile(db: AsyncSession, **kwargs) -> MentorProfile:
    profile = MentorProfile(**kwargs)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_mentor_profile_by_user_id(db: AsyncSession, user_id: UUID) -> Optional[MentorProfile]:
    result = await db.execute(select(MentorProfile).where(MentorProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def update_mentor_profile(db: AsyncSession, user_id: UUID, update_data: dict) -> Optional[MentorProfile]:
    stmt = (
        update(MentorProfile)
        .where(MentorProfile.user_id == user_id)
        .values(**update_data)
        .returning(MentorProfile)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one_or_none()


async def upsert_mentor_profile(db: AsyncSession, user_id: UUID, update_data: dict) -> MentorProfile:
    existing = await get_mentor_profile_by_user_id(db, user_id)
    if existing:
        updated = await update_mentor_profile(db, user_id, update_data)
        if updated:
            return updated
    return await create_mentor_profile(db, user_id=user_id, **update_data)

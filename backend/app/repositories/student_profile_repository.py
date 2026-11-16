from uuid import UUID
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_profile import StudentProfile


async def create_student_profile(db: AsyncSession, **kwargs) -> StudentProfile:
    profile = StudentProfile(**kwargs)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_student_profile_by_user_id(db: AsyncSession, user_id: UUID) -> Optional[StudentProfile]:
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def update_student_profile(db: AsyncSession, user_id: UUID, update_data: dict) -> Optional[StudentProfile]:
    stmt = (
        update(StudentProfile)
        .where(StudentProfile.user_id == user_id)
        .values(**update_data)
        .returning(StudentProfile)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one_or_none()


async def upsert_student_profile(db: AsyncSession, user_id: UUID, update_data: dict) -> StudentProfile:
    existing = await get_student_profile_by_user_id(db, user_id)
    if existing:
        updated = await update_student_profile(db, user_id, update_data)
        if updated:
            return updated
    return await create_student_profile(db, user_id=user_id, **update_data)

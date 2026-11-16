from uuid import UUID
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, password_hash: str, full_name: str, role: str) -> User:
    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user_id: UUID, update_data: dict) -> Optional[User]:
    stmt = update(User).where(User.id == user_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def delete_user(db: AsyncSession, user_id: UUID) -> bool:
    stmt = delete(User).where(User.id == user_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount > 0


async def get_users_by_role(db: AsyncSession, role: str, skip: int = 0, limit: int = 20) -> list[User]:
    stmt = select(User).where(User.role == role).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_email_verified(db: AsyncSession, user_id: UUID) -> None:
    stmt = update(User).where(User.id == user_id).values(is_verified=True)
    await db.execute(stmt)
    await db.commit()

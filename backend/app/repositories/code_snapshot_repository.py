from uuid import UUID
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.code_snapshot import CodeSnapshot


async def create_snapshot(db: AsyncSession, **kwargs) -> CodeSnapshot:
    snapshot = CodeSnapshot(**kwargs)
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_latest_snapshot(db: AsyncSession, session_id: UUID) -> Optional[CodeSnapshot]:
    stmt = (
        select(CodeSnapshot)
        .where(CodeSnapshot.session_id == session_id)
        .order_by(CodeSnapshot.version.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_snapshots_by_session(db: AsyncSession, session_id: UUID) -> list[CodeSnapshot]:
    stmt = (
        select(CodeSnapshot)
        .where(CodeSnapshot.session_id == session_id)
        .order_by(CodeSnapshot.version.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())

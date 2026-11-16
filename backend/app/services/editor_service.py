from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.code_snapshot import CodeSnapshot
from app.repositories.code_snapshot_repository import (
    create_snapshot,
    get_latest_snapshot,
    get_snapshots_by_session,
)


async def save_snapshot(
    db: AsyncSession, session_id: UUID, code: str, language: str, version: int
) -> CodeSnapshot:
    snapshot = await create_snapshot(
        db,
        session_id=session_id,
        code=code,
        language=language,
        version=version,
    )
    return snapshot


async def get_latest_snapshot(
    db: AsyncSession, session_id: UUID
) -> Optional[CodeSnapshot]:
    return await get_latest_snapshot(db, session_id)


async def get_snapshots(
    db: AsyncSession, session_id: UUID
) -> list[CodeSnapshot]:
    return await get_snapshots_by_session(db, session_id)

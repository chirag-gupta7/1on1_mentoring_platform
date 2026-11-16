from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.database.session import get_db, AsyncSession
from app.services.editor_service import get_snapshots, save_snapshot

router = APIRouter(tags=["editor"])


class SnapshotCreate(BaseModel):
    code: str
    language: str
    version: int


class SnapshotResponse(BaseModel):
    id: UUID
    session_id: UUID
    code: str
    language: str
    version: int


@router.get("/{session_id}/snapshots")
async def get_code_snapshots(session_id: UUID, db: AsyncSession = Depends(get_db)):
    snapshots = await get_snapshots(db, session_id)
    return snapshots


@router.post("/{session_id}/snapshots", status_code=201)
async def save_code_snapshot(
    session_id: UUID,
    data: SnapshotCreate,
    db: AsyncSession = Depends(get_db),
):
    snapshot = await save_snapshot(db, session_id, data.code, data.language, data.version)
    return snapshot

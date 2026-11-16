from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.user import UserUpdate
from app.services.user_service import (
    get_user_profile,
    update_user_profile,
    delete_user_account,
    get_mentors,
    get_mentor_detail,
    search_mentors,
)
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["users"])


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await get_user_profile(db, current_user.id)


@router.put("/me")
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user_profile(db, current_user.id, data)
    return {"id": str(updated.id), "email": updated.email, "full_name": updated.full_name, "role": updated.role}


@router.delete("/me", status_code=204)
async def delete_my_account(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await delete_user_account(db, current_user.id)


@router.get("/mentors")
async def list_mentors(
    skill: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    mentors = await get_mentors(db, skill=skill)
    return mentors


@router.get("/mentors/search")
async def search_mentors_route(
    q: str = Query(..., alias="q"),
    skills: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    skills_list = [s.strip() for s in skills.split(",")] if skills else None
    mentors = await search_mentors(db, query=q, skills=skills_list)
    return [
        {
            "id": str(m.id),
            "email": m.email,
            "full_name": m.full_name,
            "avatar_url": m.avatar_url,
            "expertise": m.mentor_profile.expertise if m.mentor_profile else None,
            "rating": m.mentor_profile.rating if m.mentor_profile else 0.0,
            "bio": m.mentor_profile.bio if m.mentor_profile else None,
        }
        for m in mentors
    ]


@router.get("/mentors/{mentor_id}")
async def get_mentor_by_id(mentor_id: UUID, db: AsyncSession = Depends(get_db)):
    return await get_mentor_detail(db, mentor_id)

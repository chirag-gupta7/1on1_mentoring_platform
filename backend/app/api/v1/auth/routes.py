from fastapi import APIRouter, Depends

from app.database.session import get_db, AsyncSession
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    register_user,
    login_user,
    refresh_access_token,
    forgot_password,
    reset_password,
    verify_email,
)
from app.api.v1.auth.dependencies import get_current_user

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await register_user(db, data)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, access_token, refresh_token = await login_user(db, data.email, data.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    tokens = await refresh_access_token(db, data.refresh_token)
    return TokenResponse(**tokens)


@router.post("/logout")
async def logout():
    return {"message": "Token should be invalidated on the client side"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password")
async def forgot_password_route(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    await forgot_password(db, data.email)
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password_route(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await reset_password(db, data.token, data.new_password)
    return {"message": "Password has been reset successfully"}


@router.post("/verify-email")
async def verify_email_route(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    await verify_email(db, data.token)
    return {"message": "Email verified successfully"}

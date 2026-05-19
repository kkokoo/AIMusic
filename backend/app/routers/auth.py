from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.credit_transaction import CreditTransaction
from app.models.system_config import SystemConfig
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
)
from app.utils.auth import hash_password, verify_password, create_token, get_current_user
from app.utils.response import ApiResponse

router = APIRouter()


def user_to_response(user: User) -> dict:
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        credits=user.credits,
        total_credits_earned=user.total_credits_earned,
        total_credits_spent=user.total_credits_spent,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at.isoformat() + 'Z',
        updated_at=user.updated_at.isoformat() + 'Z',
    ).model_dump()


@router.post("/api/auth/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == req.email))
    if existing:
        return ApiResponse.fail("邮箱已注册")

    existing_name = await db.scalar(select(User).where(User.username == req.username))
    if existing_name:
        return ApiResponse.fail("用户名已被使用")

    initial_credits = 0.0
    config_result = await db.scalar(select(SystemConfig).where(SystemConfig.key == "initial_credits"))
    if config_result:
        initial_credits = float(config_result.value)

    user = User(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        credits=initial_credits,
        total_credits_earned=initial_credits,
    )
    db.add(user)
    await db.flush()

    if initial_credits > 0:
        txn = CreditTransaction(
            user_id=user.id,
            amount=initial_credits,
            balance_after=initial_credits,
            type="initial",
            description="注册赠送积分",
        )
        db.add(txn)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.is_admin)
    return ApiResponse.ok({
        "token": token,
        "user": user_to_response(user),
    })


@router.post("/api/auth/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == req.email))
    if not user:
        return ApiResponse.fail("邮箱或密码错误")

    if not user.is_active:
        return ApiResponse.fail("账户已被禁用")

    if not verify_password(req.password, user.password_hash):
        return ApiResponse.fail("邮箱或密码错误")

    token = create_token(user.id, user.is_admin)
    return ApiResponse.ok({
        "token": token,
        "user": user_to_response(user),
    })


@router.get("/api/auth/me")
async def me(current_user: User = Depends(get_current_user)):
    return ApiResponse.ok(user_to_response(current_user))
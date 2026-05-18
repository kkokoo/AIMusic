from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UpdateProfileRequest, ChangePasswordRequest, UserResponse
from app.utils.auth import hash_password, verify_password, get_current_user
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


@router.get("/api/user/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse.ok(user_to_response(current_user))


@router.put("/api/user/profile")
async def update_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.username = req.username
    await db.commit()
    await db.refresh(current_user)
    return ApiResponse.ok(user_to_response(current_user))


@router.put("/api/user/password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(req.old_password, current_user.password_hash):
        return ApiResponse.fail("原密码错误")

    current_user.password_hash = hash_password(req.new_password)
    await db.commit()
    return ApiResponse.ok(message="密码修改成功")
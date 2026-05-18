from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.credit_transaction import CreditTransaction
from app.models.credit_package import CreditPackage
from app.schemas.credit import TransactionResponse, PackageResponse
from app.utils.auth import get_current_user
from app.utils.response import ApiResponse
from app.utils.pagination import paginate

router = APIRouter()


@router.get("/api/credits/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    return ApiResponse.ok({"balance": current_user.credits})


@router.get("/api/credits/transactions")
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(CreditTransaction).where(
        CreditTransaction.user_id == current_user.id
    )
    if type:
        stmt = stmt.where(CreditTransaction.type == type)

    stmt = stmt.order_by(CreditTransaction.created_at.desc())
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    items = []
    for t in transactions:
        items.append({
            "id": t.id,
            "user_id": t.user_id,
            "amount": t.amount,
            "balance_after": t.balance_after,
            "type": t.type,
            "related_id": t.related_id,
            "description": t.description,
            "created_at": t.created_at.isoformat() + 'Z',
        })

    return ApiResponse.ok(paginate(items, page, page_size))


@router.get("/api/credits/packages")
async def get_packages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CreditPackage).where(CreditPackage.is_active == True)
    )
    packages = result.scalars().all()
    items = []
    for p in packages:
        items.append({
            "id": p.id,
            "name": p.name,
            "price_cents": p.price_cents,
            "credits": p.credits,
            "bonus_credits": p.bonus_credits,
            "is_recommended": p.is_recommended,
            "is_active": p.is_active,
        })
    return ApiResponse.ok(items)
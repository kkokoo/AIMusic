import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.credit_order import CreditOrder
from app.models.credit_package import CreditPackage
from app.models.credit_transaction import CreditTransaction
from app.schemas.credit import CreateOrderRequest
from app.utils.auth import get_current_user
from app.utils.response import ApiResponse

router = APIRouter()


@router.post("/api/orders/create")
async def create_order(
    req: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.package_id:
        package = await db.get(CreditPackage, req.package_id)
        if not package or not package.is_active:
            return ApiResponse.fail("套餐不存在或已下架")
        amount_cents = package.price_cents
        credits_bought = package.credits
        bonus_credits = package.bonus_credits
    else:
        return ApiResponse.fail("请选择套餐")

    order_no = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + uuid.uuid4().hex[:8].upper()

    order = CreditOrder(
        order_no=order_no,
        user_id=current_user.id,
        package_id=req.package_id,
        amount_cents=amount_cents,
        credits_bought=credits_bought,
        bonus_credits=bonus_credits,
        status="pending",
        payment_method=req.payment_method,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)

    return ApiResponse.ok({
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "package_id": order.package_id,
        "amount_cents": order.amount_cents,
        "credits_bought": order.credits_bought,
        "bonus_credits": order.bonus_credits,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at.isoformat() + 'Z' if order.paid_at else None,
        "created_at": order.created_at.isoformat() + 'Z',
    })


@router.post("/api/orders/{order_id}/pay")
async def pay_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(CreditOrder, order_id)
    if not order:
        return ApiResponse.fail("订单不存在")
    if order.user_id != current_user.id:
        return ApiResponse.fail("无权操作此订单")
    if order.status != "pending":
        return ApiResponse.fail("订单状态不允许支付")

    order.status = "success"
    order.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)

    total_credits = order.credits_bought + order.bonus_credits
    current_user.credits += total_credits
    current_user.total_credits_earned += total_credits

    txn = CreditTransaction(
        user_id=current_user.id,
        amount=total_credits,
        balance_after=current_user.credits,
        type="purchase",
        related_id=order.id,
        description=f"购买套餐(订单#{order.order_no})获得积分",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(order)

    return ApiResponse.ok({
        "id": order.id,
        "order_no": order.order_no,
        "user_id": order.user_id,
        "package_id": order.package_id,
        "amount_cents": order.amount_cents,
        "credits_bought": order.credits_bought,
        "bonus_credits": order.bonus_credits,
        "status": order.status,
        "payment_method": order.payment_method,
        "paid_at": order.paid_at.isoformat() + 'Z' if order.paid_at else None,
        "created_at": order.created_at.isoformat() + 'Z',
    })
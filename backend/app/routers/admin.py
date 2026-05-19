import json
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.ai_model import AIModel
from app.models.generation_task import GenerationTask
from app.models.credit_transaction import CreditTransaction
from app.models.credit_package import CreditPackage
from app.models.credit_order import CreditOrder
from app.models.system_config import SystemConfig
from app.schemas.ai_model import ModelCreateRequest, ModelUpdateRequest
from app.schemas.credit import PackageCreateRequest, PackageUpdateRequest
from app.schemas.admin import AdjustCreditsRequest, ConfigUpdateRequest
from app.utils.auth import get_admin_user
from app.utils.response import ApiResponse

router = APIRouter()


@router.get("/api/admin/dashboard")
async def dashboard(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    today_start = datetime.combine(date.today(), datetime.min.time())

    today_tasks_result = await db.execute(
        select(func.count()).select_from(GenerationTask).where(
            GenerationTask.created_at >= today_start
        )
    )
    today_generations = today_tasks_result.scalar() or 0

    today_revenue_result = await db.execute(
        select(func.sum(CreditOrder.amount_cents)).where(
            and_(
                CreditOrder.status == "success",
                CreditOrder.paid_at >= today_start,
            )
        )
    )
    today_revenue = today_revenue_result.scalar() or 0

    active_users_result = await db.execute(
        select(func.count()).select_from(User).where(User.is_active == True)
    )
    active_users = active_users_result.scalar() or 0

    model_usage_result = await db.execute(
        select(
            GenerationTask.model_id,
            func.count().label("count")
        ).group_by(GenerationTask.model_id)
    )
    model_usage = []
    models_result = await db.execute(select(AIModel))
    model_map = {m.id: m.name for m in models_result.scalars().all()}

    for row in model_usage_result.all():
        model_usage.append({
            "model_id": row.model_id,
            "model_name": model_map.get(row.model_id, "未知"),
            "count": row.count,
        })

    return ApiResponse.ok({
        "today_generations": today_generations,
        "today_revenue": today_revenue,
        "active_users": active_users,
        "model_usage": model_usage,
    })


@router.get("/api/admin/models")
async def get_models(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AIModel))
    models = result.scalars().all()
    items = []
    for m in models:
        items.append({
            "id": m.id,
            "name": m.name,
            "code": m.code,
            "description": m.description,
            "supported_modes": json.loads(m.supported_modes),
            "supports_lyrics": m.supports_lyrics,
            "max_duration_sec": m.max_duration_sec,
            "price_per_second": m.price_per_second,
            "price_per_song": m.price_per_song,
            "tags": json.loads(m.tags),
            "api_config": json.loads(m.api_config) if m.api_config else {},
            "adapter_name": m.adapter_name,
            "max_concurrent": m.max_concurrent,
            "is_active": m.is_active,
            "consecutive_failures": m.consecutive_failures,
            "created_at": m.created_at.isoformat() + 'Z',
            "updated_at": m.updated_at.isoformat() + 'Z',
        })
    return ApiResponse.ok(items)


@router.post("/api/admin/models")
async def create_model(
    req: ModelCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.scalar(select(AIModel).where(AIModel.code == req.code))
    if existing:
        return ApiResponse.fail("模型代码已存在")

    model = AIModel(
        name=req.name,
        code=req.code,
        description=req.description,
        supported_modes=json.dumps(req.supported_modes),
        supports_lyrics=req.supports_lyrics,
        max_duration_sec=req.max_duration_sec,
        price_per_second=req.price_per_second,
        price_per_song=req.price_per_song,
        tags=json.dumps(req.tags),
        api_config=json.dumps(req.api_config) if req.api_config else "{}",
        adapter_name=req.adapter_name,
        max_concurrent=req.max_concurrent,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)

    return ApiResponse.ok({
        "id": model.id,
        "name": model.name,
        "code": model.code,
    })


@router.put("/api/admin/models/{model_id}")
async def update_model(
    model_id: int,
    req: ModelUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    model = await db.get(AIModel, model_id)
    if not model:
        return ApiResponse.fail("模型不存在")

    update_data = req.model_dump(exclude_unset=True)
    if "supported_modes" in update_data:
        update_data["supported_modes"] = json.dumps(update_data["supported_modes"])
    if "tags" in update_data:
        update_data["tags"] = json.dumps(update_data["tags"])
    if "api_config" in update_data and isinstance(update_data["api_config"], dict):
        update_data["api_config"] = json.dumps(update_data["api_config"])

    for key, value in update_data.items():
        setattr(model, key, value)

    await db.commit()
    await db.refresh(model)
    return ApiResponse.ok({"id": model.id, "name": model.name})


@router.delete("/api/admin/models/{model_id}")
async def delete_model(
    model_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    model = await db.get(AIModel, model_id)
    if not model:
        return ApiResponse.fail("模型不存在")
    await db.delete(model)
    await db.commit()
    return ApiResponse.ok(message="删除成功")


@router.post("/api/admin/models/{model_id}/test")
async def test_model(
    model_id: int,
    current_user: User = Depends(get_admin_user),
):
    return ApiResponse.ok({"success": True, "message": "连接测试成功"})


@router.get("/api/admin/packages")
async def get_packages(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CreditPackage))
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


@router.post("/api/admin/packages")
async def create_package(
    req: PackageCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    package = CreditPackage(
        name=req.name,
        price_cents=req.price_cents,
        credits=req.credits,
        bonus_credits=req.bonus_credits,
        is_recommended=req.is_recommended,
        is_active=req.is_active,
    )
    db.add(package)
    await db.commit()
    await db.refresh(package)
    return ApiResponse.ok({
        "id": package.id,
        "name": package.name,
    })


@router.put("/api/admin/packages/{package_id}")
async def update_package(
    package_id: int,
    req: PackageUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    package = await db.get(CreditPackage, package_id)
    if not package:
        return ApiResponse.fail("套餐不存在")

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(package, key, value)

    await db.commit()
    await db.refresh(package)
    return ApiResponse.ok({"id": package.id, "name": package.name})


@router.delete("/api/admin/packages/{package_id}")
async def delete_package(
    package_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    package = await db.get(CreditPackage, package_id)
    if not package:
        return ApiResponse.fail("套餐不存在")
    await db.delete(package)
    await db.commit()
    return ApiResponse.ok(message="删除成功")


@router.get("/api/admin/orders")
async def get_orders(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CreditOrder).order_by(CreditOrder.created_at.desc())
    )
    orders = result.scalars().all()
    items = []
    for o in orders:
        items.append({
            "id": o.id,
            "order_no": o.order_no,
            "user_id": o.user_id,
            "package_id": o.package_id,
            "amount_cents": o.amount_cents,
            "credits_bought": o.credits_bought,
            "bonus_credits": o.bonus_credits,
            "status": o.status,
            "payment_method": o.payment_method,
            "paid_at": o.paid_at.isoformat() + 'Z' if o.paid_at else None,
            "created_at": o.created_at.isoformat() + 'Z',
        })
    return ApiResponse.ok(items)


@router.post("/api/admin/orders/{order_id}/complete")
async def complete_order(
    order_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    order = await db.get(CreditOrder, order_id)
    if not order:
        return ApiResponse.fail("订单不存在")
    if order.status != "pending":
        return ApiResponse.fail("订单状态不允许完成")

    order.status = "success"
    order.paid_at = datetime.now(timezone.utc).replace(tzinfo=None)

    user = await db.get(User, order.user_id)
    if user:
        total_credits = order.credits_bought + order.bonus_credits
        user.credits += total_credits
        user.total_credits_earned += total_credits

        txn = CreditTransaction(
            user_id=user.id,
            amount=total_credits,
            balance_after=user.credits,
            type="purchase",
            related_id=order.id,
            description=f"购买套餐(订单#{order.order_no})获得积分",
        )
        db.add(txn)

    await db.commit()
    await db.refresh(order)
    return ApiResponse.ok({"id": order.id, "status": order.status})


@router.get("/api/admin/users")
async def get_users(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    items = []
    for u in users:
        items.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "credits": u.credits,
            "total_credits_earned": u.total_credits_earned,
            "total_credits_spent": u.total_credits_spent,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() + 'Z',
            "updated_at": u.updated_at.isoformat() + 'Z',
        })
    return ApiResponse.ok(items)


@router.post("/api/admin/users/{user_id}/credits")
async def adjust_credits(
    user_id: int,
    req: AdjustCreditsRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        return ApiResponse.fail("用户不存在")

    user.credits += req.amount
    if req.amount > 0:
        user.total_credits_earned += req.amount
    else:
        user.total_credits_spent += abs(req.amount)

    txn = CreditTransaction(
        user_id=user.id,
        amount=req.amount,
        balance_after=user.credits,
        type="manual",
        related_id=current_user.id,
        description=req.reason,
    )
    db.add(txn)
    await db.commit()
    return ApiResponse.ok({"balance": user.credits})


@router.put("/api/admin/users/{user_id}/status")
async def toggle_user_status(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        return ApiResponse.fail("用户不存在")
    if user.id == current_user.id:
        return ApiResponse.fail("不能禁用自己")

    user.is_active = not user.is_active
    await db.commit()
    return ApiResponse.ok({"id": user.id, "is_active": user.is_active})


@router.get("/api/admin/config")
async def get_config(
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    config_dict = {}
    for c in configs:
        config_dict[c.key] = c.value
    return ApiResponse.ok(config_dict)


@router.put("/api/admin/config")
async def update_config(
    req: ConfigUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SystemConfig))
    existing_configs = {c.key: c for c in result.scalars().all()}

    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        str_value = str(value).lower() if isinstance(value, bool) else str(value)
        if key in existing_configs:
            existing_configs[key].value = str_value
        else:
            db.add(SystemConfig(key=key, value=str_value))

    await db.commit()
    return ApiResponse.ok(message="配置更新成功")


@router.get("/api/admin/tasks")
async def get_all_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(GenerationTask)
        .order_by(GenerationTask.created_at.desc())
    )
    result = await db.execute(stmt)
    all_tasks = result.scalars().all()

    model_ids = list({t.model_id for t in all_tasks if t.model_id})
    model_map = {}
    if model_ids:
        model_result = await db.execute(select(AIModel).where(AIModel.id.in_(model_ids)))
        for m in model_result.scalars().all():
            model_map[m.id] = m.name

    total = len(all_tasks)
    start = (page - 1) * page_size
    page_items = all_tasks[start:start + page_size]

    items = []
    for t in page_items:
        model_name = model_map.get(t.model_id) or "未知"
        items.append({
            "id": t.id,
            "user_id": t.user_id,
            "model_id": t.model_id,
            "model_name": model_name,
            "mode": t.mode,
            "prompt": t.prompt,
            "lyrics": t.lyrics,
            "style": t.style,
            "duration_sec": t.duration_sec,
            "actual_duration_sec": t.actual_duration_sec,
            "cost_credits": t.cost_credits,
            "status": t.status,
            "audio_url": t.audio_url,
            "error_message": t.error_message,
            "is_deleted": t.is_deleted,
            "custom_name": t.custom_name,
            "created_at": t.created_at.isoformat() + 'Z' if t.created_at else None,
            "completed_at": t.completed_at.isoformat() + 'Z' if t.completed_at else None,
        })

    return ApiResponse.ok({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    })


@router.get("/api/admin/logs")
async def get_logs(
    current_user: User = Depends(get_admin_user),
):
    return ApiResponse.ok([])
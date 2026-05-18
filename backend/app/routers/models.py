import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.ai_model import AIModel
from app.utils.response import ApiResponse

router = APIRouter()


@router.get("/api/models")
async def list_models(
    mode: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AIModel).where(AIModel.is_active == True)
    result = await db.execute(stmt)
    models = result.scalars().all()

    filtered = []
    for m in models:
        supported_modes = json.loads(m.supported_modes)
        if mode and mode not in supported_modes:
            continue
        filtered.append({
            "id": m.id,
            "name": m.name,
            "code": m.code,
            "description": m.description,
            "supported_modes": supported_modes,
            "supports_lyrics": m.supports_lyrics,
            "max_duration_sec": m.max_duration_sec,
            "price_per_second": m.price_per_second,
            "price_per_song": m.price_per_song,
            "tags": json.loads(m.tags),
            "adapter_name": m.adapter_name,
            "is_active": m.is_active,
        })

    return ApiResponse.ok(filtered)
import math
from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func as sql_func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.generation_task import GenerationTask
from app.models.play_history import PlayHistory
from app.models.ai_model import AIModel
from app.utils.auth import get_current_user
from app.utils.response import ApiResponse
from app.utils.logger import get_logger

logger = get_logger("discovery")
router = APIRouter()


def cosine_similarity(vec1: dict[int, float], vec2: dict[int, float]) -> float:
    common = set(vec1.keys()) & set(vec2.keys())
    if not common:
        return 0.0
    dot = sum(vec1[k] * vec2[k] for k in common)
    norm1 = math.sqrt(sum(v * v for v in vec1.values()))
    norm2 = math.sqrt(sum(v * v for v in vec2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


async def build_recommendations(db: AsyncSession, user_id: int, limit: int = 20) -> list[dict]:
    tasks_result = await db.execute(
        select(GenerationTask).where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            GenerationTask.audio_url.isnot(None),
        )
    )
    all_tasks = {t.id: t for t in tasks_result.scalars().all()}

    history_result = await db.execute(
        select(PlayHistory.task_id, sql_func.count(PlayHistory.id).label("cnt"))
        .group_by(PlayHistory.task_id)
    )
    play_counts = {row.task_id: row.cnt for row in history_result.all()}
    for task_id, count in play_counts.items():
        if task_id in all_tasks:
            all_tasks[task_id].play_count = count

    user_history_result = await db.execute(
        select(PlayHistory.task_id).where(PlayHistory.user_id == user_id)
    )
    user_played = set(row.task_id for row in user_history_result.all())

    co_play_result = await db.execute(
        select(PlayHistory.task_id, PlayHistory.user_id)
    )
    user_items = defaultdict(set)
    for row in co_play_result.all():
        user_items[row.user_id].add(row.task_id)

    item_item_scores: dict[int, dict[int, float]] = defaultdict(dict)
    for uid, items in user_items.items():
        items_list = list(items)
        for i in range(len(items_list)):
            for j in range(i + 1, len(items_list)):
                a, b = items_list[i], items_list[j]
                item_item_scores[a][b] = item_item_scores[a].get(b, 0) + 1
                item_item_scores[b][a] = item_item_scores[b].get(a, 0) + 1

    item_vectors: dict[int, dict[int, float]] = {}
    for task_id in all_tasks:
        item_vectors[task_id] = dict(item_item_scores.get(task_id, {}))

    scores: dict[int, float] = defaultdict(float)
    for played_id in user_played:
        vec = item_vectors.get(played_id, {})
        for candidate_id, similarity in vec.items():
            if candidate_id not in user_played:
                cnt = play_counts.get(candidate_id, 0)
                scores[candidate_id] += similarity * math.log1p(cnt)

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:limit]

    result = []
    model_ids = list({all_tasks[tid].model_id for tid, _ in ranked if tid in all_tasks})
    model_map = {}
    if model_ids:
        m_result = await db.execute(select(AIModel).where(AIModel.id.in_(model_ids)))
        for m in m_result.scalars().all():
            model_map[m.id] = m.name

    for task_id, score in ranked:
        t = all_tasks.get(task_id)
        if not t:
            continue
        result.append({
            "id": t.id,
            "prompt": t.prompt or "",
            "customName": getattr(t, 'custom_name', None),
            "style": t.style or "",
            "mode": t.mode,
            "modelName": model_map.get(t.model_id, "未知模型"),
            "durationSec": t.actual_duration_sec or t.duration_sec,
            "playCount": play_counts.get(t.id, 0),
            "lyrics": t.lyrics or "",
            "score": round(score, 4),
            "createdAt": t.created_at.isoformat() + 'Z',
            "audioUrl": t.audio_url or "",
        })

    return result


@router.get("/api/discovery/leaderboard")
async def get_leaderboard(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    logger.info("[leaderboard] 请求榜单 | page=%d | page_size=%d", page, page_size)

    total_result = await db.execute(
        select(sql_func.count(GenerationTask.id)).where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            GenerationTask.audio_url.isnot(None),
        )
    )
    total = total_result.scalar() or 0

    stmt = (
        select(GenerationTask)
        .where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            GenerationTask.audio_url.isnot(None),
        )
        .order_by(desc(GenerationTask.play_count), desc(GenerationTask.created_at))
    )
    offset = (page - 1) * page_size
    result = await db.execute(stmt.offset(offset).limit(page_size))
    tasks = result.scalars().all()

    model_ids = list({t.model_id for t in tasks})
    model_map = {}
    if model_ids:
        m_result = await db.execute(select(AIModel).where(AIModel.id.in_(model_ids)))
        for m in m_result.scalars().all():
            model_map[m.id] = m.name

    items = [
        {
            "id": t.id,
            "prompt": t.prompt or "",
            "customName": getattr(t, 'custom_name', None),
            "style": t.style or "",
            "mode": t.mode,
            "modelName": model_map.get(t.model_id, "未知模型"),
            "durationSec": t.actual_duration_sec or t.duration_sec,
            "playCount": t.play_count,
            "lyrics": t.lyrics or "",
            "createdAt": t.created_at.isoformat() + 'Z',
            "audioUrl": t.audio_url or "",
        }
        for t in tasks
    ]

    return ApiResponse.ok({
        "items": items,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
    })


@router.get("/api/discovery/search")
async def search_music(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    logger.info("[search] 搜索请求 | q=%s | page=%d", q, page)

    like_pattern = f"%{q}%"
    stmt = (
        select(GenerationTask)
        .where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            GenerationTask.audio_url.isnot(None),
            or_(
                GenerationTask.prompt.ilike(like_pattern),
                GenerationTask.style.ilike(like_pattern),
                GenerationTask.lyrics.ilike(like_pattern),
                GenerationTask.custom_name.ilike(like_pattern),
            ),
        )
        .order_by(desc(GenerationTask.play_count), desc(GenerationTask.created_at))
    )

    count_result = await db.execute(
        select(sql_func.count(GenerationTask.id)).where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            GenerationTask.audio_url.isnot(None),
            or_(
                GenerationTask.prompt.ilike(like_pattern),
                GenerationTask.style.ilike(like_pattern),
                GenerationTask.lyrics.ilike(like_pattern),
                GenerationTask.custom_name.ilike(like_pattern),
            ),
        )
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    result = await db.execute(stmt.offset(offset).limit(page_size))
    tasks = result.scalars().all()

    model_ids = list({t.model_id for t in tasks})
    model_map = {}
    if model_ids:
        m_result = await db.execute(select(AIModel).where(AIModel.id.in_(model_ids)))
        for m in m_result.scalars().all():
            model_map[m.id] = m.name

    items = [
        {
            "id": t.id,
            "prompt": t.prompt or "",
            "customName": getattr(t, 'custom_name', None),
            "style": t.style or "",
            "mode": t.mode,
            "modelName": model_map.get(t.model_id, "未知模型"),
            "durationSec": t.actual_duration_sec or t.duration_sec,
            "playCount": t.play_count,
            "lyrics": t.lyrics or "",
            "createdAt": t.created_at.isoformat() + 'Z',
            "audioUrl": t.audio_url or "",
        }
        for t in tasks
    ]

    return ApiResponse.ok({
        "items": items,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total + page_size - 1) // page_size,
        "query": q,
    })


@router.get("/api/discovery/recommendations")
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info("[recommendations] 请求推荐 | user_id=%d | limit=%d", current_user.id, limit)

    recs = await build_recommendations(db, current_user.id, limit)
    logger.info("[recommendations] 返回推荐 | user_id=%d | count=%d", current_user.id, len(recs))

    return ApiResponse.ok({"items": recs})


@router.post("/api/discovery/play/{task_id}")
async def record_play(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info("[play] 记录播放 | task_id=%d | user_id=%d", task_id, current_user.id)

    task = await db.get(GenerationTask, task_id)
    if not task or task.is_deleted or task.status != "completed" or not task.audio_url:
        logger.warning("[play] 任务无效 | task_id=%d", task_id)
        return ApiResponse.fail("音乐不存在或暂不可播放")

    existing = await db.execute(
        select(PlayHistory).where(
            PlayHistory.user_id == current_user.id,
            PlayHistory.task_id == task_id,
        ).order_by(desc(PlayHistory.played_at)).limit(1)
    )
    last_play = existing.scalar_one_or_none()
    if last_play:
        from datetime import timedelta
        if last_play.played_at > datetime.now() - timedelta(seconds=30):
            await db.commit()
            return ApiResponse.ok({"playCount": task.play_count})

    play = PlayHistory(user_id=current_user.id, task_id=task_id)
    db.add(play)
    task.play_count = (task.play_count or 0) + 1
    await db.commit()
    await db.refresh(task)

    logger.info("[play] 播放已记录 | task_id=%d | user_id=%d | play_count=%d",
                 task_id, current_user.id, task.play_count)
    return ApiResponse.ok({"playCount": task.play_count})

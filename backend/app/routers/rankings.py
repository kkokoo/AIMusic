import re
from datetime import datetime, date
from calendar import monthrange
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func as sql_func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.generation_task import GenerationTask
from app.models.play_history import PlayHistory
from app.models.credit_transaction import CreditTransaction
from app.models.ranking_reward import RankingRewardRecord
from app.schemas.ranking import DistributeRewardsRequest
from app.utils.auth import get_current_user, get_admin_user, get_optional_user
from app.utils.response import ApiResponse
from app.utils.logger import get_logger

logger = get_logger("rankings")
router = APIRouter()

# 奖励配置：前三名分别金银铜，第4-10名统一奖励
TOP3_REWARDS = [500.0, 300.0, 200.0]  # 金/银/铜
TOP10_REWARD = 100.0  # 第4-10名
MEANINGFUL_PLAY_THRESHOLD = 10  # 有意义歌曲的播放量阈值


def _parse_year_month(year_month: str) -> tuple[int, int]:
    """解析 YYYY-MM 格式，返回 (year, month)"""
    if not re.match(r"^\d{4}-\d{2}$", year_month):
        raise ValueError("月份格式应为 YYYY-MM")
    year, month = year_month.split("-")
    y, m = int(year), int(month)
    if m < 1 or m > 12:
        raise ValueError("月份不合法")
    return y, m


def _current_year_month() -> str:
    now = datetime.now()
    return f"{now.year:04d}-{now.month:02d}"


async def _compute_monthly_ranking(
    db: AsyncSession, year: int, month: int
) -> list[dict]:
    """计算指定月份的创作者热度排行榜"""
    _, last_day = monthrange(year, month)
    start = datetime(year, month, 1, 0, 0, 0)
    end = datetime(year, month, last_day, 23, 59, 59)

    # 统计当月每首歌曲的播放量
    play_counts_subq = (
        select(
            PlayHistory.task_id.label("tid"),
            sql_func.count(PlayHistory.id).label("play_cnt"),
        )
        .where(PlayHistory.played_at >= start, PlayHistory.played_at <= end)
        .group_by(PlayHistory.task_id)
        .subquery()
    )

    # 关联 generation_tasks，筛选有意义歌曲（播放量>=10 且 状态正常 且 未删除）
    meaningful_stmt = (
        select(
            GenerationTask.user_id.label("uid"),
            sql_func.count(GenerationTask.id).label("meaningful_cnt"),
        )
        .select_from(GenerationTask)
        .join(
            play_counts_subq,
            play_counts_subq.c.tid == GenerationTask.id,
        )
        .where(
            GenerationTask.is_deleted == False,
            GenerationTask.status == "completed",
            play_counts_subq.c.play_cnt >= MEANINGFUL_PLAY_THRESHOLD,
        )
        .group_by(GenerationTask.user_id)
        .order_by(desc("meaningful_cnt"))
    )

    result = await db.execute(meaningful_stmt)
    rows = result.all()

    user_ids = [row.uid for row in rows]
    user_map = {}
    if user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in u_result.scalars().all():
            user_map[u.id] = u.username

    ranking = []
    for idx, row in enumerate(rows):
        rank = idx + 1
        reward_credits = 0.0
        reward_type = None
        if rank <= 3:
            reward_credits = TOP3_REWARDS[rank - 1]
            reward_type = "top3"
        elif rank <= 10:
            reward_credits = TOP10_REWARD
            reward_type = "top10"

        ranking.append({
            "rank": rank,
            "user_id": row.uid,
            "user_nickname": user_map.get(row.uid, "匿名用户"),
            "meaningful_songs_count": row.meaningful_cnt,
            "reward_credits": reward_credits,
            "reward_type": reward_type,
        })

    return ranking


@router.get("/api/rankings/monthly")
async def get_monthly_ranking(
    year_month: str | None = Query(None, description="月份 YYYY-MM，默认当月"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """查询创作者月度热度排行榜（当月或指定月份，支持分页）"""
    ym = year_month or _current_year_month()
    try:
        year, month = _parse_year_month(ym)
    except ValueError as e:
        return ApiResponse.fail(str(e))

    logger.info("[ranking] 查询月度榜单 | year_month=%s | page=%d", ym, page)

    ranking = await _compute_monthly_ranking(db, year, month)

    # 查询已发放奖励记录，标记是否已发放
    rewarded_result = await db.execute(
        select(RankingRewardRecord).where(RankingRewardRecord.year_month == ym)
    )
    rewarded_map = {r.user_id: r for r in rewarded_result.scalars().all()}
    for item in ranking:
        rec = rewarded_map.get(item["user_id"])
        item["reward_distributed"] = rec is not None

    total = len(ranking)
    start = (page - 1) * page_size
    page_items = ranking[start:start + page_size]

    return ApiResponse.ok({
        "items": page_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "year_month": ym,
    })


@router.post("/api/rankings/monthly/distribute")
async def distribute_rewards(
    req: DistributeRewardsRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """发放指定月份排行榜奖励（防重复发放）"""
    try:
        year, month = _parse_year_month(req.year_month)
    except ValueError as e:
        return ApiResponse.fail(str(e))

    logger.info(
        "[ranking] 发放奖励 | year_month=%s | admin_id=%d",
        req.year_month, current_user.id,
    )

    # 当月未结束不允许发放
    now = datetime.now()
    if year == now.year and month >= now.month:
        return ApiResponse.fail("当月尚未结束，无法发放奖励")

    ranking = await _compute_monthly_ranking(db, year, month)
    if not ranking:
        return ApiResponse.fail("该月份无排行榜数据")

    # 查询已发放记录
    existing_result = await db.execute(
        select(RankingRewardRecord).where(RankingRewardRecord.year_month == req.year_month)
    )
    existing = {r.user_id for r in existing_result.scalars().all()}

    distributed = []
    skipped = []
    for item in ranking:
        if item["reward_type"] is None:
            continue
        uid = item["user_id"]
        if uid in existing:
            skipped.append({"user_id": uid, "rank": item["rank"]})
            continue

        user = await db.get(User, uid)
        if not user:
            continue

        user.credits += item["reward_credits"]
        user.total_credits_earned += item["reward_credits"]

        record = RankingRewardRecord(
            year_month=req.year_month,
            user_id=uid,
            rank=item["rank"],
            meaningful_songs_count=item["meaningful_songs_count"],
            reward_credits=item["reward_credits"],
            reward_type=item["reward_type"],
        )
        db.add(record)

        txn = CreditTransaction(
            user_id=uid,
            amount=item["reward_credits"],
            balance_after=user.credits,
            type="manual",
            related_id=current_user.id,
            description=f"{req.year_month} 创作者月度榜单第{item['rank']}名奖励",
        )
        db.add(txn)

        distributed.append({
            "user_id": uid,
            "rank": item["rank"],
            "reward_credits": item["reward_credits"],
        })

    await db.commit()

    logger.info(
        "[ranking] 奖励发放完成 | year_month=%s | distributed=%d | skipped=%d",
        req.year_month, len(distributed), len(skipped),
    )

    return ApiResponse.ok({
        "distributed": distributed,
        "skipped": skipped,
        "total_distributed": len(distributed),
    })

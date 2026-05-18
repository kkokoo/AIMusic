import asyncio
import io
import math
import random
import struct
import wave
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, async_session
from app.models.user import User
from app.models.ai_model import AIModel
from app.models.generation_task import GenerationTask
from app.models.credit_transaction import CreditTransaction
from app.schemas.generation import SubmitTaskRequest, TaskResponse, GenerateLyricsRequest, RenameTaskRequest
from app.utils.auth import get_current_user
from app.utils.response import ApiResponse
from app.utils.pagination import paginate
from app.utils.logger import get_logger
from app.utils.storage import upload_bytes
from app.utils.lyrics import generate_lyrics as generate_ai_lyrics
from app.adapters.minimax import MiniMaxMusicAdapter

logger = get_logger("generation")
router = APIRouter()


def _generate_placeholder_wav(duration_sec: int = 5) -> bytes:
    sample_rate = 44100
    num_samples = sample_rate * duration_sec
    buf = io.BytesIO()
    with wave.open(buf, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(num_samples):
            value = int(16000 * math.sin(2 * math.pi * 440 * i / sample_rate))
            wf.writeframes(struct.pack("<h", max(-32768, min(32767, value))))
    return buf.getvalue()


async def _upload_audio_to_cos(audio_data: bytes, task_id: int, model_name: str, audio_format: str = "wav") -> str:
    ext = audio_format if audio_format in ("mp3", "wav", "pcm") else "wav"
    mime = f"audio/{'mpeg' if ext == 'mp3' else ext}"
    filename = f"generation_{task_id}_{model_name}.{ext}"
    url = upload_bytes(audio_data, "music", filename, mime)
    return url


def task_to_response(task: GenerationTask, model_name: str | None = None) -> dict:
    return TaskResponse.from_orm_with_model(task, model_name).model_dump()


async def _do_refund(db: AsyncSession, task: GenerationTask, task_id: int) -> None:
    user = await db.get(User, task.user_id)
    if not user:
        return
    before_refund = user.credits
    user.credits += task.cost_credits
    user.total_credits_spent -= task.cost_credits

    logger.info(
        "[task_id=%d] 积分退款 | user_id=%d | "
        "退款金额=%.2f | 退款前=%.2f | 退款后=%.2f",
        task_id, user.id, task.cost_credits, before_refund, user.credits,
    )

    txn = CreditTransaction(
        user_id=user.id,
        amount=task.cost_credits,
        balance_after=user.credits,
        type="refund",
        related_id=task.id,
        description=f"任务#{task.id}生成失败，退回积分",
    )
    db.add(txn)


async def simulate_generation(task_id: int):
    delay = random.uniform(3, 7)
    logger.info(
        "[task_id=%d] 异步生成开始 | 模拟延迟=%.1fs | 启动时间=%s",
        task_id, delay, datetime.now(timezone.utc).isoformat(),
    )
    await asyncio.sleep(delay)

    async with async_session() as db:
        task = await db.get(GenerationTask, task_id)
        if not task:
            logger.warning("[task_id=%d] 任务不存在，跳过模拟生成", task_id)
            return

        elapsed = delay
        logger.info(
            "[task_id=%d] 模拟生成完成 | 耗时=%.1fs | 当前状态=%s",
            task_id, elapsed, task.status,
        )

        if random.random() < 0.15:
            task.status = "failed"
            task.error_message = "AI生成失败，请稍后重试"
            task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

            logger.warning(
                "[task_id=%d] 状态变更: processing -> failed | "
                "user_id=%d | model_id=%d | mode=%s | "
                "请求时长=%ds | 消耗积分=%.2f | 错误=%s",
                task_id, task.user_id, task.model_id, task.mode,
                task.duration_sec, task.cost_credits, task.error_message,
            )

            try:
                await _do_refund(db, task, task_id)
            except Exception as refund_err:
                logger.error(
                    "[task_id=%d] 退款操作失败 | refund_error=%s",
                    task_id, str(refund_err),
                )
        else:
            model = await db.get(AIModel, task.model_id)
            model_name = model.name if model else "unknown"

            if model and model.adapter_name == "minimax":
                try:
                    import json as _json
                    api_config = {}
                    try:
                        api_config = _json.loads(model.api_config or "{}")
                    except Exception:
                        pass
                    minimax = MiniMaxMusicAdapter(api_config=api_config)
                    api_model_name = minimax.get_api_model_name(model.code)
                    result = await minimax.generate({
                        "model_name": api_model_name,
                        "mode": task.mode,
                        "prompt": task.prompt,
                        "lyrics": task.lyrics,
                        "duration_sec": task.duration_sec,
                        "audio_base64": getattr(task, 'audio_base64', None),
                    })
                    if result.get("error"):
                        task.status = "failed"
                        task.error_message = result["error"] or "MiniMax返回未知错误"
                        task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                        logger.error("[task_id=%d] MiniMax生成失败 | error=%s", task_id, task.error_message)
                        try:
                            await _do_refund(db, task, task_id)
                        except Exception as refund_err:
                            logger.error(
                                "[task_id=%d] 退款操作失败 | refund_error=%s",
                                task_id, str(refund_err),
                            )
                    else:
                        audio_data = result["audio_data"]
                        audio_format = result.get("format", "wav")
                        task.audio_url = await _upload_audio_to_cos(audio_data, task.id, model_name, audio_format)
                        task.actual_duration_sec = result.get("duration", task.duration_sec)
                        task.status = "completed"
                        task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                        logger.info("[task_id=%d] MiniMax生成完成 | url=%s | duration=%ds",
                                    task_id, task.audio_url, task.actual_duration_sec)
                except Exception as e:
                    task.status = "failed"
                    task.error_message = f"MiniMax调用异常: {str(e)}"
                    task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
                    logger.error("[task_id=%d] MiniMax调用异常 | error=%s", task_id, str(e))
                    try:
                        await _do_refund(db, task, task_id)
                    except Exception as refund_err:
                        logger.error(
                            "[task_id=%d] 退款操作失败，任务已标记为失败 | refund_error=%s",
                            task_id, str(refund_err),
                        )
            else:
                actual_duration = max(1, task.duration_sec + random.randint(-5, 5))
                task.status = "completed"
                task.actual_duration_sec = actual_duration
                task.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

                audio_data = _generate_placeholder_wav(min(actual_duration, 10))
                try:
                    task.audio_url = await _upload_audio_to_cos(audio_data, task.id, model_name)
                    logger.info("[task_id=%d] 音频已上传至COS | url=%s", task_id, task.audio_url)
                except Exception as e:
                    logger.error("[task_id=%d] COS上传失败 | error=%s", task_id, str(e))
                    task.audio_url = "/uploads/sample.mp3"

            logger.info(
                "[task_id=%d] 状态变更: processing -> %s | "
                "user_id=%d | model_id=%d | mode=%s | "
                "请求时长=%ds | 消耗积分=%.2f | audio_url=%s",
                task_id, task.status, task.user_id, task.model_id, task.mode,
                task.duration_sec, task.cost_credits, task.audio_url or "N/A",
            )

        await db.commit()
        logger.info("[task_id=%d] 数据库已提交 | 最终状态=%s | 完成时间=%s",
                    task_id, task.status, task.completed_at.isoformat() if task.completed_at else "N/A")


@router.post("/api/generation/submit")
async def submit_task(
    req: SubmitTaskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[submit] 收到生成请求 | user_id=%d | email=%s | "
        "model_id=%d | mode=%s | duration_sec=%d | "
        "has_prompt=%s | has_lyrics=%s",
        current_user.id, current_user.email,
        req.model_id, req.mode, req.duration_sec,
        bool(req.prompt), bool(req.lyrics),
    )

    model = await db.get(AIModel, req.model_id)
    if not model or not model.is_active:
        logger.warning(
            "[submit] 模型验证失败 | user_id=%d | model_id=%d | "
            "exists=%s | is_active=%s",
            current_user.id, req.model_id, bool(model), model.is_active if model else "N/A",
        )
        return ApiResponse.fail("模型不存在或已禁用")

    if model.price_per_song > 0:
        cost_credits = math.ceil(model.price_per_song)
    else:
        effective_duration = req.duration_sec if req.duration_sec > 0 else (model.max_duration_sec or 60)
        cost_credits = math.ceil(effective_duration * model.price_per_second)
    logger.info(
        "[submit] 费用计算 | user_id=%d | model=%s | "
        "duration=%ds | price_per_sec=%.4f | cost=%.2f | "
        "user_balance_before=%.2f",
        current_user.id, model.name,
        req.duration_sec, model.price_per_second, cost_credits,
        current_user.credits,
    )

    if current_user.credits < cost_credits:
        logger.warning(
            "[submit] 积分不足 | user_id=%d | balance=%.2f | required=%.2f | deficit=%.2f",
            current_user.id, current_user.credits, cost_credits, cost_credits - current_user.credits,
        )
        return ApiResponse.fail("积分不足")

    current_user.credits -= cost_credits
    current_user.total_credits_spent += cost_credits

    logger.info(
        "[submit] 积分已扣除 | user_id=%d | deducted=%.2f | balance_after=%.2f",
        current_user.id, cost_credits, current_user.credits,
    )

    task = GenerationTask(
        user_id=current_user.id,
        model_id=req.model_id,
        mode=req.mode,
        prompt=req.prompt,
        lyrics=req.lyrics,
        style=req.style,
        vocal_gender=req.vocal_gender,
        vocal_style=req.vocal_style,
        language=req.language,
        duration_sec=req.duration_sec,
        cost_credits=cost_credits,
        status="processing",
        audio_base64=req.audio_base64,
        custom_name=req.custom_name,
    )
    db.add(task)
    await db.flush()

    logger.info(
        "[submit] 任务已创建 | task_id=%d | user_id=%d | model=%s | "
        "mode=%s | status=processing | cost=%.2f",
        task.id, current_user.id, model.name, req.mode, cost_credits,
    )

    txn = CreditTransaction(
        user_id=current_user.id,
        amount=-cost_credits,
        balance_after=current_user.credits,
        type="consumption",
        related_id=task.id,
        description=f"生成任务#{task.id}消耗积分",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(task)

    logger.info(
        "[submit] 消费交易已记录 | task_id=%d | txn_type=consumption | amount=%.2f | "
        "数据库已提交，启动异步生成任务",
        task.id, cost_credits,
    )

    asyncio.create_task(simulate_generation(task.id))

    logger.info("[submit] 异步任务已调度 | task_id=%d | 返回响应给用户", task.id)
    return ApiResponse.ok(task_to_response(task, model.name))


@router.get("/api/generation/task/{task_id}")
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[query] 查询任务 | task_id=%d | request_user_id=%d | request_user=%s",
        task_id, current_user.id, current_user.email,
    )

    task = await db.get(GenerationTask, task_id)
    if not task:
        logger.warning("[query] 任务不存在 | task_id=%d | request_user_id=%d", task_id, current_user.id)
        return ApiResponse.fail("任务不存在")

    if task.user_id != current_user.id and not current_user.is_admin:
        logger.warning(
            "[query] 权限拒绝 | task_id=%d | task_owner=%d | request_user=%d | is_admin=%s",
            task_id, task.user_id, current_user.id, current_user.is_admin,
        )
        return ApiResponse.fail("无权查看此任务")

    model_name = None
    if task.model_id:
        model = await db.get(AIModel, task.model_id)
        if model:
            model_name = model.name

    logger.info(
        "[query] 返回任务 | task_id=%d | status=%s | mode=%s | "
        "model=%s | cost=%.2f | is_owner=%s",
        task_id, task.status, task.mode, model_name or "N/A",
        task.cost_credits, task.user_id == current_user.id,
    )

    return ApiResponse.ok(task_to_response(task, model_name))


@router.get("/api/generation/history")
async def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[history] 查询历史 | user_id=%d | page=%d | page_size=%d",
        current_user.id, page, page_size,
    )

    stmt = (
        select(GenerationTask)
        .where(GenerationTask.user_id == current_user.id, GenerationTask.is_deleted == False)
        .order_by(GenerationTask.created_at.desc())
    )
    result = await db.execute(stmt)
    all_tasks = result.scalars().all()

    logger.info("[history] 查询结果 | user_id=%d | total=%d", current_user.id, len(all_tasks))

    model_ids = list({t.model_id for t in all_tasks})
    model_map = {}
    if model_ids:
        model_result = await db.execute(select(AIModel).where(AIModel.id.in_(model_ids)))
        for m in model_result.scalars().all():
            model_map[m.id] = m.name

    task_list = [task_to_response(t, model_map.get(t.model_id)) for t in all_tasks]
    return ApiResponse.ok(paginate(task_list, page, page_size))


@router.patch("/api/generation/{task_id}/rename")
async def rename_task(
    task_id: int,
    req: RenameTaskRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[rename] 改名请求 | task_id=%d | user_id=%d | new_name=%s",
        task_id, current_user.id, req.custom_name,
    )

    name = req.custom_name.strip()
    if not name or len(name) > 200:
        return ApiResponse.fail("名称不能为空且不超过200个字符")

    task = await db.get(GenerationTask, task_id)
    if not task:
        logger.warning("[rename] 任务不存在 | task_id=%d", task_id)
        return ApiResponse.fail("任务不存在")

    if task.user_id != current_user.id:
        logger.warning(
            "[rename] 权限拒绝 | task_id=%d | task_owner=%d | request_user=%d",
            task_id, task.user_id, current_user.id,
        )
        return ApiResponse.fail("无权修改此作品")

    task.custom_name = name
    await db.commit()

    logger.info("[rename] 改名成功 | task_id=%d | name=%s", task_id, name)
    return ApiResponse.ok(message="改名成功")


@router.delete("/api/generation/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[delete] 删除请求 | task_id=%d | request_user_id=%d",
        task_id, current_user.id,
    )

    task = await db.get(GenerationTask, task_id)
    if not task:
        logger.warning("[delete] 任务不存在 | task_id=%d", task_id)
        return ApiResponse.fail("任务不存在")

    if task.user_id != current_user.id:
        logger.warning(
            "[delete] 权限拒绝 | task_id=%d | task_owner=%d | request_user=%d",
            task_id, task.user_id, current_user.id,
        )
        return ApiResponse.fail("无权删除此任务")

    task.is_deleted = True
    await db.commit()

    logger.info(
        "[delete] 软删除完成 | task_id=%d | user_id=%d | status=%s | mode=%s",
        task_id, task.user_id, task.status, task.mode,
    )
    return ApiResponse.ok(message="删除成功")


@router.post("/api/generation/lyrics")
async def generate_lyrics(
    req: GenerateLyricsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    logger.info(
        "[lyrics] 收到歌词生成请求 | user_id=%d | prompt=%s | style=%s | language=%s | verses=%d | bridge=%s",
        current_user.id, req.prompt, req.style or "N/A", req.language, req.verse_count, str(req.include_bridge),
    )

    from app.models.system_config import SystemConfig
    config_result = await db.execute(select(SystemConfig).where(SystemConfig.key == "lyrics_cost"))
    config = config_result.scalar_one_or_none()
    cost_credits = float(config.value) if config else 5.0

    logger.info("[lyrics] 费用计算 | user_id=%d | cost=%.2f | balance=%.2f",
                current_user.id, cost_credits, current_user.credits)

    if current_user.credits < cost_credits:
        logger.warning("[lyrics] 积分不足 | user_id=%d | balance=%.2f | required=%.2f",
                       current_user.id, current_user.credits, cost_credits)
        return ApiResponse.fail("积分不足")

    current_user.credits -= cost_credits
    current_user.total_credits_spent += cost_credits

    logger.info("[lyrics] 积分已扣除 | user_id=%d | deducted=%.2f | balance_after=%.2f",
                current_user.id, cost_credits, current_user.credits)

    try:
        lyrics = await generate_ai_lyrics(
            prompt=req.prompt,
            style=req.style,
            language=req.language,
            verse_count=req.verse_count,
            include_bridge=req.include_bridge,
        )
    except Exception:
        current_user.credits += cost_credits
        current_user.total_credits_spent -= cost_credits
        logger.error("[lyrics] 生成失败，积分已退回 | user_id=%d | amount=%.2f", current_user.id, cost_credits)

        txn = CreditTransaction(
            user_id=current_user.id,
            amount=cost_credits,
            balance_after=current_user.credits,
            type="refund",
            description="AI歌词生成失败，退回积分",
        )
        db.add(txn)
        await db.commit()
        return ApiResponse.fail("歌词生成失败，积分已退回")

    txn = CreditTransaction(
        user_id=current_user.id,
        amount=-cost_credits,
        balance_after=current_user.credits,
        type="consumption",
        description=f"AI歌词生成: {req.prompt[:20]}{'...' if len(req.prompt) > 20 else ''}",
    )
    db.add(txn)
    await db.commit()

    logger.info(
        "[lyrics] 歌词生成成功 | user_id=%d | chars=%d | cost=%.2f | preview=%s",
        current_user.id, len(lyrics), cost_credits,
        lyrics[:40] + "..." if len(lyrics) > 40 else lyrics,
    )
    return ApiResponse.ok({
        "lyrics": lyrics,
        "prompt": req.prompt,
        "style": req.style,
        "language": req.language,
        "cost_credits": cost_credits,
        "balance_after": current_user.credits,
    })
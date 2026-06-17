from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func as sql_func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.generation_task import GenerationTask
from app.models.comment import Comment, CommentLike
from app.schemas.comment import CreateCommentRequest
from app.utils.auth import get_current_user, get_optional_user
from app.utils.response import ApiResponse
from app.utils.logger import get_logger

logger = get_logger("comments")
router = APIRouter()


@router.post("/api/comments")
async def create_comment(
    req: CreateCommentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """发表评论（需登录，限制10-200字）"""
    logger.info(
        "[comment] 发表评论 | user_id=%d | task_id=%d | content_len=%d",
        current_user.id, req.task_id, len(req.content),
    )

    task = await db.get(GenerationTask, req.task_id)
    if not task or task.is_deleted or task.status != "completed":
        return ApiResponse.fail("歌曲不存在或不可评论")

    comment = Comment(
        user_id=current_user.id,
        task_id=req.task_id,
        content=req.content,
        likes_count=0,
    )
    db.add(comment)

    task.comment_count = (task.comment_count or 0) + 1
    await db.commit()
    await db.refresh(comment)

    logger.info(
        "[comment] 评论创建成功 | comment_id=%d | user_id=%d | task_id=%d",
        comment.id, current_user.id, req.task_id,
    )

    return ApiResponse.ok({
        "id": comment.id,
        "user_id": comment.user_id,
        "task_id": comment.task_id,
        "content": comment.content,
        "likes_count": comment.likes_count,
        "created_at": comment.created_at.isoformat() + "Z",
        "user_nickname": current_user.username,
        "is_liked": False,
        "is_owner": True,
    })


@router.get("/api/comments/task/{task_id}")
async def list_comments(
    task_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """分页查询评论（按创建时间倒序，带发布者昵称）"""
    user_id = current_user.id if current_user else None

    logger.info(
        "[comment] 查询评论 | task_id=%d | page=%d | page_size=%d | user_id=%s",
        task_id, page, page_size, user_id,
    )

    total_result = await db.execute(
        select(sql_func.count(Comment.id)).where(Comment.task_id == task_id)
    )
    total = total_result.scalar() or 0

    stmt = (
        select(Comment)
        .where(Comment.task_id == task_id)
        .order_by(desc(Comment.created_at))
    )
    offset = (page - 1) * page_size
    result = await db.execute(stmt.offset(offset).limit(page_size))
    comments = result.scalars().all()

    user_ids = list({c.user_id for c in comments})
    user_map = {}
    if user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in u_result.scalars().all():
            user_map[u.id] = u.username

    liked_comment_ids = set()
    if user_id and comments:
        comment_ids = [c.id for c in comments]
        like_result = await db.execute(
            select(CommentLike.comment_id).where(
                CommentLike.user_id == user_id,
                CommentLike.comment_id.in_(comment_ids),
            )
        )
        liked_comment_ids = {row[0] for row in like_result.all()}

    items = [
        {
            "id": c.id,
            "user_id": c.user_id,
            "task_id": c.task_id,
            "content": c.content,
            "likes_count": c.likes_count,
            "created_at": c.created_at.isoformat() + "Z",
            "user_nickname": user_map.get(c.user_id, "匿名用户"),
            "is_liked": c.id in liked_comment_ids,
            "is_owner": c.user_id == user_id,
        }
        for c in comments
    ]

    return ApiResponse.ok({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    })


@router.delete("/api/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除评论（仅评论本人可删）"""
    logger.info(
        "[comment] 删除评论 | comment_id=%d | user_id=%d",
        comment_id, current_user.id,
    )

    comment = await db.get(Comment, comment_id)
    if not comment:
        return ApiResponse.fail("评论不存在")

    if comment.user_id != current_user.id:
        logger.warning(
            "[comment] 删除权限拒绝 | comment_id=%d | owner=%d | requester=%d",
            comment_id, comment.user_id, current_user.id,
        )
        return ApiResponse.fail("无权删除此评论")

    task = await db.get(GenerationTask, comment.task_id)
    if task:
        task.comment_count = max(0, (task.comment_count or 0) - 1)

    await db.delete(comment)
    await db.commit()

    logger.info("[comment] 评论已删除 | comment_id=%d", comment_id)
    return ApiResponse.ok(message="删除成功")


@router.post("/api/comments/{comment_id}/like")
async def toggle_like(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """点赞/取消点赞（每人只能点一次，第二次取消）"""
    logger.info(
        "[comment] 点赞切换 | comment_id=%d | user_id=%d",
        comment_id, current_user.id,
    )

    comment = await db.get(Comment, comment_id)
    if not comment:
        return ApiResponse.fail("评论不存在")

    existing = await db.execute(
        select(CommentLike).where(
            CommentLike.user_id == current_user.id,
            CommentLike.comment_id == comment_id,
        )
    )
    existing_like = existing.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        comment.likes_count = max(0, (comment.likes_count or 0) - 1)
        await db.commit()
        logger.info("[comment] 取消点赞 | comment_id=%d | user_id=%d", comment_id, current_user.id)
        return ApiResponse.ok({"is_liked": False, "likes_count": comment.likes_count})
    else:
        like = CommentLike(user_id=current_user.id, comment_id=comment_id)
        db.add(like)
        comment.likes_count = (comment.likes_count or 0) + 1
        await db.commit()
        logger.info("[comment] 点赞成功 | comment_id=%d | user_id=%d", comment_id, current_user.id)
        return ApiResponse.ok({"is_liked": True, "likes_count": comment.likes_count})

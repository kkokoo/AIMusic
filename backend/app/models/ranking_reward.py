from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime


class RankingRewardRecord(Base):
    """排行榜奖励发放记录，用于防止同一月份重复发放"""
    __tablename__ = "ranking_reward_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    year_month: Mapped[str] = mapped_column(String(7), nullable=False)  # 格式: YYYY-MM
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    meaningful_songs_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reward_credits: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reward_type: Mapped[str] = mapped_column(String(20), nullable=False)  # top3 / top10
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("year_month", "user_id", name="uq_ranking_reward_month_user"),
    )

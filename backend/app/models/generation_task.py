from sqlalchemy import String, Float, Integer, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class GenerationTask(Base):
    __tablename__ = "generation_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    model_id: Mapped[int] = mapped_column(ForeignKey("ai_models.id"), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    lyrics: Mapped[str | None] = mapped_column(Text, nullable=True)
    style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vocal_gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vocal_style: Mapped[str | None] = mapped_column(String(50), nullable=True)
    language: Mapped[str | None] = mapped_column(String(20), nullable=True)
    duration_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    actual_duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_credits: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    audio_base64: Mapped[str | None] = mapped_column(Text, nullable=True)
    play_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="tasks")
    model = relationship("AIModel", back_populates="tasks")
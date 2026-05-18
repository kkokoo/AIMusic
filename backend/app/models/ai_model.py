import json
from sqlalchemy import String, Float, Boolean, Integer, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from datetime import datetime


class AIModel(Base):
    __tablename__ = "ai_models"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    supported_modes: Mapped[str] = mapped_column(Text, default='["instrumental","song"]')
    supports_lyrics: Mapped[bool] = mapped_column(Boolean, default=False)
    max_duration_sec: Mapped[int] = mapped_column(Integer, default=60)
    price_per_second: Mapped[float] = mapped_column(Float, nullable=False)
    price_per_song: Mapped[float] = mapped_column(Float, default=0)
    tags: Mapped[str] = mapped_column(Text, default="[]")
    api_config: Mapped[str] = mapped_column(Text, default="{}")
    adapter_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    max_concurrent: Mapped[int] = mapped_column(Integer, default=5)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tasks = relationship("GenerationTask", back_populates="model")

    def get_supported_modes(self) -> list[str]:
        return json.loads(self.supported_modes)

    def get_tags(self) -> list[str]:
        return json.loads(self.tags)
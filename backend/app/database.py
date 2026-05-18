from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("database")

engine = create_async_engine(settings.database_url, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text(
                "ALTER TABLE generation_tasks ADD COLUMN custom_name VARCHAR(200)"
            ))
            await conn.commit()
            logger.info("[db] 已添加 generation_tasks.custom_name 列")
        except Exception:
            pass
        try:
            await conn.execute(text(
                "ALTER TABLE generation_tasks ADD COLUMN play_count INTEGER DEFAULT 0"
            ))
            await conn.commit()
            logger.info("[db] 已添加 generation_tasks.play_count 列")
        except Exception:
            pass
        try:
            await conn.execute(text(
                "ALTER TABLE generation_tasks ADD COLUMN audio_base64 TEXT"
            ))
            await conn.commit()
            logger.info("[db] 已添加 generation_tasks.audio_base64 列")
        except Exception:
            pass
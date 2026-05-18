import json
from sqlalchemy import select, func
from app.database import async_session
from app.models.user import User
from app.models.ai_model import AIModel
from app.models.credit_package import CreditPackage
from app.models.system_config import SystemConfig
from app.utils.auth import hash_password


async def seed_data():
    async with async_session() as db:
        user_count = await db.scalar(select(func.count()).select_from(User))
        if user_count and user_count > 0:
            return

        admin = User(
            username="admin",
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            credits=999999.0,
            total_credits_earned=999999.0,
            is_admin=True,
        )
        db.add(admin)
        await db.flush()

        model3 = AIModel(
            name="DeepSeek 歌词创作",
            code="deepseek_lyrics",
            description="基于DeepSeek大语言模型的AI歌词生成服务，支持多种语言和风格",
            supported_modes=json.dumps(["lyrics"]),
            supports_lyrics=True,
            max_duration_sec=0,
            price_per_second=0,
            price_per_song=3,
            tags=json.dumps(["歌词", "AI", "DeepSeek", "多语言"]),
            adapter_name="deepseek",
        )
        model4 = AIModel(
            name="MiniMax 音乐生成 (体验)",
            code="minimax_music_free",
            description="MiniMax music-2.6-free 免费体验版，支持纯音乐和带人声歌曲",
            supported_modes=json.dumps(["instrumental", "song"]),
            supports_lyrics=True,
            max_duration_sec=120,
            price_per_second=0,
            price_per_song=3,
            tags=json.dumps(["MiniMax", "免费", "纯音乐", "人声"]),
            adapter_name="minimax",
        )
        model5 = AIModel(
            name="MiniMax 音乐生成 (Pro)",
            code="minimax_music_paid",
            description="MiniMax music-2.6 付费版（需Token Plan），更高质量和并发，支持纯音乐和带人声歌曲",
            supported_modes=json.dumps(["instrumental", "song"]),
            supports_lyrics=True,
            max_duration_sec=120,
            price_per_second=0,
            price_per_song=15,
            tags=json.dumps(["MiniMax", "Pro", "高音质", "纯音乐", "人声"]),
            adapter_name="minimax",
        )
        model6 = AIModel(
            name="MiniMax 翻唱重绘 (体验)",
            code="minimax_cover_free",
            description="MiniMax music-cover-free 免费体验版，基于参考音频生成翻唱",
            supported_modes=json.dumps(["cover"]),
            supports_lyrics=True,
            max_duration_sec=360,
            price_per_second=0,
            price_per_song=5,
            tags=json.dumps(["MiniMax", "免费", "翻唱", "重绘"]),
            adapter_name="minimax",
        )
        model7 = AIModel(
            name="MiniMax 翻唱重绘 (Pro)",
            code="minimax_cover_paid",
            description="MiniMax music-cover 付费版（需Token Plan），更高音质翻唱，支持修改歌词后生成",
            supported_modes=json.dumps(["cover"]),
            supports_lyrics=True,
            max_duration_sec=360,
            price_per_second=0,
            price_per_song=20,
            tags=json.dumps(["MiniMax", "Pro", "高音质", "翻唱", "重绘"]),
            adapter_name="minimax",
        )
        db.add_all([model3, model4, model5, model6, model7])
        await db.flush()

        packages = [
            CreditPackage(
                name="入门套餐",
                price_cents=600,
                credits=100,
                bonus_credits=0,
                is_recommended=False,
            ),
            CreditPackage(
                name="进阶套餐",
                price_cents=3000,
                credits=600,
                bonus_credits=50,
                is_recommended=True,
            ),
            CreditPackage(
                name="专业套餐",
                price_cents=6000,
                credits=1500,
                bonus_credits=200,
                is_recommended=False,
            ),
            CreditPackage(
                name="大师套餐",
                price_cents=12000,
                credits=3000,
                bonus_credits=500,
                is_recommended=False,
            ),
        ]
        db.add_all(packages)
        await db.flush()

        configs = [
            SystemConfig(key="initial_credits", value="0"),
            SystemConfig(key="max_concurrent", value="3"),
            SystemConfig(key="auto_refund", value="true"),
            SystemConfig(key="lyrics_cost", value="5"),
        ]
        db.add_all(configs)

        await db.commit()
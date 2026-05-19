import json
from datetime import datetime, timedelta
from sqlalchemy import select, func
from app.database import async_session
from app.models.user import User
from app.models.ai_model import AIModel
from app.models.credit_package import CreditPackage
from app.models.system_config import SystemConfig
from app.models.generation_task import GenerationTask
from app.models.credit_order import CreditOrder
from app.models.credit_transaction import CreditTransaction
from app.models.admin_log import AdminLog
from app.utils.auth import hash_password


async def seed_data():
    async with async_session() as db:
        user_count = await db.scalar(select(func.count()).select_from(User))

        if not user_count or user_count == 0:
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

            models = [
                AIModel(
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
                ),
                AIModel(
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
                ),
                AIModel(
                    name="MiniMax 音乐生成 (Pro)",
                    code="minimax_music_paid",
                    description="MiniMax music-2.6 付费版，更高音质和并发",
                    supported_modes=json.dumps(["instrumental", "song"]),
                    supports_lyrics=True,
                    max_duration_sec=120,
                    price_per_second=0,
                    price_per_song=15,
                    tags=json.dumps(["MiniMax", "Pro", "高音质"]),
                    adapter_name="minimax",
                ),
                AIModel(
                    name="MiniMax 翻唱重绘 (体验)",
                    code="minimax_cover_free",
                    description="MiniMax music-cover-free 免费体验版",
                    supported_modes=json.dumps(["cover"]),
                    supports_lyrics=True,
                    max_duration_sec=360,
                    price_per_second=0,
                    price_per_song=5,
                    tags=json.dumps(["MiniMax", "免费", "翻唱"]),
                    adapter_name="minimax",
                ),
                AIModel(
                    name="MiniMax 翻唱重绘 (Pro)",
                    code="minimax_cover_paid",
                    description="MiniMax music-cover 付费版",
                    supported_modes=json.dumps(["cover"]),
                    supports_lyrics=True,
                    max_duration_sec=360,
                    price_per_second=0,
                    price_per_song=20,
                    tags=json.dumps(["MiniMax", "Pro", "翻唱"]),
                    adapter_name="minimax",
                ),
            ]
            db.add_all(models)
            await db.flush()

            packages = [
                CreditPackage(name="入门套餐", price_cents=600, credits=100, bonus_credits=0, is_recommended=False),
                CreditPackage(name="进阶套餐", price_cents=3000, credits=600, bonus_credits=50, is_recommended=True),
                CreditPackage(name="专业套餐", price_cents=6000, credits=1500, bonus_credits=200, is_recommended=False),
                CreditPackage(name="大师套餐", price_cents=12000, credits=3000, bonus_credits=500, is_recommended=False),
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

        task_count = await db.scalar(select(func.count()).select_from(GenerationTask))
        if task_count and task_count > 0:
            return

        now = datetime.now()
        day = timedelta(days=1)
        hour = timedelta(hours=1)

        users_data = [
            {"username": "音乐小明", "email": "xiaoming@music.cn", "credits": 850, "is_active": True},
            {"username": "创作小芳", "email": "xiaofang@music.cn", "credits": 2340, "is_active": True},
            {"username": "制作人Leo", "email": "leo@music.cn", "credits": 5200, "is_active": True},
            {"username": "混音王老师", "email": "wang@music.cn", "credits": 180, "is_active": False},
            {"username": "歌手小美", "email": "xiaomei@music.cn", "credits": 430, "is_active": True},
            {"username": "编曲阿杰", "email": "ajie@music.cn", "credits": 3100, "is_active": True},
            {"username": "音效Lily", "email": "lily@music.cn", "credits": 760, "is_active": True},
            {"username": "钢琴Ken", "email": "ken@music.cn", "credits": 950, "is_active": True},
            {"username": "测试账号", "email": "test@music.cn", "credits": 0, "is_active": True},
        ]

        users = []
        for u in users_data:
            user = User(
                username=u["username"],
                email=u["email"],
                password_hash=hash_password("123456"),
                credits=u["credits"],
                total_credits_earned=u["credits"] + 500,
                total_credits_spent=500,
                is_admin=False,
                is_active=u["is_active"],
                created_at=now - timedelta(days=20 + len(users)),
            )
            users.append(user)

        db.add_all(users)
        await db.flush()

        tasks = [
            GenerationTask(user_id=users[0].id, model_id=2, mode="instrumental", prompt="轻快钢琴曲", duration_sec=60, actual_duration_sec=58, cost_credits=120, status="completed", audio_url="/sample.mp3", created_at=now - hour * 1, completed_at=now - hour * 1 + timedelta(seconds=90)),
            GenerationTask(user_id=users[1].id, model_id=3, mode="song", prompt="流行情歌", lyrics="你是我最美的风景", duration_sec=120, actual_duration_sec=118, cost_credits=360, status="completed", audio_url="/sample.mp3", created_at=now - hour * 2, completed_at=now - hour * 2 + timedelta(seconds=180)),
            GenerationTask(user_id=users[2].id, model_id=2, mode="instrumental", prompt="电子舞曲", duration_sec=90, actual_duration_sec=88, cost_credits=360, status="completed", audio_url="/sample.mp3", created_at=now - hour * 3, completed_at=now - hour * 3 + timedelta(seconds=120)),
            GenerationTask(user_id=users[0].id, model_id=3, mode="song", prompt="古风歌曲", lyrics="山水之间烟雨朦胧", duration_sec=150, cost_credits=450, status="processing", created_at=now - timedelta(minutes=10)),
            GenerationTask(user_id=users[4].id, model_id=2, mode="instrumental", prompt="宁静夜晚", duration_sec=45, cost_credits=90, status="failed", error_message="API超时", created_at=now - hour * 5, completed_at=now - hour * 4),
            GenerationTask(user_id=users[5].id, model_id=3, mode="instrumental", prompt="电影配乐", duration_sec=180, actual_duration_sec=175, cost_credits=540, status="completed", audio_url="/sample.mp3", created_at=now - hour * 6, completed_at=now - hour * 5),
            GenerationTask(user_id=users[1].id, model_id=2, mode="instrumental", prompt="HIP-HOP节奏", duration_sec=60, actual_duration_sec=58, cost_credits=240, status="completed", audio_url="/sample.mp3", created_at=now - hour * 8, completed_at=now - hour * 7),
            GenerationTask(user_id=users[2].id, model_id=3, mode="song", prompt="摇滚风格", lyrics="燃烧吧我的青春", duration_sec=120, actual_duration_sec=118, cost_credits=360, status="completed", audio_url="/sample.mp3", created_at=now - hour * 10, completed_at=now - hour * 9),
            GenerationTask(user_id=users[7].id, model_id=2, mode="instrumental", prompt="古典吉他", duration_sec=90, actual_duration_sec=88, cost_credits=180, status="completed", audio_url="/sample.mp3", created_at=now - hour * 12, completed_at=now - hour * 11),
            GenerationTask(user_id=users[0].id, model_id=2, mode="instrumental", prompt="Lo-Fi节奏", duration_sec=120, actual_duration_sec=118, cost_credits=480, status="completed", audio_url="/sample.mp3", created_at=now - day, completed_at=now - day + timedelta(seconds=120)),
            GenerationTask(user_id=users[3].id, model_id=2, mode="instrumental", prompt="悲伤大提琴", duration_sec=60, cost_credits=120, status="failed", error_message="模型不可用", created_at=now - day - hour * 2, completed_at=now - day - hour),
            GenerationTask(user_id=users[5].id, model_id=3, mode="song", prompt="R&B情歌", lyrics="你的微笑像阳光", duration_sec=150, actual_duration_sec=148, cost_credits=450, status="completed", audio_url="/sample.mp3", created_at=now - day - hour * 4, completed_at=now - day - hour * 3),
            GenerationTask(user_id=users[1].id, model_id=2, mode="instrumental", prompt="海浪背景音", duration_sec=180, actual_duration_sec=176, cost_credits=360, status="completed", audio_url="/sample.mp3", created_at=now - day * 2, completed_at=now - day * 2 + timedelta(seconds=180)),
            GenerationTask(user_id=users[6].id, model_id=2, mode="instrumental", prompt="小提琴独奏", duration_sec=60, actual_duration_sec=58, cost_credits=120, status="completed", audio_url="/sample.mp3", created_at=now - day * 3, completed_at=now - day * 3 + timedelta(seconds=80)),
            GenerationTask(user_id=users[7].id, model_id=3, mode="song", prompt="民谣小调", lyrics="走在乡间的小路上", duration_sec=120, actual_duration_sec=118, cost_credits=360, status="completed", audio_url="/sample.mp3", created_at=now - day * 4, completed_at=now - day * 4 + timedelta(seconds=180)),
            GenerationTask(user_id=users[4].id, model_id=2, mode="instrumental", prompt="Trap节拍", duration_sec=90, cost_credits=360, status="processing", created_at=now - timedelta(minutes=5)),
            GenerationTask(user_id=users[6].id, model_id=2, mode="instrumental", prompt="欢快尤克里里", duration_sec=30, cost_credits=60, status="pending", created_at=now - timedelta(minutes=2)),
            GenerationTask(user_id=users[2].id, model_id=3, mode="instrumental", prompt="舒缓冥想音乐", duration_sec=200, cost_credits=600, status="pending", created_at=now - timedelta(minutes=1)),
        ]

        db.add_all(tasks)
        await db.flush()

        orders = [
            CreditOrder(order_no="ORD05050001", user_id=users[0].id, package_id=2, amount_cents=3000, credits_bought=600, bonus_credits=50, status="success", payment_method="wechat", paid_at=now - hour * 2, created_at=now - hour * 3),
            CreditOrder(order_no="ORD05050002", user_id=users[1].id, package_id=3, amount_cents=6000, credits_bought=1500, bonus_credits=200, status="success", payment_method="alipay", paid_at=now - hour, created_at=now - hour - timedelta(seconds=60)),
            CreditOrder(order_no="ORD05050003", user_id=users[2].id, package_id=4, amount_cents=12000, credits_bought=3000, bonus_credits=500, status="success", payment_method="wechat", paid_at=now - hour * 4, created_at=now - hour * 5),
            CreditOrder(order_no="ORD05050004", user_id=users[5].id, package_id=2, amount_cents=3000, credits_bought=600, bonus_credits=50, status="success", payment_method="alipay", paid_at=now - day, created_at=now - day - hour),
            CreditOrder(order_no="ORD05050005", user_id=users[3].id, package_id=1, amount_cents=600, credits_bought=100, bonus_credits=0, status="success", payment_method="wechat", paid_at=now - day * 3, created_at=now - day * 3 - hour),
            CreditOrder(order_no="ORD05050006", user_id=users[6].id, package_id=1, amount_cents=600, credits_bought=100, bonus_credits=0, status="pending", payment_method="alipay", created_at=now - hour * 2),
            CreditOrder(order_no="ORD05050007", user_id=users[7].id, package_id=2, amount_cents=3000, credits_bought=600, bonus_credits=50, status="pending", payment_method="wechat", created_at=now - hour),
            CreditOrder(order_no="ORD05050008", user_id=users[4].id, package_id=3, amount_cents=6000, credits_bought=1500, bonus_credits=200, status="failed", payment_method="alipay", created_at=now - day * 5),
        ]

        db.add_all(orders)
        await db.flush()

        transactions = [
            CreditTransaction(user_id=users[0].id, amount=650, balance_after=850, type="purchase", description="购买进阶套餐 +50赠送", created_at=now - hour * 3),
            CreditTransaction(user_id=users[0].id, amount=-120, balance_after=850, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - hour * 1),
            CreditTransaction(user_id=users[0].id, amount=-450, balance_after=850, type="consumption", description="生成消耗 - MiniMax Pro", created_at=now - timedelta(minutes=10)),
            CreditTransaction(user_id=users[0].id, amount=-480, balance_after=850, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - day),
            CreditTransaction(user_id=users[1].id, amount=1700, balance_after=2340, type="purchase", description="购买专业套餐 +200赠送", created_at=now - hour),
            CreditTransaction(user_id=users[1].id, amount=-360, balance_after=2340, type="consumption", description="生成消耗 - MiniMax Pro", created_at=now - hour * 2),
            CreditTransaction(user_id=users[1].id, amount=-240, balance_after=2340, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - hour * 8),
            CreditTransaction(user_id=users[1].id, amount=-360, balance_after=2340, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - day * 2),
            CreditTransaction(user_id=users[2].id, amount=3500, balance_after=5200, type="purchase", description="购买大师套餐 +500赠送", created_at=now - hour * 5),
            CreditTransaction(user_id=users[2].id, amount=-360, balance_after=5200, type="consumption", description="生成消耗 - MiniMax Pro", created_at=now - hour * 3),
            CreditTransaction(user_id=users[2].id, amount=-360, balance_after=5200, type="consumption", description="生成消耗 - MiniMax Pro", created_at=now - hour * 10),
            CreditTransaction(user_id=users[4].id, amount=100, balance_after=430, type="purchase", description="购买入门套餐", created_at=now - day * 3),
            CreditTransaction(user_id=users[4].id, amount=-90, balance_after=430, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - hour * 5),
            CreditTransaction(user_id=users[5].id, amount=650, balance_after=3100, type="purchase", description="购买进阶套餐 +50赠送", created_at=now - day),
            CreditTransaction(user_id=users[6].id, amount=-120, balance_after=760, type="consumption", description="生成消耗 - MiniMax体验", created_at=now - day * 3),
            CreditTransaction(user_id=users[7].id, amount=650, balance_after=950, type="purchase", description="系统注册赠送", created_at=now - day * 5),
        ]

        db.add_all(transactions)
        await db.flush()

        logs = [
            AdminLog(admin_id=1, action="login", target_type="user", target_id=1, details=json.dumps({"ip": "127.0.0.1"}), ip="127.0.0.1", created_at=now - timedelta(minutes=5)),
            AdminLog(admin_id=1, action="update", target_type="config", details=json.dumps({"key": "initial_credits", "value": "0"}), ip="127.0.0.1", created_at=now - timedelta(minutes=30)),
            AdminLog(admin_id=1, action="create", target_type="model", target_id=3, details=json.dumps({"name": "MiniMax Pro"}), ip="127.0.0.1", created_at=now - hour),
            AdminLog(admin_id=1, action="toggle", target_type="user", target_id=4, details=json.dumps({"active": False}), ip="192.168.1.1", created_at=now - hour * 3),
            AdminLog(admin_id=1, action="adjust", target_type="user", target_id=2, details=json.dumps({"amount": 500, "reason": "活动奖励"}), ip="127.0.0.1", created_at=now - hour * 6),
            AdminLog(admin_id=1, action="update", target_type="package", target_id=2, details=json.dumps({"price_cents": 3000}), ip="10.0.0.1", created_at=now - hour * 9),
            AdminLog(admin_id=1, action="create", target_type="order", details=json.dumps({"user_id": 2, "amount": 6000}), ip="127.0.0.1", created_at=now - day),
            AdminLog(admin_id=1, action="toggle", target_type="model", target_id=1, details=json.dumps({"active": False}), ip="192.168.1.1", created_at=now - day * 2),
            AdminLog(admin_id=1, action="update", target_type="model", target_id=2, details=json.dumps({"price_per_song": {"from": 2, "to": 3}}), ip="127.0.0.1", created_at=now - day * 3),
            AdminLog(admin_id=1, action="login", target_type="user", target_id=1, details=json.dumps({"ip": "127.0.0.1"}), ip="127.0.0.1", created_at=now - day * 5),
        ]

        db.add_all(logs)
        await db.commit()
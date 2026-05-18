from openai import AsyncOpenAI
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("lyrics")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
        logger.info("[lyrics] DeepSeek客户端初始化完成")
    return _client


async def generate_lyrics(
    prompt: str,
    style: str | None = None,
    language: str = "zh",
    verse_count: int = 2,
    include_bridge: bool = False,
    include_pre_chorus: bool = False,
) -> str:
    """
    生成带结构标签的歌词，可直接用于 AI 音乐生成模型。

    :param prompt: 歌词主题/情绪描述
    :param style: 音乐风格，如 "pop", "rock"
    :param language: 歌词语言，默认中文
    :param verse_count: 主歌段数（Verse），默认2
    :param include_bridge: 是否包含桥段（Bridge）
    :param include_pre_chorus: 是否在主歌和副歌之间插入预副歌（Pre-Chorus）
    :return: 带标签的结构化歌词文本
    """
    client = _get_client()

    # 动态构建段落结构说明
    structure_parts = ["[Intro]"]
    for i in range(1, verse_count + 1):
        structure_parts.append(f"[Verse {i}]")
        if include_pre_chorus:
            structure_parts.append(f"[Pre-Chorus {i}]")
        structure_parts.append("[Chorus]")
    if include_bridge:
        structure_parts.append("[Bridge]")
        structure_parts.append("[Chorus]")
    structure_parts.append("[Outro]")

    structure_desc = " → ".join(structure_parts)

    style_hint = f"，音乐风格：{style}" if style else ""
    lang_name = "中文" if language == "zh" else "英语" if language == "en" else language

    system_prompt = (
        f"你是一位专业的{lang_name}歌词创作人。请根据用户的要求，创作一首结构完整的歌曲歌词。\n"
        f"必须严格遵循以下段落结构：{structure_desc}\n"
        f"每个段落用方括号标签标记（如 [Verse 1]），段落内部每行一句歌词，段落之间用空行分隔。\n"
        f"歌词需要押韵、有节奏感、情感真挚，副歌部分可重复以增强记忆点。\n"
        f"只返回歌词，不要添加任何解释、标题或额外说明。"
    )

    user_prompt = f"请为我写一首关于「{prompt}」的歌曲{style_hint}"

    logger.info(
        "[lyrics] 开始生成 | prompt=%s | style=%s | language=%s | verses=%d | bridge=%s | pre_chorus=%s",
        prompt, style or "N/A", language, verse_count,
        str(include_bridge), str(include_pre_chorus),
    )

    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.85,   # 稍高一点保证歌词创意
        max_tokens=1024,
    )

    lyrics = response.choices[0].message.content or ""
    logger.info(
        "[lyrics] 生成完成 | chars=%d | tokens_in=%d | tokens_out=%d",
        len(lyrics),
        response.usage.prompt_tokens if response.usage else 0,
        response.usage.completion_tokens if response.usage else 0,
    )

    return lyrics.strip()
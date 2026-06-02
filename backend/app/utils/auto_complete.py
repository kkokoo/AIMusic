import json
import re
from openai import AsyncOpenAI
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("auto_complete")

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )
        logger.info("[auto_complete] DeepSeek客户端初始化完成")
    return _client


async def auto_complete_form(
    mode: str,
    prompt: str | None = None,
    style: str | None = None,
    mood: str | None = None,
    bpm: int | None = None,
    lyrics: str | None = None,
    vocal_style: str | None = None,
    music_name: str | None = None,
) -> dict:
    client = _get_client()

    filled_fields = []
    if prompt and prompt.strip():
        filled_fields.append(f"音乐描述: {prompt}")
    if style and style.strip():
        filled_fields.append(f"风格: {style}")
    if mood and mood.strip():
        filled_fields.append(f"情绪: {mood}")
    if bpm:
        filled_fields.append(f"BPM: {bpm}")
    if lyrics and lyrics.strip():
        filled_fields.append(f"歌词: {lyrics[:100]}...")
    if vocal_style and vocal_style.strip():
        filled_fields.append(f"声音风格: {vocal_style}")
    if music_name and music_name.strip():
        filled_fields.append(f"音乐名称: {music_name}")

    filled_info = "\n".join(f"  - {f}" for f in filled_fields) if filled_fields else "  (用户尚未填写任何内容)"

    mode_label = {"instrumental": "纯音乐", "song": "歌曲", "cover": "翻唱"}.get(mode, mode)

    if mode == "instrumental":
        output_desc = (
            "你需要根据用户已填写的信息，补全以下字段并输出JSON：\n"
            "{\n"
            '  "prompt": "一段详细的中文音乐描述，包含乐器、氛围、场景、情绪等（2-4句话）",\n'
            '  "style": "从[流行,古典,电子,爵士,摇滚,民谣,R&B,嘻哈]中选择最匹配的一种",\n'
            '  "mood": "从[欢快,忧伤,激昂,平静,浪漫,神秘]中选择最匹配的一种",\n'
            '  "bpm": 80-160之间的整数（默认120）,\n'
            '  "music_name": "一个有诗意、贴合主题的简短中文曲名（10字以内）"\n'
            "}"
        )
    elif mode == "song":
        output_desc = (
            "你需要根据用户已填写的信息，补全以下字段并输出JSON：\n"
            "{\n"
            '  "prompt": "一段详细的中文歌曲氛围描述（2-3句话）",\n'
            '  "lyrics": "一首结构完整的中文歌词，包含[Intro][Verse 1][Chorus][Verse 2][Bridge][Outro]标签，每个段落4行，副歌要有记忆点",\n'
            '  "vocal_style": "从[流行,摇滚,说唱,民谣,R&B]中选择最匹配的一种",\n'
            '  "music_name": "一个有诗意、贴合主题的简短中文曲名（10字以内）"\n'
            "}"
        )
    else:
        output_desc = (
            "你需要根据用户已填写的信息，补全以下字段并输出JSON：\n"
            "{\n"
            '  "prompt": "翻唱风格描述，如：流行, 电子, 欢快（30字以内）",\n'
            '  "lyrics": "一段适合改写的简短中文歌词（20-40字），如果用户已有歌词则保留原意优化",\n'
            '  "music_name": "一个贴合翻唱主题的简短曲名（10字以内）"\n'
            "}"
        )

    system_prompt = (
        f"你是一位专业的AI音乐创作助手，精通{mode_label}创作。\n"
        f"用户正在使用AI音乐生成平台创作一首{mode_label}作品，已经填写了部分信息。\n"
        f"你的任务是：根据用户已填写的部分内容，智能补全剩余的字段，使整个创作参数完整且协调。\n\n"
        f"{output_desc}\n\n"
        f"补全规则：\n"
        f"1. 对于用户已经填写的字段，沿用用户的内容不要改动\n"
        f"2. 所有字段都应该在一个JSON对象中返回\n"
        f"3. 补全的内容应该风格统一、专业、有创意\n"
        f"4. 只返回JSON，不要添加任何解释文字\n"
        f"5. JSON中的字符串必须用双引号，不要使用单引号"
    )

    user_prompt = (
        f"创作模式：{mode_label}\n"
        f"用户已填写的信息：\n{filled_info}\n\n"
        f"请根据以上信息，补全所有字段并返回JSON。"
    )

    logger.info(
        "[auto_complete] 开始生成 | mode=%s | prompt=%s | style=%s | mood=%s | bpm=%s | lyrics_len=%d | vocal_style=%s | music_name=%s",
        mode,
        (prompt or "")[:40] + "..." if prompt and len(prompt) > 40 else prompt or "N/A",
        style or "N/A",
        mood or "N/A",
        str(bpm) if bpm else "N/A",
        len(lyrics) if lyrics else 0,
        vocal_style or "N/A",
        music_name or "N/A",
    )

    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.9,
        max_tokens=2048,
    )

    raw = response.choices[0].message.content or ""
    logger.info(
        "[auto_complete] 生成完成 | tokens_in=%d | tokens_out=%d | raw_len=%d",
        response.usage.prompt_tokens if response.usage else 0,
        response.usage.completion_tokens if response.usage else 0,
        len(raw),
    )

    try:
        match = re.search(r'\{[\s\S]*\}', raw)
        json_str = match.group(0) if match else raw
        result = json.loads(json_str)

        cleaned = {}
        for key, value in result.items():
            if value is not None and str(value).strip():
                if key == "bpm":
                    try:
                        cleaned[key] = int(value)
                    except (ValueError, TypeError):
                        cleaned[key] = 120
                else:
                    cleaned[key] = str(value).strip()

        logger.info(
            "[auto_complete] JSON解析成功 | keys=%s",
            list(cleaned.keys()),
        )
        return cleaned
    except (json.JSONDecodeError, AttributeError) as e:
        logger.error("[auto_complete] JSON解析失败 | error=%s | raw=%s", str(e), raw[:200])
        raise ValueError(f"AI返回的JSON格式无效: {str(e)}")
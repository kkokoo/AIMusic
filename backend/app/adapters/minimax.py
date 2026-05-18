import asyncio
import binascii
import httpx
import json
from app.adapters.base import BaseAdapter
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("adapter.minimax")


class MiniMaxMusicAdapter(BaseAdapter):

    MODEL_NAME_MAP: dict[str, str] = {
        "minimax_music_free": "music-2.6-free",
        "minimax_music_paid": "music-2.6",
        "minimax_cover_free": "music-cover-free",
        "minimax_cover_paid": "music-cover",
    }

    def __init__(self, api_config: dict | None = None):
        self._api_config = api_config or {}

    def get_api_model_name(self, code: str) -> str:
        return self.MODEL_NAME_MAP.get(code, "music-2.6-free")

    def _get_api_key(self) -> str:
        return self._api_config.get("api_key") or settings.minimax_api_key

    def _get_base_url(self) -> str:
        return self._api_config.get("base_url") or settings.minimax_base_url

    def build_request(self, task_params: dict) -> dict:
        model_name = task_params.get("model_name", "music-2.6-free")
        mode = task_params.get("mode", "instrumental")
        prompt = task_params.get("prompt") or ""
        lyrics = task_params.get("lyrics") or ""
        duration_limit = task_params.get("duration_sec", 60)

        payload: dict = {
            "model": model_name,
            "output_format": "hex",
            "audio_setting": {
                "sample_rate": 44100,
                "bitrate": 256000,
                "format": "mp3",
            },
        }

        if mode == "instrumental":
            payload["is_instrumental"] = True
            payload["prompt"] = prompt[:2000] if prompt else "轻快流行音乐"
        elif mode == "song":
            payload["is_instrumental"] = False
            if lyrics:
                payload["lyrics"] = lyrics[:3500]
            if prompt:
                payload["prompt"] = prompt[:2000]
        elif mode == "cover":
            payload["is_instrumental"] = False
            audio_base64 = task_params.get("audio_base64")
            if audio_base64:
                payload["audio_base64"] = audio_base64
            if lyrics:
                payload["lyrics"] = lyrics[:1000]
            if prompt:
                payload["prompt"] = prompt[:300]

        logger.info(
            "[minimax] build_request | model=%s | mode=%s | prompt_len=%d | lyrics_len=%d",
            model_name, mode, len(prompt), len(lyrics),
        )
        return payload

    def parse_response(self, response_data: dict) -> dict:
        data = response_data.get("data", {})
        base_resp = response_data.get("base_resp", {})

        status_code = base_resp.get("status_code", -1)
        trace_id = response_data.get("trace_id", "")
        status_msg = base_resp.get("status_msg") or ""

        if status_code != 0:
            error_msg = status_msg or f"MiniMax API错误 (status_code={status_code})"

            if status_code == 1008:
                error_msg = "MiniMax账户余额不足或非Token Plan用户，付费模型需开通Token Plan"
            elif status_code == 1002:
                error_msg = "MiniMax请求频率超限，请稍后重试"
            elif status_code == 1004:
                error_msg = "MiniMax API-Key鉴权失败，请检查密钥"
            elif status_code == 2013:
                error_msg = f"MiniMax参数异常: {status_msg or '未知参数错误'}"
            elif status_code == 2049:
                error_msg = "MiniMax API-Key无效"

            logger.error(
                "[minimax] API返回错误 | status_code=%d | status_msg=%s | error_msg=%s | trace_id=%s | raw_keys=%s",
                status_code, status_msg, error_msg, trace_id, list(response_data.keys()),
            )
            return {"error": error_msg}

        audio_hex = data.get("audio", "")
        if not audio_hex:
            return {"error": "MiniMax未返回音频数据"}

        try:
            audio_bytes = binascii.unhexlify(audio_hex)
        except binascii.Error as e:
            logger.error("[minimax] hex解码失败 | error=%s", str(e))
            return {"error": f"音频数据解码失败: {str(e)}"}

        extra_info = response_data.get("extra_info", {})
        actual_duration_ms = extra_info.get("music_duration", 0)
        actual_duration_sec = max(1, int(actual_duration_ms / 1000))

        logger.info(
            "[minimax] 生成成功 | trace_id=%s | size=%d | duration=%ds",
            trace_id, len(audio_bytes), actual_duration_sec,
        )

        return {
            "audio_data": audio_bytes,
            "duration": actual_duration_sec,
            "format": "mp3",
            "trace_id": trace_id,
        }

    async def generate(self, task_params: dict, max_retries: int = 3, retry_delay: float = 2.0) -> dict:
        payload = self.build_request(task_params)
        model_name = task_params.get("model_name", "music-2.6-free")
        api_key = self._get_api_key()
        base_url = self._get_base_url()

        if not api_key:
            logger.error("[minimax] 未配置API密钥")
            return {"error": "MiniMax API密钥未配置，请联系管理员"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        logger.info("[minimax] 发起API请求 | model=%s | mode=%s | base=%s", model_name, task_params.get("mode"), base_url)

        timeout = httpx.Timeout(
            connect=15.0,
            read=600.0,
            write=60.0,
            pool=10.0,
        )

        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        f"{base_url}/v1/music_generation",
                        json=payload,
                        headers=headers,
                    )
                    response.raise_for_status()
                    result = response.json()
                return self.parse_response(result)
            except httpx.TimeoutException as e:
                exc_class = type(e).__name__
                exc_msg = str(e) or "(无详细信息)"
                logger.warning(
                    "[minimax] 请求超时 | attempt=%d/%d | exc=%s | msg=%s | "
                    "connect=15s read=600s write=60s",
                    attempt, max_retries, exc_class, exc_msg,
                )
                if attempt < 2:
                    await asyncio.sleep(retry_delay * attempt)
                    continue
                else:
                    logger.error("[minimax] 多次超时，放弃重试 | attempts=%d", attempt)
                    return {"error": "MiniMax请求超时，音乐生成耗时较长，请稍后重试"}
            except httpx.HTTPStatusError as e:
                resp_body = ""
                try:
                    resp_body = e.response.text[:500]
                except Exception:
                    pass
                logger.error(
                    "[minimax] HTTP错误 | status=%d | body=%s | attempt=%d/%d",
                    e.response.status_code, resp_body, attempt, max_retries,
                )
                if attempt < max_retries and e.response.status_code in [500, 502, 503, 504]:
                    await asyncio.sleep(retry_delay * attempt)
                    continue
                return {"error": f"MiniMax服务返回错误 (HTTP {e.response.status_code}): {resp_body}"}
            except Exception as e:
                last_error = f"MiniMax连接失败: {str(e)}"
                logger.error(
                    "[minimax] 网络异常 | error=%s | type=%s | attempt=%d/%d",
                    str(e), type(e).__name__, attempt, max_retries,
                )
                if attempt < max_retries:
                    await asyncio.sleep(retry_delay * attempt)
                    continue
                else:
                    return {"error": f"MiniMax连接失败: {str(e)}"}
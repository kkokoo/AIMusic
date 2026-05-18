import uuid
from datetime import datetime
from qcloud_cos import CosConfig, CosS3Client
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("storage")

_config: CosConfig | None = None
_client: CosS3Client | None = None


def _get_client() -> CosS3Client:
    global _config, _client
    if _client is None:
        _config = CosConfig(
            Region=settings.cos_region,
            SecretId=settings.cos_secret_id,
            SecretKey=settings.cos_secret_key,
        )
        _client = CosS3Client(_config)
        logger.info("[cos] 客户端初始化完成 | region=%s | bucket=%s", settings.cos_region, settings.cos_bucket)
    return _client


def _build_key(folder: str, filename: str) -> str:
    date_prefix = datetime.now().strftime("%Y/%m/%d")
    return f"{folder}/{date_prefix}/{uuid.uuid4().hex[:8]}_{filename}"


def upload_bytes(data: bytes, folder: str, filename: str, content_type: str = "application/octet-stream") -> str:
    client = _get_client()
    key = _build_key(folder, filename)
    client.put_object(
        Bucket=settings.cos_bucket,
        Body=data,
        Key=key,
        ContentType=content_type,
    )
    logger.info("[cos] 上传成功 | key=%s | size=%d | type=%s", key, len(data), content_type)

    if settings.cos_cdn_domain:
        return f"{settings.cos_cdn_domain}/{key}"

    return f"https://{settings.cos_bucket}.cos.{settings.cos_region}.myqcloud.com/{key}"


def upload_file(file_path: str, folder: str, filename: str, content_type: str = "application/octet-stream") -> str:
    with open(file_path, "rb") as f:
        data = f.read()
    return upload_bytes(data, folder, filename, content_type)


def delete_object(key: str) -> None:
    client = _get_client()
    client.delete_object(Bucket=settings.cos_bucket, Key=key)
    logger.info("[cos] 删除成功 | key=%s", key)


def get_public_url(key: str) -> str:
    if settings.cos_cdn_domain:
        return f"{settings.cos_cdn_domain}/{key}"
    return f"https://{settings.cos_bucket}.cos.{settings.cos_region}.myqcloud.com/{key}"
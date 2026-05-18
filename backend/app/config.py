from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./app.db"
    jwt_secret: str = "change-me-in-production"
    jwt_expire_days: int = 7
    upload_dir: str = "./uploads"
    cors_origins: str = "http://49.235.178.100:3000"

    cos_secret_id: str = ""
    cos_secret_key: str = ""
    cos_bucket: str = "ai-music-data-1433640657"
    cos_region: str = "ap-guangzhou"
    cos_cdn_domain: str = ""

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimaxi.com"

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "AI Music"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

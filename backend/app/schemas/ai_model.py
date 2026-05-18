from pydantic import BaseModel


class ModelResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None
    supported_modes: list[str]
    supports_lyrics: bool
    max_duration_sec: int
    price_per_second: float
    price_per_song: float = 0
    tags: list[str]
    adapter_name: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class ModelCreateRequest(BaseModel):
    name: str
    code: str
    description: str | None = None
    supported_modes: list[str] = ["instrumental"]
    supports_lyrics: bool = False
    max_duration_sec: int = 60
    price_per_second: float = 1.0
    price_per_song: float = 0
    tags: list[str] = []
    api_config: dict = {}
    adapter_name: str | None = None
    max_concurrent: int = 5


class ModelUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    supported_modes: list[str] | None = None
    supports_lyrics: bool | None = None
    max_duration_sec: int | None = None
    price_per_second: float | None = None
    price_per_song: float | None = None
    tags: list[str] | None = None
    api_config: dict | None = None
    adapter_name: str | None = None
    max_concurrent: int | None = None
    is_active: bool | None = None
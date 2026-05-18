from pydantic import BaseModel
from datetime import datetime


class SubmitTaskRequest(BaseModel):
    model_id: int
    mode: str
    prompt: str | None = None
    lyrics: str | None = None
    style: str | None = None
    vocal_gender: str | None = None
    vocal_style: str | None = None
    language: str | None = None
    duration_sec: int
    audio_base64: str | None = None
    custom_name: str | None = None


class RenameTaskRequest(BaseModel):
    custom_name: str


class GenerateLyricsRequest(BaseModel):
    prompt: str
    style: str | None = None
    language: str = "zh"
    verse_count: int = 2
    include_bridge: bool = True


class TaskResponse(BaseModel):
    id: int
    user_id: int
    model_id: int
    mode: str
    prompt: str | None
    lyrics: str | None
    style: str | None
    vocal_gender: str | None
    vocal_style: str | None
    language: str | None
    duration_sec: int
    actual_duration_sec: int | None
    cost_credits: float
    status: str
    audio_url: str | None
    error_message: str | None
    play_count: int = 0
    custom_name: str | None = None
    created_at: str
    completed_at: str | None
    model_name: str | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_model(cls, task, model_name: str | None = None):
        data = {
            "id": task.id, "user_id": task.user_id, "model_id": task.model_id,
            "mode": task.mode, "prompt": task.prompt, "lyrics": task.lyrics,
            "style": task.style, "vocal_gender": task.vocal_gender,
            "vocal_style": task.vocal_style, "language": task.language,
            "duration_sec": task.duration_sec, "actual_duration_sec": task.actual_duration_sec,
            "cost_credits": task.cost_credits, "status": task.status,
            "audio_url": task.audio_url, "error_message": task.error_message,
            "play_count": getattr(task, 'play_count', 0),
            "custom_name": getattr(task, 'custom_name', None),
            "created_at": task.created_at.isoformat() + 'Z', "completed_at": task.completed_at.isoformat() + 'Z' if task.completed_at else None,
            "model_name": model_name,
        }
        return cls(**data)
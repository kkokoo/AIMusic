from typing import Any
from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    data: Any = None
    message: str | None = None
    error: str | None = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "操作成功") -> dict:
        return {"success": True, "data": data, "message": message, "error": None}

    @classmethod
    def fail(cls, error: str) -> dict:
        return {"success": False, "data": None, "message": None, "error": error}
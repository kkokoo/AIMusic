from pydantic import BaseModel, field_validator


class CreateCommentRequest(BaseModel):
    task_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10 or len(v) > 200:
            raise ValueError("评论内容长度需在10-200字之间")
        return v


class CommentResponse(BaseModel):
    id: int
    user_id: int
    task_id: int
    content: str
    likes_count: int
    created_at: str
    user_nickname: str
    is_liked: bool = False
    is_owner: bool = False

    model_config = {"from_attributes": True}

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    credits: float
    total_credits_earned: float
    total_credits_spent: float
    is_active: bool
    is_admin: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    username: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
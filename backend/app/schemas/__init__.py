from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    UpdateProfileRequest, ChangePasswordRequest,
)
from app.schemas.ai_model import ModelResponse, ModelCreateRequest, ModelUpdateRequest
from app.schemas.generation import SubmitTaskRequest, TaskResponse, GenerateLyricsRequest
from app.schemas.credit import (
    TransactionResponse, PackageResponse, CreateOrderRequest, OrderResponse,
    PackageCreateRequest, PackageUpdateRequest,
)
from app.schemas.admin import (
    DashboardResponse, AdjustCreditsRequest, ConfigUpdateRequest, LogResponse,
)
from pydantic import BaseModel


class DashboardResponse(BaseModel):
    today_generations: int
    today_revenue: float
    active_users: int
    model_usage: list[dict]


class AdjustCreditsRequest(BaseModel):
    amount: float
    reason: str


class ConfigUpdateRequest(BaseModel):
    initial_credits: float | None = None
    max_concurrent: int | None = None
    auto_refund: bool | None = None
    credit_price_per_unit: float | None = None


class LogResponse(BaseModel):
    id: int
    admin_id: int
    action: str
    target_type: str
    target_id: int | None
    details: str
    ip: str | None
    created_at: str

    model_config = {"from_attributes": True}
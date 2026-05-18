from pydantic import BaseModel
from datetime import datetime


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    balance_after: float
    type: str
    related_id: int | None
    description: str | None
    created_at: str

    model_config = {"from_attributes": True}


class PackageResponse(BaseModel):
    id: int
    name: str
    price_cents: int
    credits: int
    bonus_credits: int
    is_recommended: bool
    is_active: bool

    model_config = {"from_attributes": True}


class CreateOrderRequest(BaseModel):
    package_id: int | None = None
    payment_method: str = "wechat"


class OrderResponse(BaseModel):
    id: int
    order_no: str
    user_id: int
    package_id: int | None
    amount_cents: int
    credits_bought: int
    bonus_credits: int
    status: str
    payment_method: str | None
    paid_at: str | None
    created_at: str

    model_config = {"from_attributes": True}


class PackageCreateRequest(BaseModel):
    name: str
    price_cents: int
    credits: int
    bonus_credits: int = 0
    is_recommended: bool = False
    is_active: bool = True


class PackageUpdateRequest(BaseModel):
    name: str | None = None
    price_cents: int | None = None
    credits: int | None = None
    bonus_credits: int | None = None
    is_recommended: bool | None = None
    is_active: bool | None = None
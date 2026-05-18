from app.routers.auth import router as auth_router
from app.routers.user import router as user_router
from app.routers.models import router as models_router
from app.routers.generation import router as generation_router
from app.routers.credits import router as credits_router
from app.routers.orders import router as orders_router
from app.routers.admin import router as admin_router
from app.routers.discovery import router as discovery_router

__all__ = [
    "auth_router", "user_router", "models_router",
    "generation_router", "credits_router", "orders_router",
    "admin_router", "discovery_router",
]
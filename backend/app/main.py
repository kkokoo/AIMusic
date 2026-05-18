from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router, user_router, models_router,
    generation_router, credits_router, orders_router, admin_router,
    discovery_router,
)
from app.utils.logger import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    from seed_data import seed_data
    await seed_data()
    yield


app = FastAPI(title="AIMusic API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(models_router)
app.include_router(generation_router)
app.include_router(credits_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(discovery_router)
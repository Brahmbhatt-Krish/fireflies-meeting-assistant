import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import engine, Base
from app.routers import meetings, action_items

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")

    # Auto-seed if DB is empty
    try:
        from seed.seed import seed_if_empty
        seed_if_empty()
    except Exception as e:
        logger.warning(f"Seed skipped: {e}")

    yield


app = FastAPI(
    title="Fireflies Clone API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# Routers
app.include_router(meetings.router)
app.include_router(action_items.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

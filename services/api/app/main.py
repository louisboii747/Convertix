import atexit
from contextlib import asynccontextmanager

from fastapi import FastAPI
from posthog import Posthog
from sqlalchemy import text

from app.core.config import get_settings
from app.db.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    posthog_client = None

    if settings.posthog_project_token and settings.posthog_host:
        posthog_client = Posthog(
            settings.posthog_project_token,
            host=settings.posthog_host,
            enable_exception_autocapture=True,
        )
        app.state.posthog_client = posthog_client
        atexit.register(posthog_client.shutdown)
    elif settings.debug:
        missing_variable = (
            "POSTHOG_PROJECT_TOKEN"
            if not settings.posthog_project_token
            else "POSTHOG_HOST"
        )
        raise RuntimeError(
            f"{missing_variable} variable required by PostHog is missing or "
            f"un-configured, this causes events to be silently missed. This error "
            f"stops appearing once {missing_variable} is configured"
        )

    yield

    if posthog_client:
        posthog_client.flush()


app = FastAPI(
    title="Converter Platform API",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "service": "converter-api",
        "database": "connected",
    }

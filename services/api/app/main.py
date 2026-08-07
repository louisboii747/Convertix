from fastapi import FastAPI
from sqlalchemy import text

from app.db.database import engine

app = FastAPI(
    title="Converter Platform API",
    version="0.1.0",
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

"""
TIDECAST Backend — FastAPI Application Entry Point

Multi-agent fisheries advisory delivery system.
Built for the 6R Hackathon 2026.
"""
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("tidecast")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — initialize resources on startup."""
    logger.info("🌊 TIDECAST backend starting up...")
    logger.info(f"   Project: {settings.GCP_PROJECT_ID}")
    logger.info(f"   Region: {settings.GCP_REGION}")
    logger.info(f"   Gemini Model: {settings.GEMINI_MODEL}")

    # Initialize Firebase Admin SDK
    from core.firebase_admin import initialize_firebase
    initialize_firebase()
    logger.info("   Firebase Admin SDK initialized")

    yield

    logger.info("🌊 TIDECAST backend shutting down...")


app = FastAPI(
    title="TIDECAST API",
    description="Multi-agent fisheries advisory delivery system — translates, voices, and delivers coastal safety advisories to fishermen across language and connectivity barriers.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://127.0.0.1:5173",          # Vite dev server (IP form)
        "http://localhost:4173",          # Vite preview
        "https://tidecast-507006.web.app",  # Firebase Hosting
        "https://tidecast-507006.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {
        "status": "healthy",
        "service": "tidecast-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "project": settings.GCP_PROJECT_ID,
    }


# Import and register routers
from api.advisories import router as advisories_router
from api.users import router as users_router
from api.deliveries import router as deliveries_router
from api.admin import router as admin_router

app.include_router(advisories_router, prefix="/api", tags=["Advisories"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(deliveries_router, prefix="/api", tags=["Deliveries"])
app.include_router(admin_router, prefix="/api", tags=["Admin"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

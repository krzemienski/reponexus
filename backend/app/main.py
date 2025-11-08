from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.db import engine, Base
from app.api.v1 import auth, repositories, topics, users, search, webhooks, analytics, notifications
from app.api.v1 import settings as settings_router
from app.middleware.security import SecurityHeadersMiddleware, RequestIDMiddleware

# Import models to ensure they are registered with SQLAlchemy
from app.models import user, repository, topic, audit_log, starred_repository, analytics as analytics_models, notification, settings as settings_model, search_history  # noqa


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("🚀 Starting Repo Nexus API...")

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ Database tables created")
    print(f"📝 API documentation available at: http://localhost:8000/docs")

    yield

    # Shutdown
    print("👋 Shutting down Repo Nexus API...")
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enhanced GitHub exploration API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Add Security Headers Middleware (first for all responses)
app.add_middleware(SecurityHeadersMiddleware)

# Add Request ID Middleware (for tracking and logging)
app.add_middleware(RequestIDMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Repo Nexus API",
        "version": settings.VERSION,
        "docs": "/docs",
    }

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(
    repositories.router,
    prefix=f"{settings.API_V1_PREFIX}/repositories",
    tags=["repositories"],
)
app.include_router(topics.router, prefix=f"{settings.API_V1_PREFIX}/topics", tags=["topics"])
app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
app.include_router(search.router, prefix=f"{settings.API_V1_PREFIX}/search", tags=["search"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["analytics"])
app.include_router(webhooks.router, prefix=settings.API_V1_PREFIX, tags=["webhooks"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_PREFIX}/notifications", tags=["notifications"])
app.include_router(settings_router.router, prefix=f"{settings.API_V1_PREFIX}/settings", tags=["settings"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )

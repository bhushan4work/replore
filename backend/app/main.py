from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Routers
from app.routes.repositories import router as repositories_router
from app.routes.analyze import router as analyze_router
from app.routes.architecture import router as architecture_router
from app.routes.chat import router as chat_router
from app.routes.docs import router as docs_router
from app.routes.graph import router as graph_router
from app.routes.overview import router as overview_router
from app.routes.auth import router as auth_router

# Jobs
from app.jobs import analysis_job
from app.services.github import github_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup
    """

    print("Starting replore Backend...")

    analysis_job.fail_stale_jobs()
    github_service.cleanup_stale_temp_dirs()

    yield

    """
    Shutdown
    """

    print("Stopping replore Backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Root
# ---------------------------------------------------------


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "replore Backend API",
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
    }


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

app.include_router(
    repositories_router,
    prefix="/api/repositories",
    tags=["Repositories"],
)

app.include_router(analyze_router)
app.include_router(overview_router, tags=["Overview"])

app.include_router(architecture_router, tags=["Architecture"])

app.include_router(graph_router, tags=["Dependency Graph"])

app.include_router(chat_router, tags=["AI Chat"])

app.include_router(docs_router, tags=["Documentation"])
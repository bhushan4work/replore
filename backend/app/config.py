from functools import lru_cache
from pathlib import Path

# pyrefly: ignore [missing-import]
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # -------------------------------------------------
    # App
    # -------------------------------------------------

    APP_NAME: str = "replore Backend"
    APP_ENV: str = "development"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # -------------------------------------------------
    # Supabase
    # -------------------------------------------------

    SUPABASE_URL: str
    SUPABASE_KEY: str

    DATABASE_URL: str

    # -------------------------------------------------
    # Gemini
    # -------------------------------------------------

    GROQ_API_KEY: str
    GEMINI_API_KEY: str

    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # -------------------------------------------------
    # GitHub
    # -------------------------------------------------

    GITHUB_TOKEN: str

    # -------------------------------------------------
    # Clone Hardening
    # -------------------------------------------------
    # git aborts the clone if the transfer stays below the low-speed
    # limit for the given number of seconds.

    CLONE_LOW_SPEED_LIMIT_BPS: int = 1000
    CLONE_LOW_SPEED_TIME_SECONDS: int = 60
    CLONE_RETRY_ATTEMPTS: int = 3

    # -------------------------------------------------
    # Repository Storage
    # -------------------------------------------------

    REPOS_DIR: Path = Field(default=ROOT_DIR / "repositories")

    # -------------------------------------------------
    # Chunking
    # -------------------------------------------------

    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200

    # -------------------------------------------------
    # Embedding
    # -------------------------------------------------
    # Chunks are embedded in batches of EMBED_BATCH_SIZE and each batch
    # is retried EMBED_RETRY_ATTEMPTS times before individual fallback.

    EMBED_BATCH_SIZE: int = 16
    EMBED_RETRY_ATTEMPTS: int = 3
    EMBED_TIMEOUT_SECONDS: int = 60

    # -------------------------------------------------
    # Retrieval & Chat
    # -------------------------------------------------
    # RAG keeps the prompt within practical LLM limits: RAG_TOP_K chunks
    # are retrieved per question, MAX_CONTEXT_CHARS caps the combined
    # context sent to the model, and transient LLM failures are retried
    # LLM_RETRY_ATTEMPTS times.

    RAG_TOP_K: int = 8
    MAX_CONTEXT_CHARS: int = 12000
    LLM_RETRY_ATTEMPTS: int = 3

    CHAT_HISTORY_TURNS: int = 6
    MAX_HISTORY_CHARS: int = 4000

    # -------------------------------------------------
    # Scanning Limits
    # -------------------------------------------------
    # Keeps analysis safe on large repositories. Files/directories
    # that exceed these limits are skipped instead of failing the job.

    MAX_REPOSITORY_SIZE_MB: int = 150
    MAX_FILE_SIZE_KB: int = 512
    MAX_FILE_COUNT: int = 5000
    MAX_GRAPH_NODES: int = 150

    # -------------------------------------------------
    # Frontend
    # -------------------------------------------------

    FRONTEND_URL: str = "http://localhost:3000"

    # -------------------------------------------------
    # Helpers
    # -------------------------------------------------

    @property
    def is_dev(self) -> bool:
        return self.APP_ENV.lower() == "development"

    @property
    def is_prod(self) -> bool:
        return self.APP_ENV.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    settings.REPOS_DIR.mkdir(parents=True, exist_ok=True)

    return settings


settings = get_settings()
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
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
    # Repository Storage
    # -------------------------------------------------

    REPOS_DIR: Path = Field(default=ROOT_DIR / "repositories")

    # -------------------------------------------------
    # Chunking
    # -------------------------------------------------

    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200

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
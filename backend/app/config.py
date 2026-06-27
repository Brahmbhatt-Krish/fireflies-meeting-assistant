from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./fireflies.db"
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        extra="ignore",
    )


settings = Settings()


if settings.DATABASE_URL.startswith("sqlite:///./"):
    db_name = settings.DATABASE_URL.removeprefix("sqlite:///./")
    settings.DATABASE_URL = f"sqlite:///{(BACKEND_DIR / db_name).resolve().as_posix()}"

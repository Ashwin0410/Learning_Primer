"""Application settings, loaded from environment / .env file."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    primer_model: str = "claude-opus-4-8"
    primer_passcode: str = "prakruthi"
    database_url: str = "sqlite:///./primer.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Learner display name — shown across the UI to make it personal.
    learner_name: str = "Prakruthi"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def has_api_key(self) -> bool:
        return bool(self.anthropic_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()

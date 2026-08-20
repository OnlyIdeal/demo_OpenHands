from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:////data/platform.db"
    admin_email: str = "admin@example.com"
    admin_password: str = "admin123"
    admin_name: str = "Platform Admin"
    cookie_name: str = "mvp_session"
    cookie_secure: bool = False
    session_days: int = 7
    mock_llm: bool = True
    agent_mode: str = "mock"
    agent_adapter_url: str = "http://agent-adapter:8010"
    agent_adapter_timeout: float = 10.0
    agent_fallback_mock: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


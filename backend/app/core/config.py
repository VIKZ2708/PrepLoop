from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://preploop:preploop@localhost:5432/preploop"
    ANTHROPIC_API_KEY: str = ""
    SONNET_MODEL: str = "claude-sonnet-4-6"
    HAIKU_MODEL: str = "claude-haiku-4-5-20251001"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    ENV: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

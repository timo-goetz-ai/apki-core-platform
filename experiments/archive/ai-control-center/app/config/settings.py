from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://aios_user:aios_pass@localhost:5432/aios_db"
    redis_url: str = "redis://localhost:6379/0"
    openrouter_api_key: str = ""
    browserless_url: str = "http://localhost:3001"
    browserless_token: str = "local-dev-token"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()

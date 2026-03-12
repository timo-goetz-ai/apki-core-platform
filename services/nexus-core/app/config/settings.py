from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://aios_user:aios_pass@aios-db:5432/aios_db"
    redis_url: str = "redis://aios-redis:6379/0"
    openrouter_api_key: str = ""
    browserless_url: str = "http://aios-browserless:3000"
    browserless_token: str = "local-dev-token"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    n8n_base_url: str = "https://n8n.automation-plus-ki.de"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

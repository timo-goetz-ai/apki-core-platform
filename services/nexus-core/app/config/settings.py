from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://aios_user:aios_pass@aios-db:5432/aios_db"
    redis_url: str = "redis://aios-redis:6379/0"
    anythingllm_url: str = "http://anythingllm:3001"
    anythingllm_api_key: str = ""
    anythingllm_workspace: str = "aios"
    browserless_url: str = "http://aios-browserless:3000"
    browserless_token: str = "local-dev-token"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    n8n_base_url: str = "https://n8n.automation-plus-ki.de"

    # Jarvis / Security
    aios_token: str = ""  # x-aios-token header — set in Coolify
    crew_api_url: str = "http://crew-api:8001"  # internal service URL
    directus_token: str = ""
    directus_url: str = "https://directus.automation-plus-ki.de"
    directus_jarvis_collection: str = "510_tasks"

    # CORS — kommagetrennte Liste; in Coolify als ALLOWED_ORIGINS setzen
    # Fallback: nur eigene Domains; niemals "*" in Produktion
    allowed_origins: str = (
        "https://aios.automation-plus-ki.de,"
        "https://admin.automation-plus-ki.de,"
        "http://localhost:3000,"
        "http://localhost:3001"
    )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

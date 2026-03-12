from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    n8n_api_url: str = ""
    n8n_api_key: str = ""
    nocodb_api_url: str = ""
    nocodb_api_token: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"

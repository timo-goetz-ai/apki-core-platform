from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # n8n
    n8n_api_url: str = ""
    n8n_api_key: str = ""

    # NocoDB
    nocodb_api_url: str = ""
    nocodb_api_token: str = ""
    nocodb_content_pieces_table_id: str = ""

    # LLM Provider Keys
    openrouter_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"

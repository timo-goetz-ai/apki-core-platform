from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"

    # n8n
    n8n_api_url: str = ""
    n8n_api_key: str = ""

    # Directus
    directus_url: str = ""
    directus_token: str = ""
    directus_content_collection: str = "400_content_pipeline"

    # LLM Provider
    anythingllm_url: str = "http://anythingllm:3001"
    anythingllm_api_key: str = ""
    anythingllm_workspace: str = "aios"
    anthropic_api_key: str = ""
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"

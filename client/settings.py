from pydantic_settings import BaseSettings, SettingsConfigDict

from constants import LLMProvider


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_nested_delimiter="__",
    )


    provider: LLMProvider | None = None
    model_name: str | None = None
    temperature: float | None = None
    api_key: str | None = None
    base_url: str | None = None
    max_tokens: int | None = None
    timeout: int | None = None

    def to_litellm_model_name(self) -> str:
        """
        Converts provider and model to LiteLLM's expected format.

        LiteLLM uses format: "provider/model" (e.g., "ollama/llama2", "gpt-4")
        """
        if self.provider == LLMProvider.OLLAMA:
            return f"ollama/{self.model_name}"
        elif self.provider == LLMProvider.OPENAI:
            return self.model_name  # OpenAI models don't need prefix
        elif self.provider == LLMProvider.ANTHROPIC:
            return self.model_name  # Anthropic models don't need prefix
        return self.model_name
"""
The goal of LiteLLM was to use Ollama, but silly models run infinite loop of tool calls
"""

import litellm
from litellm import acompletion
from settings import LLMSettings

class LiteLLMClient:
    def __init__(self, settings: LLMSettings):
        self.settings = settings

        # Suppress litellm's verbose logging if desired
        litellm.suppress_debug_info = True

        # Set OpenAI key if provided
        if settings.api_key:
            litellm.openai_key = settings.api_key

    async def complete(self, messages: list[dict], tools: list[dict] | None = None):
        """
        Call the LLM via LiteLLM.
        Tools are passed in MCP/Anthropic format (with 'input_schema') and
        converted here to the OpenAI function-calling format LiteLLM expects.
        """
        kwargs = {
            "model": self.settings.to_litellm_model_name(),
            "messages": messages,
        }

        if self.settings.base_url:
            kwargs["api_base"] = self.settings.base_url

        if tools:
            kwargs["tools"] = self._convert_tools(tools)
            kwargs["tool_choice"] = "auto"

        response = await acompletion(**kwargs)
        return response

    @staticmethod
    def _convert_tools(tools: list[dict]) -> list[dict]:
        """
        Convert MCP tool format to OpenAI tool format expected by LiteLLM.

        MCP format:
          { "name": ..., "description": ..., "input_schema": { "type": "object", ... } }

        OpenAI format:
          { "type": "function", "function": { "name": ..., "description": ..., "parameters": {...} } }
        """
        converted = []
        for tool in tools:
            converted.append({
                "type": "function",
                "function": {
                    "name": tool["name"],
                    "description": tool.get("description", ""),
                    "parameters": tool.get("input_schema", {"type": "object", "properties": {}}),
                }
            })
        return converted
import json
from typing import Any, cast, Self

import pydantic
import tenacity
from google import genai

from app.ports.llm import AbstractLLM, TGeneric


class GeminiAdapter(AbstractLLM):
    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key
        self._model_name = model_name
        self._client = None

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def provider(self) -> str:
        return "google"

    async def __aenter__(self) -> Self:
        self._client = genai.Client(api_key=self.api_key).aio
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self._client = None

    async def run_simple_completion(
        self,
        system_prompt: str,
        dto_class: type[TGeneric],
        data: dict[str, str] | None = None,
    ) -> TGeneric:
        formatted = system_prompt.format(**(data or {}))
        result = await self._call_with_retry(
            client=self._client,
            prompt=formatted,
            dto_class=dto_class,
            model_name=self._model_name,
        )
        return cast(TGeneric, result)

    @staticmethod
    @tenacity.retry(
        wait=tenacity.wait_exponential(multiplier=1, min=2, max=10),
        stop=tenacity.stop_after_attempt(3),
        retry=tenacity.retry_if_exception_type(Exception),
        before_sleep=lambda retry_state: None,
    )
    async def _call_with_retry(
        client: Any,
        prompt: str,
        dto_class: type[TGeneric],
        model_name: str,
    ) -> TGeneric:
        try:
            response = await client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": dto_class,
                    "automatic_function_calling": {"disable": True},
                    "thinking_config": {"thinking_budget": 400},
                },
            )
            return dto_class.model_validate_json(response.text)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Gemini returned invalid JSON: {e}") from e
        except pydantic.ValidationError as e:
            raise RuntimeError(f"Gemini response failed schema validation: {e}") from e

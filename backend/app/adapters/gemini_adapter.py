import json
import logging
from typing import Any, cast, Self

import pydantic
import tenacity
from google import genai

from app.ports.llm import AbstractLLM, TGeneric

logger = logging.getLogger(__name__)


def _clean_schema_for_gemini(schema: Any) -> Any:
    """Remove unsupported fields from Pydantic schema for Gemini API."""
    if isinstance(schema, dict):
        # Create a new dict without additionalProperties
        cleaned = {}
        for key, value in schema.items():
            if key == "additionalProperties":
                continue
            # Recursively clean nested values
            if isinstance(value, dict):
                cleaned[key] = _clean_schema_for_gemini(value)
            elif isinstance(value, list):
                cleaned[key] = [_clean_schema_for_gemini(item) for item in value]
            else:
                cleaned[key] = value
        return cleaned
    elif isinstance(schema, list):
        return [_clean_schema_for_gemini(item) for item in schema]
    else:
        return schema


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
            # Get Pydantic schema and clean it for Gemini
            schema = dto_class.model_json_schema()
            logger.debug("Original schema: %s", json.dumps(schema, indent=2))
            cleaned_schema = _clean_schema_for_gemini(schema)
            logger.debug("Cleaned schema: %s", json.dumps(cleaned_schema, indent=2))
            
            response = await client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": cleaned_schema,
                },
            )
            return dto_class.model_validate_json(response.text)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Gemini returned invalid JSON: {e}") from e
        except pydantic.ValidationError as e:
            raise RuntimeError(f"Gemini response failed schema validation: {e}") from e

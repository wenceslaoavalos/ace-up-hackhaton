import abc
from typing import Generic, Self, TypeVar

import pydantic

TGeneric = TypeVar("TGeneric", bound=pydantic.BaseModel)


class AbstractLLM(abc.ABC, Generic[TGeneric]):
    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        raise NotImplementedError

    @property
    @abc.abstractmethod
    def provider(self) -> str:
        raise NotImplementedError

    @abc.abstractmethod
    async def run_simple_completion(
        self,
        system_prompt: str,
        dto_class: type[TGeneric],
        data: dict[str, str] | None = None,
    ) -> TGeneric:
        raise NotImplementedError

    @abc.abstractmethod
    async def __aenter__(self) -> Self:
        raise NotImplementedError

    @abc.abstractmethod
    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: object,
    ) -> None:
        raise NotImplementedError

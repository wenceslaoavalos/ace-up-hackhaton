import os

# Set test env vars before any app imports so the DB URL and API key are available
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app, get_llm
from app.ports.llm import AbstractLLM
from tests.test_data import MOCK_LLM_RESPONSE

TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def test_engine():
    _engine = create_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=_engine)
    yield _engine
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture(scope="function")
def test_db(test_engine):
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


class MockLLMAdapter(AbstractLLM):
    """Returns MOCK_LLM_RESPONSE for any input — no real LLM calls made."""

    @property
    def model_name(self) -> str:
        return "mock-model"

    @property
    def provider(self) -> str:
        return "mock"

    async def run_simple_completion(self, system_prompt, dto_class, data=None):
        return dto_class(**MOCK_LLM_RESPONSE)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


@pytest.fixture(scope="function")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    def override_get_llm():
        return MockLLMAdapter()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_llm] = override_get_llm
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

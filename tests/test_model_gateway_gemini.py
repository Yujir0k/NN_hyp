import asyncio
import json
from pathlib import Path

import pytest

from app import main


class FakeResponse:
    def __init__(self, body: dict) -> None:
        self._body = body
        self.status_code = 200
        self.text = json.dumps(body)

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._body


class FakeAsyncClient:
    def __init__(self, body: dict, calls: list[dict], **_: object) -> None:
        self.body = body
        self.calls = calls

    async def __aenter__(self) -> "FakeAsyncClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def post(self, url: str, **kwargs: object) -> FakeResponse:
        self.calls.append({'url': url, **kwargs})
        return FakeResponse(self.body)


@pytest.fixture
def gemini_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv('NORLAB_LLM_PROVIDER', 'gemini')
    monkeypatch.setenv('GEMINI_API_KEY', 'test-key')
    monkeypatch.setenv('NORLAB_GENERATOR_MODEL', 'gemini-2.5-flash')
    monkeypatch.setenv('NORLAB_FAST_MODEL', 'gemini-2.5-flash-lite')
    monkeypatch.setenv('NORLAB_CRITIC_MODEL', 'gemini-2.5-pro')
    monkeypatch.setenv('NORLAB_VISION_MODEL', 'gemini-2.5-flash')
    monkeypatch.setenv('NORLAB_EMBEDDING_MODEL', 'gemini-embedding-001')
    monkeypatch.setenv('NORLAB_EMBEDDING_DIMENSIONS', '768')
    monkeypatch.setattr(main.store, 'save', lambda: None)
    main.store.data.setdefault('audit', [])
    audit_size = len(main.store.data['audit'])
    yield
    del main.store.data['audit'][audit_size:]


def test_gemini_embedding_uses_embed_content_contract(
    monkeypatch: pytest.MonkeyPatch,
    gemini_env: None,
) -> None:
    calls: list[dict] = []
    body = {'embedding': {'values': [0.25, -0.5, 0.75]}}
    monkeypatch.setattr(main.httpx, 'AsyncClient', lambda **kwargs: FakeAsyncClient(body, calls, **kwargs))

    result = asyncio.run(main.ModelGateway().embed_text('отвальные хвосты', is_document=False))

    assert result['embedding'] == [0.25, -0.5, 0.75]
    assert result['model_version'] == 'gemini-embedding-001'
    assert calls[0]['url'].endswith('/models/gemini-embedding-001:embedContent')
    assert calls[0]['headers']['x-goog-api-key'] == 'test-key'
    assert calls[0]['json']['taskType'] == 'RETRIEVAL_QUERY'
    assert calls[0]['json']['outputDimensionality'] == 768
    assert main.store.data['audit'][-1]['kind'] == 'embedding_call'


def test_gemini_vision_sends_inline_image_and_parses_json(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    gemini_env: None,
) -> None:
    image_path = tmp_path / 'scheme.png'
    image_path.write_bytes(b'png-test-bytes')
    calls: list[dict] = []
    body = {
        'candidates': [{
            'content': {
                'parts': [{'text': '{"nodes":[{"label":"Флотация"}],"edges":[]}'}],
            },
        }],
    }
    monkeypatch.setattr(main.httpx, 'AsyncClient', lambda **kwargs: FakeAsyncClient(body, calls, **kwargs))

    result = asyncio.run(main.ModelGateway().vision_json(image_path, 'Извлеки схему'))

    assert result['nodes'][0]['label'] == 'Флотация'
    assert calls[0]['url'].endswith('/models/gemini-2.5-flash:generateContent')
    assert calls[0]['headers']['x-goog-api-key'] == 'test-key'
    parts = calls[0]['json']['contents'][0]['parts']
    assert parts[0]['inlineData']['mimeType'] == 'image/png'
    assert parts[1]['text'] == 'Извлеки схему'
    assert calls[0]['json']['generationConfig']['responseMimeType'] == 'application/json'
    assert main.store.data['audit'][-1]['role'] == 'vision'


def test_gemini_profile_does_not_expose_yandex_models(
    gemini_env: None,
) -> None:
    profile = main.ModelGateway().profile()

    assert profile['provider'] == 'gemini'
    assert profile['vision'] == 'gemini-2.5-flash'
    assert profile['embeddings'] == 'gemini-embedding-001'
    assert {'vision_json', 'embeddings'}.issubset(profile['capabilities'])

# NORLAB backend runbook

> Current provider setup and verified real-LLM checks: [GEMINI_INTEGRATION.md](GEMINI_INTEGRATION.md). The Yandex section below is retained only as a legacy rollback option.

## Локальный запуск

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

OpenAPI доступен по адресу `http://127.0.0.1:8000/docs`.

## Smoke-test без UI

```powershell
python scripts/smoke_test.py
```

Скрипт создаёт проект, импортирует первые файлы из `data/organizer_raw`, запускает pipeline и печатает идентификаторы артефактов.

## Yandex AI Studio

Секреты не хардкодятся. Для реального LLM-вызова создай `.env.local`:

```dotenv
YANDEX_API_KEY=...
YANDEX_FOLDER_ID=...
NORLAB_LLM_MODE=real
```

`YANDEX_AI_BASE_URL` по умолчанию настроен как OpenAI-compatible endpoint `https://llm.api.cloud.yandex.net/v1`, но его можно заменить без изменения кода.

## Повтор этапа

```http
POST /runs/{run_id}/retry-stage?stage=GENERATING
```

## Очистка dev-состояния

Останови сервер и удали `data/state/state.json` и файлы нужного проекта в `data/storage`.

# NORLAB handoff for the next agent

> Current provider update (2026-07-04): Yandex API access is restored and the active profile is `deepseek-v4-flash` for generation, `gpt-oss-120b` for repair/critique, `qwen3.6-35b-a3b` for images, and `yandex-embeddings` for memory. Use `.env.example` and `docs/YANDEX_INTEGRATION.md`. The older Gemini notes below are retained only as provider history/fallback documentation.

Дата: 2026-07-04.

## Что уже сделано

- Фронтенд и бекенд соединены через реальные API, без UI-заглушек для основного продукта.
- Бекенд умеет работать с несколькими LLM-провайдерами через `NORLAB_LLM_PROVIDER`:
  - `yandex` оставлен для возврата к Яндекс Cloud.
  - `openmodel` оставлен для возврата к OpenModel.
  - `gemini` добавлен сейчас.
- Для Gemini распределение моделей такое:
  - `NORLAB_GENERATOR_MODEL=gemini-2.5-flash` для генерации гипотез.
  - `NORLAB_FAST_MODEL=gemini-2.5-flash-lite` для compatibility-check и repair JSON/гипотез.
  - `NORLAB_CRITIC_MODEL=gemini-2.5-pro` для критики и оценки финалистов.
- В `ModelGateway` добавлена поддержка Gemini `generateContent` и извлечение JSON из `candidates[].content.parts[].text`.
- Yandex-подключение не удалено: для возврата достаточно переключить `NORLAB_LLM_PROVIDER=yandex` и вернуть Yandex-модели.
- Бекенд делает audit LLM-вызовов, включая `latency_ms` для успешных и ошибочных вызовов.

## Важный текущий блокер

На этой машине прямой запрос к Gemini API дошел до Google, но вернул:

```text
400 FAILED_PRECONDITION: User location is not supported for the API use.
```

Через бекенд compatibility-test тоже не прошел: `passed=false`, реальный вызов не получен, сработал fallback после ошибки соединения/регионального отказа. Это не нужно обходить заглушками. Нужно запускать на машине/сети/аккаунте, где Gemini API доступен.

## Как поднять на другой машине

Требования:

- Python 3.11+.
- Node.js 20+.
- npm или pnpm. В проекте сейчас есть `package-lock.json`, поэтому ниже команды через npm.
- Доступ к Gemini API из текущей локации/аккаунта.

1. Распаковать архив.

2. Создать env для бекенда:

```powershell
Copy-Item .env.example .env.local
```

3. В `.env.local` выставить Gemini:

```env
NORLAB_LLM_PROVIDER=gemini
GEMINI_API_KEY=<вставить ключ>
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
NORLAB_GENERATOR_MODEL=gemini-2.5-flash
NORLAB_FAST_MODEL=gemini-2.5-flash-lite
NORLAB_CRITIC_MODEL=gemini-2.5-pro
NORLAB_LLM_MODE=real
NORLAB_STRICT_LLM=true
NORLAB_TASK_BACKEND=background
NORLAB_CHAT_ATTEMPTS=1
NORLAB_CHAT_REQUEST_TIMEOUT_SECONDS=90
```

Если нужно вернуться на Яндекс, оставить ключи `YANDEX_API_KEY`, `YANDEX_FOLDER_ID` и заменить:

```env
NORLAB_LLM_PROVIDER=yandex
NORLAB_GENERATOR_MODEL=deepseek-v4-flash
NORLAB_CRITIC_MODEL=gpt-oss-120b
```

4. Поставить Python-зависимости:

```powershell
python -m pip install -e .
```

5. Запустить бекенд:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

6. В другом терминале поставить фронтенд:

```powershell
cd frontend
npm ci
```

7. Запустить фронтенд:

```powershell
npm run dev -- --host 127.0.0.1 --port 4173
```

Открыть:

```text
http://127.0.0.1:4173
```

## Проверки

Бекенд:

```powershell
python -m pytest
```

Фронтенд:

```powershell
cd frontend
npm run lint
npm test -- --run
npm run build
```

E2E без LLM, проверяет рабочий UI/API-пайплайн:

```powershell
cd frontend
npx playwright test --project=chromium --project=mobile --workers=1
```

E2E с реальным LLM:

```powershell
cd frontend
$env:NORLAB_E2E_USE_LLM='true'
npx playwright test --project=chromium --workers=1
```

Compatibility-test LLM и замер времени одного запроса:

```powershell
python - <<'PY'
import httpx, time, json
started = time.perf_counter()
r = httpx.post('http://127.0.0.1:8000/admin/model-profiles/compatibility-test', timeout=130)
print(json.dumps({
  'status_code': r.status_code,
  'elapsed_ms': round((time.perf_counter() - started) * 1000),
  'body': r.json(),
}, ensure_ascii=False, indent=2))
PY
```

Последняя audit-запись LLM:

```powershell
python - <<'PY'
import json
from pathlib import Path
state = json.loads(Path('data/state/state.json').read_text(encoding='utf-8'))
for item in reversed(state.get('audit', [])):
    if item.get('kind', '').startswith('llm_call'):
        print(json.dumps(item, ensure_ascii=False, indent=2))
        break
PY
```

## Что было проверено на текущей машине

- `python -m py_compile app/main.py` - passed.
- `python -m pytest` - 3 passed.
- `cd frontend && npm run lint` - passed.
- `cd frontend && npm test -- --run` - 1 passed.
- Прямой Gemini-запрос: не прошел из-за `User location is not supported for the API use`.
- Backend Gemini compatibility-test: не прошел, потому что реальный LLM-вызов недоступен из текущей локации.

## Что доделать на машине с доступным Gemini

1. Запустить `compatibility-test` и убедиться, что `passed=true`, `real_call=true`.
2. Запустить LLM E2E и проверить, что run доходит до `COMPLETED`, а гипотезы имеют evidence/source trace.
3. Замерить:
   - latency одного `compatibility-test`;
   - время полного запроса гипотезы: от `POST /projects/{id}/runs` с `use_llm=true` до статуса `COMPLETED`.
4. Если Gemini возвращает валидный JSON, но гипотезы не проходят строгий валидатор, смотреть `run.llm_generation_summary.rejections` и audit `llm_call`.
5. Не добавлять deterministic/stub fallback вместо LLM-гипотез. Если LLM не дал валидные grounded hypotheses, run должен честно падать.

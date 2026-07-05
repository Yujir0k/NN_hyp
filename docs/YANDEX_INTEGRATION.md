# Yandex AI integration

Active provider profile on 2026-07-04:

```env
NORLAB_LLM_PROVIDER=yandex
NORLAB_GENERATOR_MODEL=deepseek-v4-flash
NORLAB_FAST_MODEL=gpt-oss-120b
NORLAB_CRITIC_MODEL=gpt-oss-120b
NORLAB_VISION_MODEL=qwen3.6-35b-a3b
NORLAB_EMBEDDING_MODEL=yandex-embeddings
NORLAB_EMBEDDING_DIMENSIONS=256
```

Responsibilities:

- DeepSeek generates grounded hypothesis candidates in small batches.
- GPT OSS repairs malformed JSON, fills a grounded candidate deficit, critiques and ranks finalists.
- Qwen analyzes uploaded equipment diagrams and other images.
- Yandex embeddings index project facts for memory search.

All generated hypotheses pass the same evidence, numeric-claim and project-constraint validator. GPT OSS refill is a real LLM call over the same evidence pack; it is not a deterministic or stub fallback. A run still fails when the real models cannot produce the configured minimum of grounded candidates.

The local secret belongs in `.env.local`. Never put API keys in this file or commit them.

## Quality contract

Each accepted hypothesis must include a short card title, a complete testable statement, a physical/chemical mechanism, source ids, assumptions, risks, falsification criteria, expected KPI and economic-effect reasoning. Exact money, ROI or payback may be shown only when the uploaded data contains the required throughput, material balance, prices and cost inputs; otherwise the result states the economic drivers without inventing numbers.

## Verification

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then call `POST /admin/model-profiles/compatibility-test`. A healthy real profile returns `passed=true` and `checks.real_call=true`.


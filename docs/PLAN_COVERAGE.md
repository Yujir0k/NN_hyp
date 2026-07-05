# NORLAB plan coverage

> Provider update (2026-07-04): the active production profile is Yandex AI with DeepSeek generation, GPT OSS repair/critique, Qwen vision and Yandex embeddings. See [YANDEX_INTEGRATION.md](YANDEX_INTEGRATION.md). Gemini remains an optional provider, not the active profile.

## Full profile реализован и проверен

- FastAPI, OpenAPI, health checks.
- PostgreSQL runtime state через `NORLAB_STORAGE_BACKEND=postgres`.
- Нормализованные PostgreSQL таблицы для projects, documents, runs, hypotheses, experiments, sources, audit_log.
- Neo4j graph writes для Project, Document, Fragment, Fact и отношений `HAS_DOCUMENT`, `HAS_FRAGMENT`, `EXTRACTED_FROM`.
- Neo4j graph writes для Hypothesis/Experiment и отношений `HAS_HYPOTHESIS`, `SUPPORTS`, `TESTS`.
- Neo4j graph read endpoint `GET /projects/{id}/graph/subgraph`.
- Yandex Embeddings REST API и Neo4j embedding properties для Fragment/Fact/Hypothesis.
- Vector search endpoint `GET /projects/{id}/memory/vector-search`.
- Reindex endpoint `POST /projects/{id}/memory/reindex`.
- MinIO/S3 object storage через `NORLAB_OBJECT_STORAGE=s3`.
- Redis event/status layer.
- Celery worker для pipeline задач через `NORLAB_TASK_BACKEND=celery`.
- Docker Compose для PostgreSQL, Neo4j, Redis, MinIO.
- `scripts/start_full.ps1` для полного запуска инфраструктуры, worker и API.
- `scripts/manual_full_test.ps1` для end-to-end проверки full profile.
- Создание/изменение проектов.
- Загрузка и локальный импорт PDF, DOCX, XLSX, PNG/JPEG, TXT/MD/CSV/JSON.
- Deterministic parsing: PDF через `pypdf`, DOCX через OOXML, XLSX через `openpyxl`.
- Сохранение fragments, facts, provenance, document hashes.
- Data-quality detection для Excel-ошибок вроде `#REF!`/`#N/A`.
- Memory search по извлечённым фактам.
- Реальный Yandex AI Studio gateway через OpenAI-compatible Responses API.
- Модельные URI вида `gpt://<folder_id>/<model>`.
- LLM generation через `deepseek-v4-flash` с JSON-контрактом и backend validation evidence IDs.
- LLM critique через `gpt-oss-120b`.
- External research через OpenAlex и Crossref metadata APIs.
- Patent research через PatentsView API.
- Search query sanitization перед внешним поиском.
- Vision-разбор изображений через Qwen vision model и endpoint `POST /documents/{id}/vision-analyze`.
- RBAC через `X-User-Id` / `X-User-Role`, owner/members и write checks.
- Pipeline states, events, retry/cancel endpoints.
- Clarification records и answer/resume endpoints.
- Deduplication, hard gates, Novelty Radar, Disagreement Map, Uncertainty Navigator.
- Experiment compiler и result/attachment endpoints.
- Feedback writeback на гипотезы.
- Projection/BFF endpoints для workspace/research/hypotheses/experiments/inspectors.
- JSON/Markdown/DOCX/PDF exports.
- Unit, smoke и full-profile manual tests.
- Golden evaluation runner `scripts/golden_eval.py`.
- Multilingual evaluation runner `scripts/multilingual_eval.py` и API `POST /admin/eval/multilingual`.

## Реализовано базово, но ещё требует усиления для production-grade

- Neo4j native vector index DDL можно усилить под конкретную размерность embedding-модели; текущий поиск работает по embedding property и cosine similarity в Cypher.
- Vision graph extraction зависит от поддержки multimodal input выбранной Qwen модели в Yandex Responses API; ошибки сохраняются в `vision_errors`.
- Patent search использует PatentsView; WIPO/PATENTSCOPE можно добавить вторым connector при наличии ключей/условий API.
- RBAC покрывает API-level owner/member/write checks; production SSO/OIDC и policy engine не подключались, потому что не были заданы провайдеры.
- Golden eval считает semantic token coverage как автоматический baseline; экспертные метрики можно расширять без изменения pipeline.
- Multilingual eval проверяет RU/EN/ZH JSON generation; отдельные benchmark-наборы retrieval направлений можно расширять данными.
- DOCX/PDF экспорт валиден и скачивается, но верстка пока техническая, не дизайнерская.

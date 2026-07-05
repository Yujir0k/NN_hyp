# NORLAB — контракт и порядок подключения backend

Этот файл предназначен для backend-разработчика и следующего Codex-агента. UI уже готов; задача интеграции — заменить локальные projection-данные на API, сохранив текущую визуальную структуру.

## 1. Базовые соглашения

- Base URL в production: `/api` на том же origin.
- Base URL задаётся через `VITE_API_URL`.
- В dev `.env.local` может содержать `VITE_DEV_API_TARGET=http://127.0.0.1:8000`; Vite проксирует `/api`.
- JSON transport использует `snake_case`.
- Идентификаторы — стабильные строки, не порядковые номера массива.
- Время — ISO 8601 UTC; форматирование выполняет frontend.
- Длительность — секунды или дни числом, не локализованной строкой.
- Проценты — числа `0..100`.
- Оценки — числа `1..5`; integral rating — `0..100`.
- Локализованный UI остаётся на frontend. Backend возвращает научный контент на языке запроса/проекта.
- Язык передавать заголовком `Accept-Language: ru|en|zh-CN` после подключения interceptor.

Типы transport уже описаны в `src/shared/api/contracts.ts`, методы — в `src/shared/api/client.ts`.

## 2. Общий metadata-блок

Основные projection-ответы содержат:

```json
{
  "id": "kgmk-tailings",
  "version": 7,
  "updated_at": "2026-07-04T09:20:00Z",
  "capabilities": ["file_preview", "run_stream", "report_export"],
  "warnings": ["missing_pgm_repeat_assay"],
  "partial": false
}
```

`version` нужен для cache invalidation/optimistic update. `partial=true` означает: данные можно показать, но часть внешних источников недоступна. Не превращать partial в общий error screen.

## 3. Ошибки

Рекомендуемый envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некоторые поля требуют уточнения",
    "request_id": "req_01J...",
    "retryable": false,
    "fields": {
      "constraints": "Поле не должно быть пустым"
    }
  }
}
```

Минимальная обработка frontend:

| HTTP | Поведение |
|---|---|
| 400/422 | показать ошибки рядом с полями |
| 401 | перевести в будущий auth flow, route не терять |
| 403 | disabled/read-only состояние |
| 404 | понятный empty state и ссылка назад |
| 409 | обновить projection; показать конфликт версии |
| 413 | сообщить лимит файла |
| 429 | сохранить run UI и показать retry ETA |
| 5xx | error state + retry, не очищать последние данные |

## 4. Endpoint matrix

### Projects и brief

| Method | Path | UI consumer | Назначение |
|---|---|---|---|
| GET | `/api/projects` | ProjectsPage, AppShell | список проектов |
| POST | `/api/projects` | create-project wizard | multipart: task, result, area, success, constraints, files[] |
| GET | `/api/projects/{projectId}` | Workspace header | агрегат проекта и brief |
| PUT | `/api/projects/{projectId}/brief` | brief modal | сохранить проблему, цель и ограничения |
| GET | `/api/projects/{projectId}/warnings` | workspace next step | актуальные предупреждения |

Пример проекта:

```json
{
  "id": "kgmk-tailings",
  "version": 7,
  "updated_at": "2026-07-04T09:20:00Z",
  "capabilities": ["file_preview", "run_stream"],
  "warnings": ["missing_pgm_repeat_assay"],
  "partial": false,
  "name": "Извлечение металлов из хвостов КГМК",
  "focus": "Отвальные хвосты · Ni/Cu/PGM",
  "readiness": 82,
  "indexed_files": 14,
  "memory_matches": 6,
  "brief": {
    "problem": "Низкое извлечение Ni, Cu и PGM...",
    "goal": "Сформировать проверяемые гипотезы...",
    "constraints": "Допустим рост энергозатрат не более 10%...",
    "success_criterion": "Прирост извлечения не менее 2 п.п.",
    "domain": "tailings_and_metallurgy"
  }
}
```

### Файлы

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/projects/{projectId}/files` | список файлов и статусов |
| POST | `/api/projects/{projectId}/files` | multipart upload `files[]` |
| GET | `/api/files/{fileId}` | metadata конкретного файла |
| GET | `/api/files/{fileId}/content` | оригинальные bytes, Range support |
| GET | `/api/files/{fileId}/preview?page=3` | preview или извлечённый контент |
| GET | `/api/files/{fileId}/processing` | расширенный parsing status при необходимости |

Lifecycle: `uploaded → parsing → ready | warning | failed`.

Backend preview policy:

- PDF: `application/pdf`, желательно Range requests;
- image: исходный image или безопасная preview-копия;
- XLSX/CSV: JSON-table `{columns, rows, truncated}` либо оригинал для client parser;
- DOCX: безопасный HTML/text projection либо оригинал для mammoth;
- неизвестный binary: `preview_capability=download_only`.

Нельзя декодировать DOCX как обычный текст: это ZIP-контейнер и он даст бинарный мусор.

Пример metadata:

```json
{
  "id": "file-tailings-pdf",
  "project_id": "kgmk-tailings",
  "name": "Хвосты_КГМК_характеристика.pdf",
  "mime_type": "application/pdf",
  "kind": "pdf",
  "size_bytes": 2516582,
  "status": "ready",
  "pages": 5,
  "language": "ru",
  "preview_capability": "native",
  "download_url": "/api/files/file-tailings-pdf/content",
  "preview_url": "/api/files/file-tailings-pdf/preview",
  "version": 3,
  "updated_at": "2026-07-04T08:50:00Z",
  "capabilities": ["download", "preview"],
  "warnings": [],
  "partial": false
}
```

### Граф знаний

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/projects/{projectId}/knowledge-graph` | все nodes/edges текущей evidence projection |

Обязательные node types: `source`, `fact`, `hypothesis`, `experiment`, `risk`.

Обязательные edge relations: `extracted_from`, `recognised_from`, `supports`, `makes_feasible`, `validated_by`, `limited_by`.

Каждое ребро содержит человекочитаемый `reason`, иначе граф теряет смысл для исследователя.

### Research run

| Method | Path | Назначение |
|---|---|---|
| POST | `/api/projects/{projectId}/runs` | начать новый прогон |
| GET | `/api/projects/{projectId}/runs/{runId}` | восстановить state после F5/reconnect |
| GET | `/api/projects/{projectId}/runs/{runId}/events` | SSE stream |
| POST | `/api/projects/{projectId}/runs/{runId}/pause` | пауза |
| POST | `/api/projects/{projectId}/runs/{runId}/resume` | продолжить |
| POST | `/api/projects/{projectId}/runs/{runId}/recover` | восстановить с checkpoint |
| POST | `/api/projects/{projectId}/runs/{runId}/clarifications/{clarificationId}` | ответ + comment |
| PUT | `/api/projects/{projectId}/ranking-profile` | веса и текстовые ограничения |

Пример run projection:

```json
{
  "id": "run-2026-07-04-01",
  "project_id": "kgmk-tailings",
  "status": "waiting_for_input",
  "stage": "gates",
  "started_at": "2026-07-04T09:13:20Z",
  "elapsed_seconds": 400,
  "eta_seconds": 130,
  "funnel": {
    "generated": 32,
    "unique": 24,
    "gates": 12,
    "critique": 6,
    "finalists": 3
  },
  "events": [],
  "clarification": {
    "id": "clar-energy-limit",
    "title": "Лимит энергозатрат?",
    "question": "Какой рост энергозатрат считать допустимым?",
    "blocking": true,
    "answer": null,
    "comment": null
  },
  "ranking_profile": {
    "novelty": 30,
    "feasibility": 25,
    "physicochemical_mechanism": 30,
    "low_risk": 15,
    "excluded_directions": "",
    "domain_constraints": "Допустим рост энергозатрат не более 10%."
  },
  "version": 12,
  "updated_at": "2026-07-04T09:20:00Z",
  "capabilities": ["pause", "resume", "recover"],
  "warnings": [],
  "partial": false
}
```

SSE event:

```text
event: run.updated
id: 184
data: {"run_id":"run-2026-07-04-01","version":13,"stage":"critique","status":"running","eta_seconds":75}
```

Frontend strategy: SSE только инвалидирует/патчит query cache. GET run остаётся источником истины.

### Гипотезы

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/projects/{projectId}/hypotheses?sort=rating&risk=&novelty=&status=` | карточки и сравнение |
| POST | `/api/projects/{projectId}/hypotheses` | экспертная гипотеза |
| GET | `/api/projects/{projectId}/hypotheses/{hypothesisId}` | полная центральная карточка |
| POST | `/api/projects/{projectId}/hypotheses/{hypothesisId}/feedback` | verdict/reason/comment |

Evidence обязательно содержит точную ссылку на источник:

```json
{
  "id": "ev-h12-1",
  "source_file_id": "file-tailings-pdf",
  "file_name": "Хвосты_КГМК_характеристика.pdf",
  "page": 3,
  "paragraph": 2,
  "quote": "Основная доля никеля и меди связана...",
  "claim": "Доизмельчение повышает раскрытие тонковкраплённых сульфидов.",
  "strength": "strong"
}
```

Формулу integral rating считать на backend из сохранённого ranking profile и вернуть составляющие. Frontend может пересчитать для instant preview, но server value является итоговым.

### Эксперименты и экспорт

| Method | Path | Назначение |
|---|---|---|
| GET | `/api/projects/{projectId}/experiments` | список, roadmap и revisions |
| POST | `/api/projects/{projectId}/experiments` | создать из `hypothesis_id` |
| PATCH | `/api/projects/{projectId}/experiments/{experimentId}` | сохранить новую revision |
| POST | `/api/projects/{projectId}/experiments/{experimentId}/results` | multipart result file |
| POST | `/api/projects/{projectId}/experiments/{experimentId}/compile` | собрать protocol projection |
| POST | `/api/projects/{projectId}/exports` | создать export job |
| GET | `/api/exports/{jobId}` | progress и download URL |

Roadmap node:

```json
{
  "id": "R3",
  "title": "Флотационный тест Ni/Cu",
  "duration_days": 4,
  "depends_on": ["R2"],
  "critical": true,
  "status": "active"
}
```

Export — асинхронный job, потому что PDF/DOCX и сбор исходников могут занять время. UI уже умеет показывать readiness и отсутствующие поля.

## 5. React Query keys

Рекомендуемые keys:

```ts
['projects', locale]
['project', projectId, locale]
['project-files', projectId]
['knowledge-graph', projectId, locale]
['run', projectId, runId, locale]
['ranking-profile', projectId]
['hypotheses', projectId, locale, filters]
['hypothesis', projectId, hypothesisId, locale]
['experiments', projectId, locale]
['export-job', jobId]
```

Не использовать один общий key `['data']`: при переключении проектов это покажет данные предыдущего проекта.

## 6. Порядок подключения без большого рискованного rewrite

1. Добавить `QueryClientProvider` в `src/main.tsx`.
2. Подключить GET `/projects`; оставить mock fallback только на error в dev.
3. Подключить create project multipart и использовать server `id`.
4. Подключить project/brief/files/warnings.
5. Подключить file metadata/content/preview.
6. Подключить graph projection.
7. Подключить start/get run; затем SSE, pause/recover и clarification.
8. Подключить ranking profile.
9. Подключить список и detail гипотез, затем feedback/evidence.
10. Подключить experiments, revisions и result upload.
11. Подключить export jobs.
12. После прохождения e2e удалить соответствующие inline mocks.

На каждом шаге сохранять URL state и текущие модальные компоненты.

## 7. Файлы, которые меняются первыми

| Файл | Изменение |
|---|---|
| `src/main.tsx` | `QueryClientProvider`, общий error boundary |
| `src/features/projects/ProjectsPage.tsx` | `useQuery(api.projects)`, `useMutation(api.createProject)` |
| `src/features/workspace/WorkspacePage.tsx` | project/files/warnings/graph queries |
| `src/features/research/ResearchPage.tsx` | run query + SSE + mutations |
| `src/features/hypotheses/HypothesesPage.tsx` | list/detail/filter/feedback queries |
| `src/features/experiments/ExperimentsPage.tsx` | experiments/revisions/results/export queries |

Не переносить сетевую логику в UI-компоненты глубже необходимого. API вызовы остаются в `shared/api`, mapping DTO → view model — рядом с feature.

## 8. Docker production topology

Рекомендуемая схема:

```text
Browser → nginx frontend :80
              ├─ /          → SPA files
              └─ /api/      → backend:8000
                                 ├─ database
                                 ├─ object storage
                                 └─ queue/workers/LLM
```

Готовый пример compose и nginx находятся в корне handoff-пакета:

- `docker-compose.integration.example.yml`;
- `frontend/nginx.backend.conf.example`.

В контуре организаторов secrets передавать env/secrets механикой, не собирать их в Vite bundle. Любая `VITE_*` переменная публична пользователю.

## 9. Контроль интеграции

Обязательные сценарии:

1. Три проекта открывают три разных `projectId` и данные.
2. F5 на `/hypotheses?hypothesis=H-12&panel=evidence` восстанавливает карточку.
3. DOCX с русским текстом читается без бинарных символов.
4. Файл по умолчанию показывает metadata, preview загружается только по click.
5. Второй click «Предпросмотр» возвращает metadata.
6. Run показывает ETA, переживает reconnect и восстанавливается.
7. Ranking weights после любого изменения дают 100%.
8. Clarification принимает длинный связный текст без потери focus.
9. Evidence открывает правильный file ID и страницу.
10. Feedback сохраняет verdict, reason и comment.
11. Roadmap отображает server dependencies и critical path.
12. Result upload создаёт новую experiment revision.
13. Export job доходит до `ready` и download URL.

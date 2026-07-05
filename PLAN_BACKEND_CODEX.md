# NORLAB Backend — автономный план реализации для Codex

## 1. Роль и конечная цель

Ты — Codex, отвечающий за проектирование и реализацию backend продукта NORLAB с нуля. Не рассчитывай на контекст из других чатов. Сначала изучи существующую рабочую папку и материалы организаторов, сохрани все пользовательские файлы и не перезаписывай их без необходимости.

NORLAB — интеллектуальная система для НИИ и промышленных лабораторий, которая превращает внутренние документы, экспериментальные данные и внешние научно-технические источники в проверяемые исследовательские гипотезы. Система должна:

1. Принимать технологическую проблему, целевой KPI и ограничения.
2. Загружать и разбирать PDF, DOCX, XLSX, изображения и текстовые файлы.
3. Создавать в Neo4j долговременную «Память института» с фактами, сущностями, источниками, гипотезами, экспериментами и результатами.
4. Осознанно искать недостающую информацию во внешних научных, патентных и официальных источниках.
5. Генерировать разнообразные гипотезы одной выбранной сильной LLM через несколько независимых исследовательских запросов.
6. Дедуплицировать и фильтровать кандидатов.
7. Индивидуально критиковать финальные гипотезы второй независимой LLM.
8. Оценивать новизну через Novelty Radar.
9. Показывать разногласия между генератором, критиком, графовыми проверками и экспертом.
10. Оценивать неопределённость и при недостатке данных предлагать уточняющий вопрос или диагностический эксперимент.
11. Компилировать финальные гипотезы в исполнимые планы экспериментов.
12. Принимать экспертный feedback и результаты экспериментов обратно в Память института.
13. Работать с русским, английским и китайским языками.

Не устанавливай искусственный SLA. Пайплайн может работать столько, сколько нужно для качества. Все длительные операции должны выполняться фоновыми задачами с сохранением прогресса, возможностью вернуться к результату, отменить или повторить отдельный этап.

## 2. Зафиксированные продуктовые решения

### 2.1. Хранилища

- Neo4j — источник истины для исследовательской памяти, предметных сущностей, связей, provenance, противоречий, гипотез и экспериментов.
- Neo4j Vector Index — основной векторный поиск по фрагментам, фактам и гипотезам.
- Neo4j Full-Text Index — лексический поиск по терминам, аббревиатурам и обозначениям оборудования.
- PostgreSQL — пользователи, проекты, права, фоновые запуски, статусы, настройки, версии prompt/model profiles и технические журналы.
- S3-совместимое хранилище (MinIO локально) — оригинальные файлы, изображения страниц, экспортированные отчёты и вложения экспериментов.
- Redis — очередь и краткоживущие состояния фоновых задач.

### 2.2. Рекомендуемый стек

- Python 3.12+.
- FastAPI + Pydantic v2.
- SQLAlchemy 2 + Alembic для PostgreSQL.
- Официальный async Neo4j Python Driver; при пользе — официальный пакет `neo4j-graphrag`.
- Celery + Redis для фоновых DAG-задач. Если в репозитории уже есть другой устойчивый task runner, сохрани его, но обеспечь те же свойства.
- SSE для событий прогресса; WebSocket нужен только если уже оправдан существующим стеком.
- PyMuPDF/pypdf для PDF, python-docx для DOCX, openpyxl только для чтения XLSX, OCR для сканов, отдельный vision-adapter для схем.
- Строгие JSON Schema/Pydantic-контракты для всех LLM-ответов.

### 2.3. Модели ядра

Не пытайся использовать весь каталог моделей. В рекомендованном профиле только:

1. `DeepSeek V4 Flash` — основной генератор гипотез, research planner, синтез доказательств и итоговый технический текст.
2. `GPT OSS 120B` — независимый критик финальных гипотез, поиск контрпримеров, анализ фальсифицируемости и неподтверждённых допущений.
3. `Qwen3.6 35B` — только мультимодальный разбор изображений, схем, чертежей и сканов, когда это действительно требуется.
4. `Yandex Embeddings` — embeddings для retrieval, similarity и дедупликации.

Все обращения идут через Yandex AI Studio/OpenAI-compatible API, но точные URI и ключи задаются окружением, а не хардкодятся.

### 2.4. Возможность замены моделей

Архитектура обязана позволять заменить каждую модель одной настройкой без переписывания бизнес-логики. Реализуй `ModelGateway` и capability-based adapter layer.

Пример конфигурации:

```yaml
model_profile:
  id: recommended-v1
  generator: deepseek-v4-flash
  critic: gpt-oss-120b
  vision: qwen3.6-35b-a3b
  embeddings: yandex-embeddings
```

Для каждого model adapter храни:

- provider;
- model URI;
- поддерживаемые modality;
- поддержку structured output/tool calling;
- context/max-output limits;
- правила формирования запроса;
- timeout/retry policy;
- parser/normalizer;
- health status.

Перед активацией нового профиля выполняй compatibility suite:

1. Ответ по обязательной JSON Schema.
2. Корректная обработка RU/EN/ZH.
3. Наличие всех обязательных evidence IDs.
4. Tool/function calling, если используется.
5. Обработка большого evidence pack.
6. Повторяемость ключевых полей.

При несовместимости не активируй профиль и сохраняй последний рабочий. Каждый pipeline run должен записывать точные model profile, prompt versions и параметры, чтобы ответы оставались воспроизводимыми и сравнимыми.

## 3. Мультиязычность RU/EN/ZH

Мультиязычность — обязательное свойство данных и API, а не поздняя косметика.

### 3.1. Хранение текста

Для каждого документа/фрагмента сохраняй:

- `original_language`;
- `original_text`;
- нормализованный текст;
- опциональные переводы RU/EN/ZH;
- признаки машинного перевода;
- ссылку на оригинальную страницу/таблицу/ячейку.

Никогда не заменяй оригинальную цитату переводом. В evidence возвращай оригинал и, при запросе интерфейса, перевод рядом.

### 3.2. Поиск

- Определяй язык запроса.
- Создавай поисковые варианты на русском, английском и китайском, если это повышает полноту.
- Поддерживай aliases/synonyms сущностей на трёх языках.
- Проведи отдельный retrieval eval для RU→EN, RU→ZH, EN→RU и ZH→RU.
- Если Yandex Embeddings недостаточно качественно работает с одним из направлений, возможность смены embedding model уже должна быть предусмотрена ModelGateway.

### 3.3. Ответы и отчёты

- API принимает `response_language: ru|en|zh`.
- Система формирует итог в выбранном языке.
- Названия сущностей имеют локализованные labels, но один canonical ID.
- Числа, единицы и формулы не должны искажаться переводом.

## 4. Уточняющие вопросы: Clarification Gate

Система не должна задавать вопросы всегда. Вопрос возникает только тогда, когда отсутствие информации существенно меняет гипотезы, их рейтинг, реализуемость или безопасность.

### 4.1. Когда вопрос блокирующий

- Не определён целевой KPI или даже направление изменения.
- Неясны единицы измерения критического параметра.
- Есть два несовместимых толкования материала, элемента, потока или оборудования.
- В документах обнаружены взаимоисключающие ограничения.
- Для оценки реализуемости обязательно знать доступность ключевого оборудования.
- Неизвестный параметр меняет выбор между принципиально разными технологиями.
- Запрос потенциально нарушает нормативное, экологическое или безопасностное ограничение.

### 4.2. Когда не нужно останавливать пользователя

- Недостающий параметр можно явно оформить как допущение.
- Информация влияет только на точность диапазона, но не меняет направление.
- Можно предложить диагностический эксперимент.
- Вопрос относится к желательному, а не обязательному улучшению отчёта.

### 4.3. Формат clarification

```json
{
  "id": "...",
  "question": "...",
  "reason": "Почему ответ важен",
  "affected_decisions": ["..."],
  "blocking": true,
  "answer_type": "single_choice|multi_choice|number|text|boolean",
  "options": [],
  "recommended_default": null,
  "allow_unknown": true,
  "continue_with_assumption": true
}
```

- Группируй максимум 1–3 наиболее важных вопроса за одно прерывание.
- Если пользователь выбирает «не знаю», предложи безопасное допущение или диагностический эксперимент.
- Pipeline state переходит в `WAITING_FOR_CLARIFICATION`, сохраняется и возобновляется после ответа с того же этапа.
- Все допущения должны быть видны в гипотезах и отчёте.

## 5. Neo4j: модель Памяти института

### 5.1. Основные узлы

- `Project`
- `Document`
- `Fragment`
- `ExternalSource`
- `Fact`
- `Material`
- `Mineral`
- `Element`
- `ParticleClass`
- `Equipment`
- `ProcessStage`
- `Stream`
- `Parameter`
- `KPI`
- `Constraint`
- `Hypothesis`
- `Experiment`
- `Result`
- `Expert`
- `Clarification`

### 5.2. Основные связи

- `EXTRACTED_FROM`
- `MENTIONS`
- `HAS_FRAGMENT`
- `SUPPORTS`
- `CONTRADICTS`
- `DERIVED_FROM`
- `SIMILAR_TO`
- `DUPLICATES`
- `TESTS`
- `CONFIRMS`
- `REFUTES`
- `MODIFIES`
- `IMPACTS`
- `USES_EQUIPMENT`
- `PART_OF_PROCESS`
- `FLOWS_TO`
- `VALID_UNDER`
- `CONSTRAINED_BY`
- `PRECEDES`
- `REQUIRES`
- `AUTHORED_BY`

Каждый факт и каждая связь, извлечённые из источника, обязаны иметь provenance: document/source ID, location, extraction method, extractor model/version, timestamp, confidence и статус экспертного подтверждения.

### 5.3. Entity resolution

Реализуй нормализацию обозначений, aliases и единиц. Не допускай, чтобы `ГЦ-660`, `гидроциклон 660` и `Hydrocyclone 660` автоматически становились разными объектами.

Пайплайн resolution:

1. Нормализация регистра, пунктуации и единиц.
2. Словарь доменных aliases RU/EN/ZH.
3. Exact/full-text candidates.
4. Vector candidates.
5. LLM adjudication только для неоднозначных случаев.
6. Expert-review queue для высокорисковых слияний.

### 5.4. Индексы и ограничения

- Unique constraints для canonical IDs, DOI, patent numbers, document hashes.
- Full-text indexes по labels, aliases, fragments.
- Vector indexes по Fragment, Fact и Hypothesis.
- Composite indexes по project_id/status/type.
- Не допускай межпроектной утечки приватных данных.

## 6. Приём и обработка данных

### 6.1. Поддерживаемые форматы

- PDF с текстовым слоем.
- Сканированные PDF через OCR.
- DOCX.
- XLSX.
- PNG/JPEG схем и таблиц.
- TXT/MD/CSV/JSON.

### 6.2. Правила

- Сначала используй детерминированный parser; LLM/Vision только когда структура не извлекается надёжно.
- Для XLSX сохраняй workbook/sheet/cell/range, typed values, формулы и ошибки (`#REF!`, `#N/A` и т.д.).
- Для PDF сохраняй page и bounding box, если доступно.
- Для DOCX сохраняй paragraph/table identifiers.
- Для изображений Qwen3.6 создаёт черновой граф; низкоуверенные узлы требуют подтверждения.
- Выполняй data-quality checks и не интерпретируй отсутствующее значение как ноль.
- Используй content hash для дедупликации файлов.

## 7. Осознанный интернет-поиск

Интернет — дополнительный слой доказательств, а не замена внутренним данным.

### 7.1. Когда запускать поиск

- В локальной памяти недостаточно доказательств.
- Нужно проверить новизну.
- Есть конфликт источников.
- Нужен аналог из другой технологии/руды/отрасли.
- Требуется patent prior-art screening.
- Ключевой локальный источник устарел.

### 7.2. Источники

Приоритет:

1. Peer-reviewed публикации и первичные исследования.
2. Патенты и официальные патентные базы.
3. Стандарты и официальные технические документы.
4. Диссертации и университетские репозитории.
5. Официальные документы производителей оборудования.
6. Отраслевые обзоры только как навигация, но не как единственное доказательство.

Коннекторы:

- Semantic Scholar API.
- OpenAlex API.
- Crossref REST API.
- разрешённые источники полного текста;
- WIPO PATENTSCOPE/другие патентные сервисы только в рамках их условий; не делай запрещённый scraping/bulk download;
- Yandex Search API или другой разрешённый web search для официальных источников.

### 7.3. Research Planner

DeepSeek формирует 3-язычный query plan с типами запросов: exact mechanism, equipment/process, material/mineral, counterexample, patent, novelty. Сначала ищи metadata, затем загружай расширенные данные только для отобранных источников.

### 7.4. Проверка источника

Перед добавлением:

- DOI/patent number;
- title/authors/year;
- источник публикации;
- тип документа;
- language;
- лицензия/доступность;
- retraction/correction metadata, если доступно;
- реальное соответствие фрагмента утверждению.

Храни trust tier и retrieval date. Не позволяй модели цитировать URL, которого нет в базе подтверждённых Source records.

### 7.5. Конфиденциальность

Никогда не отправляй во внешний поиск полный внутренний документ или конфиденциальные идентификаторы. Реализуй `SearchQuerySanitizer`, который удаляет названия закрытых объектов, внутренние номера оборудования, имена людей и коммерчески чувствительные значения. Для внешнего поиска должен быть project-level opt-in.

## 8. Исследовательский pipeline

Реализуй pipeline как версионируемый DAG/state machine, а не свободный бесконечный multi-agent chat.

### Этап 0. Project Brief

Вход: проблема, KPI, ограничения, допустимые вмешательства, язык результата.

### Этап 1. Local Diagnosis

Детерминированные расчёты по XLSX/структурированным данным: balance, hotspots, классы крупности, извлекаемые формы, data quality. LLM не должна заменять вычисления.

### Этап 2. Clarification Gate

Определи, есть ли критические пробелы. При необходимости останови run и задай 1–3 вопроса. В противном случае сформируй явные assumptions.

### Этап 3. Memory Retrieval

Graph + vector + full-text retrieval. Найди факты, старые гипотезы, эксперименты, подтверждения, опровержения и ограничения.

### Этап 4. External Research

Gap-driven поиск. Сохрани проверенные внешние источники в Neo4j. Кешируй результаты по нормализованным query/DOI/patent number.

### Этап 5. Evidence Packs

Создай четыре независимых компактных evidence pack. Используй evidence IDs, а не неконтролируемые цитаты.

### Этап 6. Collider Generation

Одна активная generator model (в recommended profile — DeepSeek V4 Flash) получает четыре параллельных запроса:

1. Технологическая оптимизация.
2. Низкий CAPEX/операционные изменения.
3. Контрфактуальный анализ и изменение схемы потоков.
4. Научная новизна, межотраслевые аналогии и пробелы.

Каждый запрос формирует 3–4 гипотезы. Генераторы не видят ответы друг друга.

### Этап 7. Normalization and Deduplication

- JSON Schema validation.
- Unit/term normalization.
- Exact + vector duplicate detection.
- Graph duplicate/similarity detection.
- Merge только с сохранением lineage первоначальных кандидатов.

### Этап 8. Hard Gates

1. Evidence Gate.
2. Engineering/Constraint Gate.
3. Falsifiability Gate.
4. Experimentability Gate.

Сначала детерминированные правила и граф, затем LLM только для неоднозначности.

### Этап 9. Independent Critique

GPT OSS 120B получает одну гипотезу на запрос, её evidence pack, ограничения и похожие исторические эксперименты. Выход: fatal flaws, counterexamples, unsupported assumptions, transfer risks, missing variables, falsification test и structured scores.

### Этап 10. Novelty Radar

Для финалистов выполни отдельный научный и патентный поиск. Классы:

- `KNOWN` — по существу известное решение;
- `ADAPTED` — известный принцип в новых условиях;
- `NEW_COMBINATION` — новая комбинация известных операций;
- `POTENTIALLY_NOVEL` — прямых аналогов не найдено;
- `UNKNOWN` — данных недостаточно.

Novelty Radar не является юридическим патентным заключением. Всегда показывай найденные аналоги и границы поиска.

### Этап 11. Disagreement Map

Для каждого критерия собери оценки:

- generator technical review;
- GPT OSS independent critique;
- Neo4j/rule evidence and feasibility checks;
- source quality;
- expert feedback, если есть.

Критерии: evidence, mechanism, feasibility, novelty, expected value, risks, experimentability. Храни не только среднее, но и dispersion/range. Высокое разногласие — самостоятельный risk signal.

### Этап 12. Uncertainty Navigator

Рассчитай составной индекс неопределённости, не выдавая его за статистическую вероятность истины. Компоненты:

- evidence coverage;
- source trust;
- contradictions;
- missing critical variables;
- data quality;
- transfer distance между источником и текущими условиями;
- model/rule disagreement;
- ширина effect range.

Выход:

- уровень `LOW|MEDIUM|HIGH`;
- причины;
- чувствительные допущения;
- уточняющий вопрос, только если он блокирует решение;
- рекомендуемый диагностический эксперимент.

### Этап 13. Portfolio Ranking

Сначала hard gates, затем multi-criteria/Pareto ranking. Критерии и веса настраиваемые: expected value, evidence, feasibility, novelty, cost, duration, risk, uncertainty, information gain. Не скрывай исходные оценки за одним числом.

### Этап 14. Experiment Compiler

Для 1–3 выбранных гипотез создай исполнимый протокол. Обязательные поля:

- objective;
- hypothesis ID;
- experiment type;
- factors and levels;
- controls/baseline;
- fixed conditions;
- sequence of steps;
- samples/repeats and rationale;
- equipment/materials/reagents;
- measurements and units;
- data collection template;
- analysis method;
- safety/regulatory notes;
- resource estimate;
- success criteria;
- failure criteria;
- early-stop criteria;
- decision tree for positive/negative/inconclusive results;
- assumptions and unresolved uncertainties.

Если основная гипотеза слишком неопределённа, компилируй сначала diagnostic experiment с максимальным information gain.

### Этап 15. Report and Feedback

Сформируй JSON и Markdown как канонические формы; затем DOCX/PDF exporters. Feedback: accept/edit/reject, reason, expert score. Result: confirmed/refuted/inconclusive, measurements, attachments. Всё возвращается в Neo4j.

## 9. Контракты данных

### 9.1. Hypothesis

```json
{
  "id": "...",
  "title": "...",
  "statement": "Проверяемое утверждение",
  "intervention": {},
  "target_process": [],
  "conditions": [],
  "causal_mechanism": [],
  "data_triggers": ["evidence-id"],
  "supporting_evidence": ["evidence-id"],
  "contradicting_evidence": ["evidence-id"],
  "assumptions": [],
  "expected_kpis": [],
  "risks": [],
  "constraints": [],
  "falsification_conditions": [],
  "novelty": {},
  "uncertainty": {},
  "disagreement": {},
  "lineage": {},
  "status": "DRAFT"
}
```

LLM может ссылаться только на существующие evidence IDs. Backend обязан проверить каждую ссылку и удалить/заблокировать неподтверждённое утверждение.

## 10. API

Минимальные endpoints:

### Projects and data

- `POST /projects`
- `GET /projects/{id}`
- `PATCH /projects/{id}`
- `POST /projects/{id}/documents`
- `GET /projects/{id}/documents`
- `GET /documents/{id}`
- `GET /documents/{id}/ingestion-status`
- `POST /documents/{id}/reprocess`

### Runs

- `POST /projects/{id}/runs`
- `GET /runs/{id}`
- `GET /runs/{id}/events` (SSE)
- `POST /runs/{id}/cancel`
- `POST /runs/{id}/retry-stage`
- `GET /runs/{id}/artifacts`

### Clarifications

- `GET /runs/{id}/clarifications`
- `POST /runs/{id}/clarifications/{question_id}/answer`
- `POST /runs/{id}/resume`

### Memory and graph

- `GET /projects/{id}/memory/search`
- `GET /projects/{id}/graph/subgraph`
- `GET /entities/{id}`
- `GET /sources/{id}`

### Hypotheses

- `GET /runs/{id}/hypotheses`
- `GET /hypotheses/{id}`
- `POST /hypotheses/{id}/feedback`
- `POST /hypotheses/compare`
- `POST /hypotheses/{id}/compile-experiment`

### Experiments

- `GET /experiments/{id}`
- `PATCH /experiments/{id}`
- `POST /experiments/{id}/results`
- `POST /experiments/{id}/attachments`

### Reports

- `GET /runs/{id}/report`
- `POST /runs/{id}/export?format=json|md|docx|pdf&language=ru|en|zh`

### Admin/model profiles

- `GET /admin/model-profiles`
- `POST /admin/model-profiles/compatibility-test`
- `POST /admin/model-profiles/{id}/activate`

Сгенерируй OpenAPI и typed schemas, чтобы frontend мог работать параллельно.

### 10.1. Агрегированные read-модели для упрощённого frontend

Frontend использует только пять основных routes: проекты, рабочая область, исследование, гипотезы, эксперименты. Поэтому поверх предметных endpoints добавь тонкий presentation/BFF layer с агрегированными read-моделями. Это не отдельный микросервис на старте: реализуй projection services внутри FastAPI, переиспользующие domain services и repositories.

Обязательные endpoints:

- GET /projects — карточки проектов и краткий статус;
- GET /projects/{id}/workspace-view;
- GET /projects/{id}/research-view?run_id={run_id};
- GET /projects/{id}/hypotheses-view?run_id={run_id};
- GET /projects/{id}/experiments-view;
- GET /hypotheses/{id}/inspector;
- GET /experiments/{id}/editor-view.

Назначение projection endpoints:

- отдавать данные для первого viewport одним запросом;
- не заставлять frontend собирать экран из 10–20 атомарных вызовов;
- возвращать summary, capabilities, warnings, partial flags и ссылки/IDs для lazy-loaded details;
- сохранять предметные write endpoints отдельными и явными;
- не дублировать бизнес-логику и расчёты из pipeline.

Каждая projection response содержит:

- id, version, updated_at;
- summary;
- capabilities — разрешённые действия с учётом роли и состояния;
- warnings;
- is_partial и missing_artifacts;
- links или IDs для lazy loading;
- locale-independent enum values;
- server timestamps.

Крупные данные загружай отдельно только по требованию:

- Neo4j subgraph;
- полный текст источника;
- полный список evidence;
- lineage;
- большой preview отчёта.

Требования к реализации:

- используй Pydantic response schemas и явно версионируй contracts;
- избегай N+1 запросов, добавь batch loaders/repository methods;
- используй короткий cache для тяжёлых projections с инвалидированием по domain events;
- поддержи ETag/If-None-Match или version для дешёвого refresh;
- не кешируй права доступа независимо от пользователя;
- добавь contract tests между projection schemas и OpenAPI fixtures frontend;
- SSE остаётся источником live updates, а projection endpoint — источником восстановления состояния после refresh/reconnect;
- settings не требуют отдельной страницы: project/model settings должны читаться и изменяться через существующие settings/admin endpoints для drawer frontend.

## 11. Состояния и фоновые задачи

Поддержи состояния:

```text
CREATED
INGESTING
ANALYZING
WAITING_FOR_CLARIFICATION
RETRIEVING_MEMORY
RESEARCHING_EXTERNAL
GENERATING
DEDUPLICATING
APPLYING_GATES
CRITIQUING
CHECKING_NOVELTY
ANALYZING_DISAGREEMENT
ANALYZING_UNCERTAINTY
COMPILING_EXPERIMENTS
BUILDING_REPORT
COMPLETED
FAILED
CANCELLED
```

- Каждый этап idempotent и сохраняет artifacts.
- Повтор этапа не должен дублировать graph nodes.
- Ошибка внешнего источника не уничтожает весь run; сохрани partial result и возможность retry.
- Длительные операции не держат HTTP request открытым.
- Не показывай выдуманный процент прогресса: отправляй stage, completed units, queued units и сообщения.

## 12. Безопасность

- API keys только в secrets/env.
- RBAC и project/tenant isolation.
- Audit log всех LLM-вызовов, внешних поисков, prompt/model versions и экспертных изменений.
- Возможность отключить внешнее исследование для конфиденциального проекта.
- Шифрование данных in transit и at rest в production profile.
- Redaction/search-query sanitization.
- Не логируй полный конфиденциальный prompt по умолчанию; храни hash и защищённый trace по политике проекта.
- Защита от prompt injection в загруженных документах: документы являются данными, а не инструкциями.

## 13. Наблюдаемость и стоимость

Для каждого LLM-вызова храни:

- run/stage/candidate ID;
- model profile/version;
- prompt version;
- token usage;
- latency;
- retries/errors;
- cache hit;
- approximate cost;
- JSON validation result.

Не ограничивай качество искусственным SLA, но обеспечь budget controls на уровне проекта: максимальное число генеративных ветвей, число внешних источников, число финалистов и финансовый лимит. При достижении лимита не обрывай молча — запроси решение пользователя или продолжи в экономичном режиме.

## 14. Тестирование и evaluation

### 14.1. Unit

- parsers;
- units and normalization;
- entity resolution;
- graph writes and provenance;
- duplicate detection;
- clarification rules;
- uncertainty calculation;
- Novelty classification;
- ModelGateway/schema parsers.

### 14.2. Integration

- PostgreSQL/Neo4j/Redis/MinIO.
- Yandex API adapters с mock и sandbox tests.
- external research connectors с rate-limit/backoff.
- pipeline pause/resume/retry.
- export.

### 14.3. Golden evaluation

Используй четыре пары организаторов «Excel хвостов → экспертные гипотезы» как weak labels:

1. Скрыть готовые гипотезы.
2. Запустить pipeline.
3. Оценить semantic coverage экспертных направлений.
4. Отдельно оценить новые гипотезы.
5. Проверить citation faithfulness.
6. Проверить реализуемость по оборудованию.
7. Проверить, что `#REF!`/пропуски не интерпретируются как факты.

Проведи model bake-off для generator candidates и активируй рекомендованный DeepSeek профиль, если он победил. Архитектура и eval не должны зависеть от его победы.

### 14.4. Multilingual eval

- одинаковая задача на RU/EN/ZH;
- cross-language retrieval;
- сохранность чисел и единиц;
- оригинал + перевод цитаты;
- китайские источники и queries;
- отсутствие смешения языков в итоговом отчёте.

## 15. Порядок реализации

### Phase 1. Foundation

Проект, Docker Compose, FastAPI, PostgreSQL, Neo4j, Redis, MinIO, migrations, health checks, auth skeleton, OpenAPI.

### Phase 2. Ingestion and memory

Parsers, object storage, provenance, entity schema, Neo4j indexes, embeddings, search, document viewer metadata.

### Phase 3. ModelGateway and multilingual contracts

Adapters, recommended profile, JSON contracts, compatibility suite, language layer.

### Phase 4. Diagnosis and clarification

XLSX diagnostics, data quality, Project Brief, Clarification Gate, pause/resume.

### Phase 5. Collider

Four generator perspectives, normalization, lineage, dedupe, hard gates.

### Phase 6. Critique and research

External connectors, individual critic calls, source verification, cache, confidentiality.

### Phase 7. Novelty, disagreement, uncertainty

Novelty Radar, Disagreement Map artifacts, Uncertainty Navigator, diagnostic experiment routing.

### Phase 8. Experiment compiler and feedback loop

Protocols, editing, results, confirm/refute/inconclusive, writeback to graph.

### Phase 9. Frontend projections and contract stabilization

Workspace, research, hypotheses and experiments read-models, hypothesis inspector, editor view, capabilities, partial flags, ETag/version, batch loading, cache invalidation, OpenAPI fixtures и contract tests.

### Phase 10. Reports, security, eval and hardening

Exports RU/EN/ZH, audit, budget controls, failure recovery, golden datasets, documentation.

## 16. Критерии готовности backend

Backend готов, когда:

1. Проект создаётся и принимает файлы разных форматов.
2. Данные превращаются в проверяемые graph nodes/relations с provenance.
3. Поиск работает graph + vector + full text.
4. Pipeline сохраняется, стримит этапы, ставится на паузу и возобновляется.
5. Уточняющие вопросы появляются только по правилам Clarification Gate.
6. Одна generator model выполняет четыре независимых перспективы.
7. Финалисты проходят индивидуальную независимую критику.
8. Каждое существенное утверждение связано с evidence ID.
9. Novelty Radar использует внутреннюю память и внешние источники.
10. Disagreement Map и Uncertainty Navigator формируют машинно-читаемые artifacts.
11. Компилятор создаёт редактируемый эксперимент с success/failure/stop criteria.
12. Feedback и результат возвращаются в Neo4j и влияют на последующий retrieval/ranking.
13. RU/EN/ZH поддерживаются в данных, запросах и отчётах.
14. Модель меняется через model profile и проходит compatibility suite.
15. Ошибка одного внешнего сервиса не уничтожает весь run.
16. Существуют unit, integration и golden evaluation tests.
17. Пять основных frontend routes получают первый viewport через агрегированные projections без каскада из 10–20 запросов.
18. После refresh или потери SSE состояние экрана полностью восстанавливается из projection endpoint, а права действий приходят через capabilities.

## 17. Итоговые deliverables

- Исходный код backend.
- Docker Compose для локального запуска.
- `.env.example` без секретов.
- Миграции PostgreSQL и Neo4j initialization scripts.
- OpenAPI schema.
- Seed/import organizer dataset.
- Prompt/model profile registry.
- Test suite и golden eval runner.
- Архитектурная документация.
- Runbook: запуск, восстановление, смена модели, повтор этапа, очистка данных.
- Примеры API-запросов и fixture responses для пяти frontend projections, drawers и partial states.

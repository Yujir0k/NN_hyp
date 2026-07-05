# NORLAB UI/Frontend — автономный план реализации для Codex

## 1. Роль и конечная цель

Ты — Codex, отвечающий за UX/UI и frontend продукта NORLAB с нуля. Не рассчитывай на контекст из других чатов. Сначала изучи репозиторий, существующий frontend stack, OpenAPI и дизайн-конвенции. Если frontend отсутствует, создай современное web-приложение по этому плану.

NORLAB — научно-инженерная система для НИИ. Она принимает описание проблемы и внутренние материалы, использует Память института и открытые интернет-источники, строит и сталкивает независимые гипотезы, проверяет новизну, разногласия и неопределённость, а затем компилирует проверяемый эксперимент.

Главная UX-цель: провести исследователя по пути «проблема → доказательства → гипотезы → эксперимент» без ощущения сложного административного портала. Интерфейс должен быть простым, спокойным и интуитивным, хотя внутри работает сложный pipeline.

Не реализуй backend внутри frontend. Используй OpenAPI-generated client и MSW mocks, пока backend создаётся параллельно.

## 2. Неизменяемые возможности продукта

Frontend обязан поддерживать:

1. Проекты и Project Brief.
2. Загрузку PDF, DOCX, XLSX, CSV, TXT, MD и изображений.
3. Память института в PostgreSQL, vector search и Neo4j.
4. Осознанный поиск по открытым источникам интернета.
5. NORLAB pipeline и оптимизированный Коллайдер гипотез.
6. Независимую критику и Engineering Gates.
7. Novelty Radar.
8. Карту разногласий.
9. Навигатор неопределённости.
10. Компилятор экспериментов.
11. Обратную запись результатов эксперимента в Память института.
12. RU/EN/ZH интерфейс и работу с литературой на русском, английском и китайском.
13. Уточняющие вопросы только по событию backend Clarification Gate, а не в каждом запуске.
14. Долгие фоновые запуски без искусственного ограничения времени.
15. Смену model profile одной настройкой с проверкой совместимости.
16. Полную provenance: любое содержательное утверждение ведёт к источнику, странице, фрагменту или ячейке.

## 3. Основные UX-принципы

1. Пять основных экранов вместо семнадцати.
2. Один экран — одна понятная пользовательская задача.
3. Детали открываются в drawer, modal, popover, accordion или expandable card, а не на новой странице.
4. Progressive disclosure: сначала вывод, статус и следующее действие; методика и технические детали — по запросу.
5. Никакой навигации, повторяющей внутренние этапы pipeline.
6. Никакого обязательного чата как основного интерфейса. Допустим небольшой контекстный помощник, но ядро — структурированные данные.
7. Hover даёт только подсказку или preview. Любое важное действие доступно по click, keyboard и touch.
8. Состояние пользователя сохраняется: выбранный проект, фильтры, раскрытые панели и открытая гипотеза восстанавливаются по URL.
9. Пользователь всегда понимает: что система делает, на каких данных, что уже готово и какое действие требуется от него.
10. Дизайн выглядит корпоративно и технологично, но не перегружает научную работу декоративными эффектами.

## 4. Визуальное направление

### 4.1. Референс

Главный визуальный референс — https://nornickel.ru/ и предоставленный пользователем скриншот главной страницы. Брать оттуда визуальную грамматику: синий цвет, крупные спокойные композиции, белое пространство, асимметричные скругления, тонкие линии, сдержанную типографику и круглые кнопки со стрелкой.

Не делать буквальную копию сайта и не использовать логотип или защищённые бренд-материалы без предоставленных прав. NORLAB должен ощущаться частью той же корпоративной экосистемы, но оставаться самостоятельным научным продуктом.

### 4.2. Цветовые токены

Цвета, подтверждённые визуальным референсом:

- brand-700: #004C97 — глубокий фирменный синий;
- brand-600: #0066B3 — основной синий;
- brand-500: #0077C8 — активные элементы, ссылки, акценты;
- brand-300: #6CC5E9 — светло-голубой акцент;
- ink-900: #1A1B25 — основной текст;
- ink-600: #737B91 — вторичный текст;
- surface-0: #FFFFFF;
- surface-50: #FBFBFC;
- surface-100: #F3F4F8 — серо-голубой фон секций;
- border-200: #D8DCE6.

Основной gradient: от #004C97 к #0077C8. Использовать его только для крупных feature cards, выбранной гипотезы, ключевого CTA и шапки активного исследования. Не заливать градиентом все элементы.

Семантические цвета:

- success: #178A68;
- warning: #C67A11;
- danger: #C44646;
- info: #0077C8.

Семантический статус никогда не передавать только цветом: добавлять label и icon.

### 4.3. Типографика

На референсе используется Proxima Nova W08. Если в репозитории есть легальная лицензированная версия — использовать её. Иначе:

- основной web-font: Onest;
- резерв: Inter, Arial, sans-serif;
- китайский fallback: Noto Sans SC.

Рекомендуемый stack: Onest, Inter, Noto Sans SC, Arial, sans-serif.

Иерархия:

- Display: 48–56 px, weight 600, только для первого заголовка крупных экранов;
- H1: 36–40 px, weight 600;
- H2: 26–30 px, weight 600;
- H3: 20–22 px, weight 600;
- Body: 16–18 px, weight 400;
- Small: 13–14 px;
- Eyebrow labels: 12–13 px, uppercase, letter-spacing 0.06em.

Не использовать плотный мелкий текст. Для китайского языка проверить line-height и переносы отдельно.

### 4.4. Формы, сетка и пространство

- Максимальная ширина контента: 1440 px.
- Desktop grid: 12 колонок.
- Основной spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Большие секции разделять воздухом и тонкими горизонтальными линиями.
- Feature card radius: 32–40 px.
- Обычная card: 16–20 px.
- Поля и controls: 12–16 px.
- Характерная форма референса: radius 20px 20px 20px 0 или 32px 32px 32px 0. Использовать дозированно для ключевых карточек.
- Круглые icon buttons: 40–48 px с тонкой обводкой и стрелкой.
- Тени минимальные; иерархию строить фоном, размером, линией и расстоянием.

### 4.5. Карточки и интерактивность

Карточки должны быть крупными, понятными и иметь одно основное действие.

- Hover: лёгкое поднятие на 2–4 px, усиление синей обводки, появление вторичной стрелки.
- Focus: видимый outline минимум 2 px.
- Click: раскрывает drawer, accordion или detail mode.
- Expandable card должна явно показывать состояние «свернуто/развернуто».
- Tooltip только для короткого пояснения; большие данные не прятать в tooltip.
- Popover использовать для фильтров, легенды и быстрых настроек.
- Drawer использовать для подробностей объекта и редактирования.
- Modal использовать для коротких решений и форм.
- Full-screen overlay использовать только для Neo4j graph и сложного source viewer.

Не полагаться на hover: на touch-устройствах тот же контент должен открываться по нажатию.

### 4.6. Изображения и data visualization

Допустимы реальные индустриальные, лабораторные и северные фотографии в project hero или onboarding. Не использовать случайные декоративные AI-иллюстрации вместо научных данных.

Графики:

- сине-голубая шкала для обычных значений;
- amber/red только для риска и конфликта;
- обязательная текстовая или табличная альтернатива;
- понятная легенда;
- минимум визуального шума;
- никаких «космических» 3D-графов.

Neo4j graph — исследовательский инструмент, а не декорация. По умолчанию показывать локальный subgraph, а не все узлы института.

### 4.7. Чего не делать

- тёмный dashboard как основную тему;
- неон, glassmorphism и чрезмерные glow-эффекты;
- десятки маленьких KPI cards;
- отдельную страницу для каждого артефакта;
- постоянно видимую техническую телеметрию моделей;
- перегруженную восьмиуровневую боковую навигацию;
- бесконечные таблицы без summary;
- анимации, замедляющие научную работу.

## 5. Каркас приложения и навигация

### 5.1. Глобальная шапка

Высота 72–80 px, глубокий синий фон.

Слева:

- знак/название NORLAB;
- переключатель текущего проекта.

Справа:

- глобальный поиск;
- уведомления;
- RU / EN / 中文;
- avatar/user menu;
- настройки в dropdown.

### 5.2. Навигация внутри проекта

Использовать компактную горизонтальную project navigation под шапкой или узкий rail. Всего четыре пункта:

1. Рабочая область.
2. Исследование.
3. Гипотезы.
4. Эксперименты.

Раздел «Проекты» доступен через project switcher и logo. Settings открываются в drawer/modal, а не отдельным экраном.

### 5.3. Основные routes

Всего пять основных routes:

| Route | Экран | Главная задача |
|---|---|---|
| /projects | Проекты | выбрать или создать проект |
| /projects/:projectId/workspace | Рабочая область | сформировать brief, загрузить данные, увидеть память |
| /projects/:projectId/research | Исследование NORLAB | запустить pipeline и наблюдать формирование гипотез |
| /projects/:projectId/hypotheses | Портфель гипотез | изучить, сравнить и выбрать гипотезы |
| /projects/:projectId/experiments | Эксперименты и отчёт | скомпилировать протокол, внести результат и экспортировать отчёт |

Deep links сохранять query parameters:

- run;
- hypothesis;
- experiment;
- panel;
- source;
- tab.

Например, ссылка на Novelty Radar не создаёт новый route, а открывает /hypotheses?hypothesis=H-12&panel=novelty.

## 6. Пять основных экранов

### Экран 1. Проекты

Цель: быстро продолжить работу или создать новый проект.

Композиция:

- крупный заголовок и короткое описание;
- заметная синяя feature card «Создать проект»;
- recent projects в виде крупных карточек;
- строка поиска и компактные фильтры;
- badges: состояние данных, последний запуск, число финалистов, незакрытые эксперименты;
- empty state с одним CTA.

Project creation открывается в modal/stepper максимум из трёх шагов:

1. Задача и ожидаемый результат.
2. Область, ограничения и критерии успеха.
3. Данные и подтверждение.

Пользователь может сохранить черновик. Продвинутые поля свернуты в «Дополнительные ограничения».

### Экран 2. Рабочая область проекта

Это единая точка подготовки исследования. Она объединяет прежние экраны Project Brief, обзор, источники и Память института.

Верх:

- название проекта;
- readiness indicator;
- последнее исследование;
- основной CTA «Запустить исследование»;
- вторичные действия «Редактировать brief» и «Добавить данные».

Основная сетка:

1. Problem Brief — крупная карточка с задачей, критериями успеха, ограничениями и assumptions. Редактирование в drawer.
2. Источники — upload zone, количество проиндексированных файлов и последние документы.
3. Память института — найденные похожие проекты, решения, эксперименты и противоречия.
4. Диагностика данных — пробелы, конфликтующие параметры, OCR/ingestion warnings.
5. External Research Policy — какие открытые источники разрешены и какие домены исключены.

Внутри экрана использовать tabs:

- Обзор;
- Данные;
- Память.

Они меняют содержимое центральной области без смены route.

Интерактивные слои:

- document detail drawer: metadata, status, pages/sheets, extracted fragments, retry;
- source viewer overlay: переход к странице, фрагменту или ячейке;
- memory preview card: похожий кейс и краткое объяснение;
- graph overlay: Neo4j subgraph с фильтрами, search и node inspector;
- brief drawer: редактирование задачи без ухода со страницы.

Graph не загружать до открытия overlay.

### Экран 3. Исследование NORLAB

Это единый экран запуска, прогресса и Коллайдера гипотез. Он заменяет отдельные страницы run, clarification и collider.

До запуска:

- выбранный model profile;
- объём внутренних данных;
- план внешнего поиска;
- параметры разнообразия гипотез;
- CTA «Начать исследование».

После запуска:

- крупный status header;
- stage timeline с фактически выполненными этапами;
- activity feed с понятными сообщениями;
- счётчики: evidence packs, сгенерированные, объединённые, исключённые, финалисты;
- кнопки отмены и retry failed stage;
- статус SSE connection.

Не показывать выдуманный процент завершения и не обещать время. Показывать текущий stage, completed units, queued units, timestamps и уже доступные artifacts.

Коллайдер отображать на том же экране:

- funnel «сгенерировано → дедупликация → gates → critique → финалисты»;
- компактные candidate cards;
- tabs «Финалисты», «Все», «Исключённые»;
- причины исключения;
- diversity/family labels;
- сортировка по score, novelty, feasibility, uncertainty.

Клик по candidate открывает тот же Hypothesis Inspector, который используется на экране «Гипотезы».

Clarification Gate:

- backend event открывает правый drawer;
- сверху объяснение, почему вопрос важен;
- один вопрос за раз;
- варианты ответа, свободный ввод, «Не знаю» и «Продолжить с допущением»;
- blocking вопрос останавливает только зависимые stages;
- non-blocking вопрос не перекрывает весь интерфейс;
- после ответа pipeline автоматически продолжает работу.

### Экран 4. Портфель гипотез

Цель: понять сильнейшие варианты и выбрать, что проверять.

Основной layout:

- summary: число финалистов, coverage families, warnings;
- filters и saved views в popover;
- крупные cards финалистов;
- comparison tray в нижней части экрана;
- segmented control «Карточки / Сравнение».

Hypothesis card:

- короткое проверяемое утверждение;
- family;
- четыре ключа: научная обоснованность, инженерная реализуемость, экономическая ценность, проверяемость;
- novelty status;
- uncertainty level;
- disagreement badge;
- ожидаемый KPI;
- главное слабое место;
- CTA «Открыть» и checkbox «Сравнить».

Hypothesis Inspector — широкий правый drawer, а не отдельный экран. Внутри tabs:

1. Обзор — утверждение, mechanism, boundary conditions, expected KPI.
2. Доказательства — evidence for/against с provenance.
3. Новизна — Novelty Radar, ближайшие аналоги, search coverage и limitations.
4. Разногласия — оценки critic/reviewer/rules, heatmap и объяснения.
5. Неопределённость — epistemic/data/model/engineering uncertainty, sensitivity и диагностический тест.
6. История — похожие решения и эксперименты из Памяти института.

В drawer также находятся:

- Engineering Gates;
- independent critique;
- assumptions;
- lineage;
- feedback «полезно / неверно / дубликат / уже проверяли»;
- CTA «Скомпилировать эксперимент».

Comparison mode находится на том же route:

- 2–5 гипотез;
- sticky rows;
- настраиваемые веса;
- Pareto view;
- различия подсвечены;
- click по ячейке открывает соответствующую вкладку Inspector;
- export comparison в PDF/CSV.

Novelty Radar, Карта разногласий и Навигатор неопределённости не являются отдельными страницами. Это глубокие вкладки одной гипотезы, доступные из badges и direct links.

### Экран 5. Эксперименты и отчёт

Этот экран объединяет Компилятор экспериментов, список экспериментов и отчёты.

Верх:

- выбранная гипотеза;
- CTA «Скомпилировать протокол»;
- status summary по экспериментам;
- кнопка «Сформировать отчёт».

Основная область:

- list или kanban экспериментов;
- фильтры по status/owner/hypothesis;
- карточки с KPI, сроком, стоимостью, безопасностью и следующим действием;
- report readiness card.

Experiment Editor открывается в широком drawer или split view:

1. Цель и проверяемая гипотеза.
2. Независимые и зависимые переменные.
3. Control/baseline.
4. Оборудование и материалы.
5. Пошаговый протокол.
6. Метрики и критерии успеха/остановки.
7. Sample size и план анализа.
8. Риски и безопасность.
9. Оценка времени и стоимости.
10. Assumptions и нерешённая неопределённость.

Каждый AI-generated field редактируем. Хранить версии и diff.

Result entry:

- фактические параметры;
- измерения;
- observed outcome;
- attachments;
- deviation from protocol;
- verdict supported/refuted/inconclusive;
- preview изменений, которые будут записаны в Память института.

Report drawer:

- sections preview;
- включение/исключение приложений;
- язык RU/EN/ZH;
- export JSON, Markdown, DOCX, PDF;
- provenance appendix;
- предупреждения о partial data.

## 7. Что стало интерактивными слоями вместо экранов

| Раньше отдельный экран | Новое представление |
|---|---|
| Создание/редактирование Project Brief | modal/brief drawer в Рабочей области |
| Источники и индексация | tab «Данные» + document drawer |
| Память института | tab «Память» + graph overlay |
| Уточняющий вопрос | context drawer по backend event |
| Коллайдер | секция экрана «Исследование» |
| Карточка гипотезы | Hypothesis Inspector drawer |
| Novelty Radar | вкладка Inspector |
| Карта разногласий | вкладка Inspector |
| Навигатор неопределённости | вкладка Inspector |
| Сравнение финалистов | mode экрана «Гипотезы» |
| Компилятор экспериментов | Experiment Editor drawer/split view |
| Отчёты | report/export drawer |
| Настройки | global/project settings drawer |

Итог: пять routes, семь reusable overlays, никакого ощущения «17 разных систем».

## 8. Общие компоненты

Создать reusable library:

- AppHeader;
- ProjectSwitcher;
- ProjectNavigation;
- SectionHeader;
- FeatureCard;
- ExpandableCard;
- MetricStrip;
- StatusPill;
- CircularArrowButton;
- StageTimeline;
- ActivityFeed;
- UploadZone;
- SourceCitation;
- SourceViewer;
- EvidenceList;
- MemoryPreview;
- GraphOverlay;
- ClarificationDrawer;
- ColliderFunnel;
- HypothesisCard;
- HypothesisInspector;
- FourKeys;
- GateBadge;
- NoveltyScale;
- DisagreementHeatmap;
- UncertaintyBreakdown;
- ComparisonMatrix;
- ExperimentEditor;
- ReportDrawer;
- SettingsDrawer;
- EmptyState;
- ErrorState;
- PartialResultBanner;
- Skeleton;

Для сложных карточек создать compact и expanded variants. Не дублировать presentation logic между экраном исследования и портфелем гипотез.

## 9. Мультиязычность

- UI locales: ru, en, zh-CN.
- Все labels, statuses, filters, errors и exports локализуются.
- URL не должен зависеть от языка.
- Переключение языка не теряет route, filters и open drawer.
- Для источника хранить original text и translation отдельно.
- SourceCitation показывает язык оригинала.
- Переключатель «Оригинал / Перевод» доступен в source viewer.
- Не переводить units, chemical formulas, identifiers и filenames.
- Использовать Intl для дат и чисел.
- Проверить CJK line breaks и отсутствие обрезания.
- Локализация интерфейса не должна менять фактический response_language исследования без явного действия.

## 10. Работа с долгим pipeline

- После старта оставить пользователя на экране «Исследование».
- Получать события через SSE; при обрыве использовать polling fallback.
- После refresh восстанавливать run с backend.
- Готовые artifacts показывать сразу, не дожидаясь полного отчёта.
- Разрешить уйти на другой экран и вернуться.
- Уведомлять о clarification, completion и failure.
- Не обещать SLA и не показывать фиктивный ETA.
- Partial results сохранять и помечать.
- Если внешний источник недоступен, показывать, какая часть анализа пострадала.

## 11. API integration и связь с упрощённым UI

Упрощение количества экранов не упрощает научный backend, но требует удобных frontend projections. Не заставляй UI собирать один экран из десятков атомарных запросов.

Ожидаемые агрегированные read endpoints:

- GET /projects;
- GET /projects/:projectId/workspace-view;
- GET /projects/:projectId/research-view?run_id=...;
- GET /projects/:projectId/hypotheses-view?run_id=...;
- GET /projects/:projectId/experiments-view;
- GET /hypotheses/:hypothesisId/inspector;
- GET /experiments/:experimentId/editor-view;
- GET /runs/:runId/events через SSE.

Write operations остаются предметными:

- create/update project;
- upload/reprocess document;
- start/cancel/retry run;
- answer clarification;
- feedback hypothesis;
- compile/update experiment;
- submit result;
- export report;
- compatibility test/activate model profile.

Каждая projection должна содержать:

- id и version/updated_at;
- summary для первого viewport;
- capabilities: какие действия разрешены;
- warnings и partial flags;
- links/IDs для lazy-loaded details;
- locale-independent enum values;
- server timestamps.

Lazy-load:

- Neo4j graph;
- source document content;
- full evidence lists;
- historical lineage;
- large report preview.

Сгенерируй typed client из OpenAPI. Не копируй типы вручную. React Query cache keys должны отражать projectId, runId, locale и filters. После mutations инвалидировать только затронутые projections.

MSW fixtures:

1. Empty project.
2. Project с файлами и памятью.
3. Run без clarification.
4. Run с blocking clarification.
5. Run с non-blocking clarification.
6. Partial external research failure.
7. Candidate, не прошедший Engineering Gate.
8. High-disagreement hypothesis.
9. High-uncertainty hypothesis.
10. Novelty KNOWN и POTENTIALLY_NOVEL.
11. Experiment with result/writeback preview.
12. RU/EN/ZH content.

## 12. Frontend architecture

Рекомендуемый stack, если репозиторий не диктует иное:

- React 19 + TypeScript;
- Vite или Next.js App Router в зависимости от существующего проекта;
- TanStack Query;
- React Hook Form + Zod;
- Zustand только для небольшого UI state;
- i18next;
- ECharts или Recharts для charts;
- Cytoscape.js для Neo4j subgraph;
- MSW;
- Vitest + Testing Library;
- Playwright;
- Storybook, если он уже принят в репозитории.

Структура по features, а не по типам файлов:

- app;
- features/projects;
- features/workspace;
- features/research;
- features/hypotheses;
- features/experiments;
- entities;
- shared/ui;
- shared/api;
- shared/i18n;
- shared/lib.

Server state хранить в TanStack Query. Drawer/modal state — в URL, если на него нужна deep link, иначе локально. Не копировать серверные entities в глобальный store.

## 13. Ошибки и edge cases

Обработать:

- unsupported/corrupted document;
- OCR failed;
- duplicate document;
- model unavailable or incompatible profile;
- invalid model JSON;
- external API rate limit;
- source removed/paywalled;
- citation mismatch;
- Neo4j unavailable;
- SSE disconnected;
- run partially completed;
- permission denied;
- export failed;
- stale version conflict при редактировании эксперимента.

Каждая ошибка должна иметь:

- понятное описание;
- затронутую область;
- сохранённые partial results;
- retry/resolve action;
- technical details только в раскрываемой admin-панели.

## 14. Accessibility и responsive

- WCAG AA.
- Полная keyboard navigation.
- Видимый focus.
- Correct focus trap и возврат focus для modal/drawer.
- Escape закрывает overlay, если нет несохранённых данных.
- Charts имеют text/table alternative.
- Status не кодируется только цветом.
- Touch target минимум 44 px.
- prefers-reduced-motion.
- Zoom 200% без потери действий.

Breakpoints:

- desktop от 1200 px: полноценная 12-column grid;
- tablet 768–1199 px: 8 columns, drawers до 80% viewport;
- mobile до 767 px: stacked layout, bottom sheet вместо широкого drawer.

На mobile не пытаться показать graph или comparison matrix целиком: использовать simplified list/table и предложить desktop view для глубокого анализа.

## 15. Порядок реализации

### Phase 1. Foundation

App shell, пять routes, design tokens по референсу Норникеля, шрифты, base cards, overlays, i18n RU/EN/ZH, typed API, MSW.

### Phase 2. Проекты и Рабочая область

Projects page, create modal, brief drawer, uploads, ingestion state, tabs «Обзор/Данные/Память», source viewer.

### Phase 3. Исследование

Start controls, stage timeline, SSE/polling, activity feed, clarification drawer, collider funnel, candidate cards.

### Phase 4. Гипотезы

Portfolio, filters, Hypothesis Inspector, evidence, gates, Novelty Radar, disagreement, uncertainty, memory history.

### Phase 5. Сравнение и эксперименты

Comparison mode, experiment compiler/editor, versions, results, memory writeback preview, report export.

### Phase 6. Graph и advanced details

Neo4j overlay, scoped subgraph, node inspector, provenance navigation, lazy loading.

### Phase 7. QA и polish

Visual comparison with reference, responsive QA, accessibility, RU/EN/ZH, loading/empty/error/partial states, performance and Playwright.

После каждой phase приложение должно оставаться runnable. Не откладывать mocks и tests на самый конец.

## 16. Ключевые Playwright-сценарии

1. Создать проект → заполнить brief → загрузить файлы → запустить исследование.
2. Уйти со страницы running pipeline → вернуться → состояние восстановилось.
3. Получить blocking clarification → ответить → pipeline продолжился.
4. Получить non-blocking clarification → продолжить просмотр готовых artifacts.
5. Открыть candidate → пройти вкладки novelty/disagreement/uncertainty без смены route.
6. Открыть citation → перейти к точной странице/ячейке.
7. Просмотреть исключённую гипотезу и причину gate failure.
8. Сравнить 2–5 финалистов и изменить веса.
9. Скомпилировать эксперимент → отредактировать → сохранить новую версию.
10. Внести результат → проверить memory writeback preview.
11. Экспортировать отчёт.
12. Переключить RU/EN/中文 без потери проекта, route и drawer.
13. Проверить управление всеми overlays только клавиатурой.
14. Проверить mobile navigation и bottom sheets.
15. Пережить SSE disconnect и продолжить через polling.

## 17. Критерии готовности

UI готов, когда:

1. В приложении не более пяти основных routes.
2. Пользователь без инструкции понимает путь от проекта к эксперименту.
3. Brief, источники, память, graph, clarification, hypothesis details, novelty, disagreement, uncertainty, experiment editor, reports и settings доступны без дополнительных страниц.
4. Визуальный язык узнаваемо следует референсу: синий #0077C8/#004C97, белые и #F3F4F8 поверхности, Proxima Nova-подобный гротеск, крупные радиусы и круглые arrow controls.
5. Основной workflow не выглядит как чат.
6. Long-running pipeline можно покинуть и открыть снова.
7. Clarification появляется только по backend event и объясняет причину.
8. Все evidence ведут к provenance.
9. Novelty Radar показывает аналоги и ограничения поиска.
10. Карта разногласий не скрывает разброс оценок.
11. Неопределённость не выдаётся за вероятность истинности.
12. Experiment protocol редактируется, версионируется и экспортируется.
13. RU/EN/ZH работают на navigation, content, source viewer и reports.
14. Все экраны имеют loading, empty, error и partial states.
15. Typed aggregated projections позволяют frontend не выполнять каскад из десятков запросов.
16. Accessibility и ключевые Playwright flows проходят.
17. Нет горизонтального overflow на поддерживаемых breakpoints.

## 18. Итоговые deliverables

- Исходный код frontend.
- Пять основных routes.
- Design tokens/theme и documented visual rules.
- Reusable component library и overlays.
- RU/EN/ZH locale dictionaries.
- Typed OpenAPI client.
- MSW scenarios.
- Unit/component tests.
- Playwright E2E.
- Storybook или component showcase, если уместно.
- README: запуск, environment, mocks, backend integration, i18n, theming и visual reference.

Перед финальной сдачей сравни desktop screenshots ключевых экранов с визуальным референсом рядом: композиция, синие оттенки, фон, радиусы, типографика, воздух и controls. Затем отдельно проверь, что научные данные остаются читаемыми и не были принесены в жертву декоративному сходству.

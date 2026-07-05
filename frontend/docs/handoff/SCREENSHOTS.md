# NORLAB UI — индекс экранов

Снимки сделаны с текущей работающей сборки на `http://127.0.0.1:4173`. Они являются визуальной контрольной точкой перед подключением backend. При интеграции данные могут стать динамическими, но композицию, размеры, визуальную иерархию и поведение модальных окон следует сохранить.

## Глобальные состояния и проекты

| Файл | Что зафиксировано |
|---|---|
| [00-launch-splash.png](screenshots/00-launch-splash.png) | Стартовая заставка при полной загрузке приложения |
| [01-projects.png](screenshots/01-projects.png) | Портфель проектов, поиск, фильтры и карточки трёх проектов |
| [02-create-project-modal.png](screenshots/02-create-project-modal.png) | Шаг 1/3 мастера создания проекта |
| [03-project-switcher.png](screenshots/03-project-switcher.png) | Переключатель проектов в шапке |
| [04-settings-modal.png](screenshots/04-settings-modal.png) | Настройки и выбор языка |

## Рабочая область

| Файл | Что зафиксировано |
|---|---|
| [05-workspace-overview.png](screenshots/05-workspace-overview.png) | Обзор проекта: готовность, источники, brief, предупреждения, память |
| [06-workspace-data.png](screenshots/06-workspace-data.png) | Полный список данных и зона загрузки |
| [07-workspace-memory.png](screenshots/07-workspace-memory.png) | Вкладка «Память» и вход в граф |
| [08-brief-edit-modal.png](screenshots/08-brief-edit-modal.png) | Редактирование проблемы, цели и ограничений обычным текстом |
| [09-file-info.png](screenshots/09-file-info.png) | Сведения о файле, открывающиеся по умолчанию |
| [10-file-preview-pdf.png](screenshots/10-file-preview-pdf.png) | Предпросмотр PDF после явного нажатия кнопки |
| [11-knowledge-graph.png](screenshots/11-knowledge-graph.png) | Граф происхождения: источник → факт → гипотеза → эксперимент/риск |
| [25-warning-popover.png](screenshots/25-warning-popover.png) | Список предупреждений на уровне триггера |

## Исследование

| Файл | Что зафиксировано |
|---|---|
| [12-research-run.png](screenshots/12-research-run.png) | Прогон, ETA, этапы, события, восстановление, воронка и кандидаты |
| [13-research-clarification.png](screenshots/13-research-clarification.png) | Текстовый ответ на блокирующее уточнение |
| [14-ranking-settings.png](screenshots/14-ranking-settings.png) | Веса ранжирования, сумма 100%, ограничения и исключения |

## Гипотезы

| Файл | Что зафиксировано |
|---|---|
| [15-hypotheses-portfolio.png](screenshots/15-hypotheses-portfolio.png) | Карточки гипотез и визуальная иерархия главной идеи/механизма/условий |
| [16-hypotheses-comparison.png](screenshots/16-hypotheses-comparison.png) | Матрица сравнения гипотез |
| [17-new-hypothesis-modal.png](screenshots/17-new-hypothesis-modal.png) | Создание экспертной гипотезы |
| [18-hypothesis-filters.png](screenshots/18-hypothesis-filters.png) | Сортировка и клиентские фильтры |
| [19-hypothesis-detail.png](screenshots/19-hypothesis-detail.png) | Центральная карточка гипотезы, рейтинг, Gates и экспертный feedback |
| [20-hypothesis-evidence.png](screenshots/20-hypothesis-evidence.png) | Доказательная вкладка со ссылками на источники |
| [21-hypothesis-source-reader.png](screenshots/21-hypothesis-source-reader.png) | Чтение источника внутри сайта с переходом по страницам |

## Эксперименты и отчёт

| Файл | Что зафиксировано |
|---|---|
| [22-experiments-roadmap.png](screenshots/22-experiments-roadmap.png) | Roadmap с зависимостями, критическим путём и редактором эксперимента |
| [23-experiment-protocol.png](screenshots/23-experiment-protocol.png) | Подтверждение компиляции протокола |
| [24-report-export.png](screenshots/24-report-export.png) | Состав отчёта, формат, язык, готовность и отсутствующие поля |

## Минимальный визуальный regression-check

После подключения backend обязательно сравнить как минимум следующие пять файлов с новой сборкой:

1. `01-projects.png` — главный экран нельзя масштабировать или уплотнять.
2. `05-workspace-overview.png` — внутренние экраны намеренно крупнее главной страницы.
3. `12-research-run.png` — должны сохраниться ETA, состояние этапов и восстановление.
4. `15-hypotheses-portfolio.png` — не терять визуальную иерархию научного текста.
5. `22-experiments-roadmap.png` — сохранить зависимости и читаемость критического пути.

export const PROJECT_ID = 'kgmk-tailings'

export const projects = [
  { id: PROJECT_ID, title: 'Извлечение металлов из хвостов КГМК', area: 'Отвальные хвосты · Ni/Cu/PGM', readiness: 87, run: 'Сегодня, 08:47', finalists: 4, experiments: 12, tone: 'blue' },
  { id: 'nof-flotation', title: 'Селективная флотация НОФ', area: 'Цепь аппаратов · флотация', readiness: 72, run: 'Вчера, 15:36', finalists: 2, experiments: 7, tone: 'cyan' },
  { id: 'copper-recovery', title: 'Повышение извлечения меди', area: 'Металлургический передел · Cu', readiness: 48, run: '2 дня назад, 10:41', finalists: 1, experiments: 15, tone: 'violet' },
] as const

export type ProjectId = typeof projects[number]['id']

export const projectContexts: Record<ProjectId, {
  title: string
  subtitle: string
  filesReady: string
  dataHint: string
  problemText: string
  goalText: string
  criteriaText: string
  focus: string
  documents: readonly [string, string][]
}> = {
  [PROJECT_ID]: {
    title: 'Извлечение металлов из хвостов КГМК',
    subtitle: 'Фокус: отвальные хвосты, тонковкраплённые сульфиды Ni/Cu и PGM',
    filesReady: '14 файлов · готово',
    dataHint: 'PDF, Excel-история опытов и схемы цепей аппаратов готовы к анализу.',
    problemText: 'Низкое извлечение Ni, Cu и PGM из хвостов флотации КГМК приводит к потере ценных компонентов.',
    goalText: 'Сформировать проверяемые гипотезы для повышения извлечения из отвальных хвостов без промышленного синтеза и без ухода в нерелевантные направления.',
    criteriaText: 'Обосновывать каждую гипотезу через физику, химию, термодинамику и механику процесса; прирост извлечения — не менее 2 п.п.; энергетический рост — контролируемый.',
    focus: 'Отвальные хвосты · Ni/Cu/PGM',
    documents: [
      ['Хвосты_КГМК_характеристика.pdf', 'PDF · 2,4 МБ'],
      ['Минералогия_хвостов.xlsx', 'XLSX · 1,1 МБ'],
      ['Схема_цепи_аппаратов.png', 'PNG · 0,8 МБ'],
      ['Флотация_Ni_режимы.pdf', 'PDF · 3,7 МБ'],
      ['PGM_извлечение_обзор.pdf', 'PDF · 1,8 МБ'],
    ],
  },
  'nof-flotation': {
    title: 'Селективная флотация НОФ',
    subtitle: 'Фокус: цепь флотации, пирит, селективность и реагентный режим',
    filesReady: '9 файлов · готово',
    dataHint: 'Таблицы сменных режимов, PDF-регламенты и схема флотационной цепи готовы к анализу.',
    problemText: 'Потери никеля растут на участках селективной флотации при изменении глинистости и расхода депрессора.',
    goalText: 'Найти проверяемые изменения режима флотации, которые стабилизируют селективность без радикальной перестройки оборудования.',
    criteriaText: 'Гипотезы должны объяснять механизм взаимодействия минералов и реагентов; приоритет — реализуемость на текущей цепи аппаратов.',
    focus: 'Флотация · селективность',
    documents: [
      ['НОФ_режимы_флотации.xlsx', 'XLSX · 1,6 МБ'],
      ['Цепь_флотации_НОФ.png', 'PNG · 1,0 МБ'],
      ['Реагентный_режим.pdf', 'PDF · 2,1 МБ'],
      ['Пирит_селективность.pdf', 'PDF · 1,4 МБ'],
    ],
  },
  'copper-recovery': {
    title: 'Повышение извлечения меди',
    subtitle: 'Фокус: медный передел, хвосты, выщелачивание и подготовка сырья',
    filesReady: '11 файлов · частично готово',
    dataHint: 'Загружены лабораторные таблицы, отчёты по меди и изображения узлов подготовки сырья.',
    problemText: 'Извлечение меди нестабильно из-за разнородности хвостов и неполного раскрытия медьсодержащих фаз.',
    goalText: 'Собрать гипотезы по повышению извлечения меди, не уходя в промышленный синтез и не требуя недоступного оборудования.',
    criteriaText: 'Главный критерий — физико-химическое объяснение механизма и воспроизводимый лабораторный план проверки.',
    focus: 'Cu · металлургический передел',
    documents: [
      ['Медь_лабораторные_срезы.xlsx', 'XLSX · 1,3 МБ'],
      ['Узел_подготовки_сырья.jpg', 'JPG · 0,9 МБ'],
      ['Хвосты_Cu_минералогия.pdf', 'PDF · 2,6 МБ'],
      ['Выщелачивание_ограничения.pdf', 'PDF · 1,7 МБ'],
    ],
  },
}

export function getProjectContext(projectId?: string) {
  const safeId = projects.some((project) => project.id === projectId) ? projectId as ProjectId : PROJECT_ID
  return projectContexts[safeId]
}

export const documents = [
  ['Хвосты_КГМК_характеристика.pdf', 'PDF · 2,4 МБ'],
  ['Минералогия_хвостов.xlsx', 'XLSX · 1,1 МБ'],
  ['Флотация_Ni_режимы.pdf', 'PDF · 3,7 МБ'],
  ['Флотация_Cu_режимы.pdf', 'PDF · 2,9 МБ'],
  ['PGM_извлечение_обзор.pdf', 'PDF · 1,8 МБ'],
]

export const hypotheses = [
  { id: 'H-12', claim: 'Поэтапное доизмельчение повысит извлечение Ni и Cu', family: 'Гранулометрия', novelty: 'Новая', uncertainty: 'Средняя', disagreement: 'Высокое', kpi: '+2,4 п.п.', weak: 'Энергия', scores: [5, 4, 4, 5] },
  { id: 'H-07', claim: 'Селективная флотация пирита снизит потери Ni', family: 'Реагенты', novelty: 'Умеренно новая', uncertainty: 'Средняя', disagreement: 'Среднее', kpi: '+1,6 п.п.', weak: 'Селективность', scores: [4, 4, 4, 4] },
  { id: 'H-03', claim: 'Кондиционирование укрепит агломераты', family: 'Агломерация', novelty: 'Известная', uncertainty: 'Низкая', disagreement: 'Низкое', kpi: '+0,9 п.п.', weak: 'Вода', scores: [4, 3, 3, 4] },
]

export const experiments = [
  { id: 'EXP-12-01', title: 'Лабораторный цикл доизмельчения', status: 'Готов', kpi: 'Извлечение Ni, %', duration: '5 дней', cost: 'Средняя', safety: 'Низкий', next: 'Протокол', version: 'v3' },
  { id: 'EXP-12-02', title: 'Оптимизация крупности P80', status: 'Черновик', kpi: 'Извлечение Cu, %', duration: '7 дней', cost: 'Высокая', safety: 'Низкий', next: 'План', version: 'v2' },
  { id: 'EXP-12-03', title: 'Контрольный флотационный тест', status: 'Ждёт результаты', kpi: 'Содержание TFe', duration: '4 дня', cost: 'Средняя', safety: 'Средний', next: 'Результаты', version: 'v1' },
]

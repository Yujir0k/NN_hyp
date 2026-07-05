import type { ExperimentDto, HypothesisDto, ProjectDto, ProjectFileDto, ProjectSummaryDto, ResearchRunDto } from './contracts'

export type ProjectRow = {
  id: string
  title: string
  area: string
  readiness: number
  run: string
  finalists: number
  experiments: number
  tone: 'blue' | 'cyan' | 'violet'
  status: ProjectSummaryDto['status']
}

const tones: ProjectRow['tone'][] = ['blue', 'cyan', 'violet']

export function projectRowFromDto(project: ProjectSummaryDto, index: number): ProjectRow {
  return {
    id: project.id,
    title: project.name,
    area: project.area,
    readiness: project.readiness,
    run: project.last_run_at ? new Date(project.last_run_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Нет прогонов',
    finalists: project.finalists,
    experiments: project.open_experiments,
    tone: tones[index % tones.length],
    status: project.status,
  }
}

export function projectContextFromDto(project: ProjectDto, files: ProjectFileDto[] = []) {
  return {
    title: project.name,
    subtitle: `Фокус: ${project.focus}`,
    filesReady: `${project.indexed_files} файлов · ${project.partial ? 'частично' : 'готово'}`,
    dataHint: files.length ? 'Исходные файлы готовы к анализу и предпросмотру.' : 'Добавьте PDF, таблицы или схемы для анализа.',
    problemText: project.brief.problem,
    goalText: project.brief.goal,
    criteriaText: [project.brief.constraints, project.brief.success_criterion].filter(Boolean).join('; '),
    focus: project.focus,
    documents: files.map((file) => [file.name, fileMeta(file)] as [string, string]),
  }
}

export function fileMeta(file: ProjectFileDto) {
  const size = file.size_bytes < 1024 * 1024 ? `${Math.max(1, Math.round(file.size_bytes / 1024))} КБ` : `${(file.size_bytes / (1024 * 1024)).toFixed(1)} МБ`
  return `${file.kind.toUpperCase()} · ${size}`
}

export function hypothesisFromDto(item: HypothesisDto) {
  const hasNumericKpi = Number.isFinite(item.kpi_delta) && Math.abs(item.kpi_delta) > 0.05
  const kpiValue = hasNumericKpi ? `${item.kpi_delta > 0 ? '+' : ''}${String(item.kpi_delta).replace('.', ',')} п.п.` : item.kpi_label
  return {
    id: item.id,
    claim: item.claim,
    statement: item.statement || item.claim,
    family: item.family,
    status: item.status,
    novelty: item.novelty === 'novel' ? 'Новая' : item.novelty === 'moderately_novel' ? 'Умеренно новая' : 'Известная',
    uncertainty: item.uncertainty === 'high' ? 'Высокая' : item.uncertainty === 'medium' ? 'Средняя' : 'Низкая',
    disagreement: item.disagreement === 'high' ? 'Высокое' : item.disagreement === 'medium' ? 'Среднее' : 'Низкое',
    kpi: kpiValue,
    rating: item.scores.integral,
    weak: item.risk_label,
    scores: [item.scores.science, item.scores.engineering, item.scores.mechanism, item.scores.testability],
    dto: item,
  }
}

export type HypothesisView = ReturnType<typeof hypothesisFromDto>

export function experimentFromDto(item: ExperimentDto) {
  return {
    id: item.id,
    title: item.title,
    status: item.status === 'ready' ? 'Готов' : item.status === 'draft' ? 'Черновик' : item.status === 'waiting_results' ? 'Ждёт результаты' : 'Готов',
    kpi: item.kpi,
    duration: `${item.duration_days} дней`,
    cost: 'Средняя',
    safety: 'Низкий',
    next: item.result_file_ids.length ? 'Результаты' : 'Протокол',
    version: item.current_revision,
    dto: item,
  }
}

export function runStageIndex(run?: ResearchRunDto) {
  const order: ResearchRunDto['stage'][] = ['memory', 'generation', 'deduplication', 'gates', 'critique', 'final']
  return Math.max(0, order.indexOf(run?.stage ?? 'memory'))
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null) return '—'
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

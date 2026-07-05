import type {
  BriefDto,
  ClarificationDto,
  CreateProjectInput,
  ExpertFeedbackDto,
  ExperimentDto,
  ExportJobDto,
  HypothesisDto,
  HypothesisFilters,
  KnowledgeGraphDto,
  Paged,
  ProjectDto,
  ProjectFileDto,
  ProjectWarningDto,
  ProjectSummaryDto,
  RankingProfileDto,
  ReportExportRequest,
  ResearchRunDto,
} from './contracts'

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  if (!response.ok) throw new Error(`NORLAB API ${response.status}`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function json<T>(path: string, method: 'POST' | 'PATCH' | 'PUT', body: unknown) {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value) })
  const query = params.toString()
  return query ? `?${query}` : ''
}

function projectPath(projectId: string) {
  return `/projects/${encodeURIComponent(projectId)}`
}

export const api = {
  projects: () => request<ProjectSummaryDto[]>('/projects'),
  project: (projectId: string) => request<ProjectDto>(projectPath(projectId)),
  createProject: ({ files, ...fields }: CreateProjectInput) => {
    const form = new FormData()
    Object.entries(fields).forEach(([key, value]) => form.append(key, value))
    files.forEach((file) => form.append('files', file, file.name))
    return request<ProjectDto>('/projects', { method: 'POST', body: form })
  },
  updateBrief: (projectId: string, brief: BriefDto) => json<ProjectDto>(`${projectPath(projectId)}/brief`, 'PUT', brief),
  warnings: (projectId: string) => request<ProjectWarningDto[]>(`${projectPath(projectId)}/warnings`),
  files: (projectId: string) => request<ProjectFileDto[]>(`${projectPath(projectId)}/files`),
  uploadFiles: (projectId: string, files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('files', file, file.name))
    return request<ProjectFileDto[]>(`${projectPath(projectId)}/files`, { method: 'POST', body: form })
  },
  file: (fileId: string) => request<ProjectFileDto>(`/files/${encodeURIComponent(fileId)}`),
  deleteFile: (projectId: string, fileId: string) => request<void>(`${projectPath(projectId)}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE' }),
  fileDownloadUrl: (fileId: string) => `${API_BASE}/files/${encodeURIComponent(fileId)}/content`,
  filePreviewUrl: (fileId: string, page?: number) => `${API_BASE}/files/${encodeURIComponent(fileId)}/preview${page ? `?page=${page}` : ''}`,
  graph: (projectId: string) => request<KnowledgeGraphDto>(`${projectPath(projectId)}/knowledge-graph`),
  startRun: (projectId: string, useLlm = true) => json<ResearchRunDto>(`${projectPath(projectId)}/runs`, 'POST', { use_llm: useLlm, candidate_count: 12, max_finalists: 12 }),
  run: (projectId: string, runId: string) => request<ResearchRunDto>(`${projectPath(projectId)}/runs/${encodeURIComponent(runId)}`),
  runEventsUrl: (projectId: string, runId: string) => `${API_BASE}${projectPath(projectId)}/runs/${encodeURIComponent(runId)}/events`,
  pauseRun: (projectId: string, runId: string) => json<ResearchRunDto>(`${projectPath(projectId)}/runs/${encodeURIComponent(runId)}/pause`, 'POST', {}),
  resumeRun: (projectId: string, runId: string) => json<ResearchRunDto>(`${projectPath(projectId)}/runs/${encodeURIComponent(runId)}/resume`, 'POST', {}),
  recoverRun: (projectId: string, runId: string) => json<ResearchRunDto>(`${projectPath(projectId)}/runs/${encodeURIComponent(runId)}/recover`, 'POST', {}),
  answerClarification: (projectId: string, runId: string, clarificationId: string, answer: Pick<ClarificationDto, 'answer' | 'comment'>) =>
    json<ResearchRunDto>(`${projectPath(projectId)}/runs/${encodeURIComponent(runId)}/clarifications/${encodeURIComponent(clarificationId)}`, 'POST', answer),
  rankingProfile: (projectId: string, profile: RankingProfileDto) => json<RankingProfileDto>(`${projectPath(projectId)}/ranking-profile`, 'PUT', profile),
  hypotheses: (projectId: string, filters: HypothesisFilters = {}) => request<Paged<HypothesisDto>>(`${projectPath(projectId)}/hypotheses${queryString(filters)}`),
  hypothesis: (projectId: string, hypothesisId: string) => request<HypothesisDto>(`${projectPath(projectId)}/hypotheses/${encodeURIComponent(hypothesisId)}`),
  createHypothesis: (projectId: string, input: Pick<HypothesisDto, 'claim' | 'family' | 'kpi_label'>) => json<HypothesisDto>(`${projectPath(projectId)}/hypotheses`, 'POST', input),
  saveFeedback: (projectId: string, hypothesisId: string, feedback: ExpertFeedbackDto) => json<HypothesisDto>(`${projectPath(projectId)}/hypotheses/${encodeURIComponent(hypothesisId)}/feedback`, 'POST', feedback),
  experiments: (projectId: string) => request<ExperimentDto[]>(`${projectPath(projectId)}/experiments`),
  createExperiment: (projectId: string, hypothesisId: string) => json<ExperimentDto>(`${projectPath(projectId)}/experiments`, 'POST', { hypothesis_id: hypothesisId }),
  updateExperiment: (projectId: string, experimentId: string, patch: Partial<ExperimentDto>) => json<ExperimentDto>(`${projectPath(projectId)}/experiments/${encodeURIComponent(experimentId)}`, 'PATCH', patch),
  uploadExperimentResult: (projectId: string, experimentId: string, file: File) => {
    const form = new FormData()
    form.append('file', file, file.name)
    return request<ExperimentDto>(`${projectPath(projectId)}/experiments/${encodeURIComponent(experimentId)}/results`, { method: 'POST', body: form })
  },
  compileProtocol: (projectId: string, experimentId: string) => json<ExperimentDto>(`${projectPath(projectId)}/experiments/${encodeURIComponent(experimentId)}/compile`, 'POST', {}),
  exportReport: (projectId: string, input: ReportExportRequest) => json<ExportJobDto>(`${projectPath(projectId)}/exports`, 'POST', input),
  exportJob: (jobId: string) => request<ExportJobDto>(`/exports/${encodeURIComponent(jobId)}`),
}

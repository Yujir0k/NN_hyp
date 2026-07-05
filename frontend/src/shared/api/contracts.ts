export type Locale = 'ru' | 'en' | 'zh-CN'

export type ProjectionMeta = {
  id: string
  version: number
  updated_at: string
  capabilities: string[]
  warnings: string[]
  partial: boolean
}

export type ProjectSummaryDto = ProjectionMeta & {
  name: string
  area: string
  readiness: number
  last_run_at: string | null
  finalists: number
  open_experiments: number
  status: 'active' | 'attention' | 'archived'
}

export type BriefDto = {
  problem: string
  goal: string
  constraints: string
  success_criterion: string
  domain: 'tailings_and_metallurgy'
}

export type ProjectDto = ProjectionMeta & {
  name: string
  focus: string
  readiness: number
  brief: BriefDto
  indexed_files: number
  memory_matches: number
}

export type ProjectFileKind = 'pdf' | 'docx' | 'spreadsheet' | 'image' | 'text' | 'unknown'
export type ProjectFileStatus = 'uploaded' | 'parsing' | 'ready' | 'warning' | 'failed'

export type ProjectFileDto = ProjectionMeta & {
  project_id: string
  name: string
  mime_type: string
  kind: ProjectFileKind
  size_bytes: number
  status: ProjectFileStatus
  pages: number | null
  language: Locale | null
  preview_capability: 'native' | 'extracted_text' | 'table' | 'image' | 'download_only'
  download_url: string
  preview_url: string | null
}

export type ProjectWarningDto = {
  id: string
  code: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'blocking'
  related_file_ids: string[]
  resolved: boolean
}

export type KnowledgeNodeType = 'source' | 'fact' | 'hypothesis' | 'experiment' | 'risk'

export type KnowledgeNodeDto = {
  id: string
  type: KnowledgeNodeType
  label: string
  meta: string
  description: string
  confidence: number | null
  source_file_id: string | null
  source_page: number | null
}

export type KnowledgeEdgeDto = {
  id: string
  from: string
  to: string
  relation: 'extracted_from' | 'recognised_from' | 'supports' | 'makes_feasible' | 'validated_by' | 'limited_by'
  weight: number
  reason: string
}

export type KnowledgeGraphDto = ProjectionMeta & {
  project_id: string
  nodes: KnowledgeNodeDto[]
  edges: KnowledgeEdgeDto[]
}

export type RankingProfileDto = {
  novelty: number
  feasibility: number
  physicochemical_mechanism: number
  low_risk: number
  excluded_directions: string
  domain_constraints: string
}

export type ResearchStage = 'memory' | 'generation' | 'deduplication' | 'gates' | 'critique' | 'final'
export type ResearchRunStatus = 'queued' | 'running' | 'waiting_for_input' | 'paused' | 'failed' | 'completed'

export type ResearchEventDto = {
  id: string
  created_at: string
  stage: ResearchStage
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
}

export type ResearchRejectionDto = {
  stage: 'generation' | 'deduplication' | 'gates' | 'critic' | 'critique'
  title: string | null
  supporting_evidence: string[]
  reasons: string[]
}

export type ClarificationDto = {
  id: string
  title: string
  question: string
  blocking: boolean
  answer: string | null
  comment: string | null
}

export type ResearchRunDto = ProjectionMeta & {
  project_id: string
  status: ResearchRunStatus
  stage: ResearchStage
  started_at: string | null
  elapsed_seconds: number
  eta_seconds: number | null
  funnel: { requested?: number; generated: number; accepted?: number; unique: number; gates: number; critique: number; finalists: number }
  events: ResearchEventDto[]
  rejections: ResearchRejectionDto[]
  clarification: ClarificationDto | null
  ranking_profile: RankingProfileDto
}

export type HypothesisScoresDto = {
  science: number
  engineering: number
  mechanism: number
  testability: number
  integral: number
}

export type EvidenceDto = {
  id: string
  source_file_id: string
  file_name: string
  page: number | null
  paragraph: number | null
  quote: string
  claim: string
  strength: 'weak' | 'medium' | 'strong'
}

export type HypothesisDto = ProjectionMeta & {
  project_id: string
  run_id: string | null
  claim: string
  statement: string
  family: string
  status: 'draft' | 'candidate' | 'finalist' | 'rejected'
  novelty: 'known' | 'moderately_novel' | 'novel'
  uncertainty: 'low' | 'medium' | 'high'
  disagreement: 'low' | 'medium' | 'high'
  kpi_label: string
  kpi_delta: number
  risk_label: string
  economic_effect: string
  mechanism: string
  key_condition: string
  first_check: string
  scores: HypothesisScoresDto
  evidence: EvidenceDto[]
  gates: Array<{ code: string; title: string; passed: boolean; reason: string }>
}

export type HypothesisFilters = {
  sort?: 'rating' | 'kpi' | 'id'
  risk?: string
  novelty?: string
  status?: string
}

export type ExpertFeedbackDto = {
  verdict: 'useful' | 'revise'
  reason: string
  comment: string
}

export type RoadmapNodeDto = {
  id: string
  title: string
  duration_days: number
  depends_on: string[]
  critical: boolean
  status: 'queued' | 'active' | 'done' | 'blocked'
}

export type ExperimentDto = ProjectionMeta & {
  project_id: string
  hypothesis_id: string
  title: string
  status: 'draft' | 'ready' | 'running' | 'waiting_results' | 'completed'
  current_revision: string
  kpi: string
  target: string
  duration_days: number
  goal: string
  parameters: Record<string, string | number | boolean | null>
  result_file_ids: string[]
  roadmap: RoadmapNodeDto[]
}

export type ReportExportRequest = {
  sections: Array<'summary' | 'evidence' | 'hypotheses' | 'protocols' | 'source_files'>
  format: 'PDF' | 'DOCX' | 'CSV' | 'JSON' | 'JIRA_API'
  locale: Locale
}

export type ExportJobDto = {
  id: string
  status: 'queued' | 'running' | 'ready' | 'failed'
  progress: number
  download_url: string | null
  missing_fields: string[]
  error: string | null
}

export type Paged<T> = {
  items: T[]
  total: number
  next_cursor: string | null
}

export type CreateProjectInput = {
  task: string
  result: string
  area: string
  success: string
  constraints: string
  files: File[]
}

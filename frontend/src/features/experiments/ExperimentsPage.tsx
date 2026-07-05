import { useEffect, useState } from 'react'
import { ArrowRight, Beaker, CheckCircle2, FileOutput, GitBranch, Save, UploadCloud } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROJECT_ID } from '../../shared/lib/data'
import { Button, Status } from '../../shared/ui/Primitives'
import { Overlay } from '../../shared/ui/Overlay'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { experimentFromDto, projectContextFromDto } from '../../shared/api/viewModels'

const copy = {
  ru: {
    subtitle: 'H-12 · доизмельчение',
    selected: 'выбрана для протокола',
    experiments: 'Эксперименты',
    report: 'Отчёт',
    roadmap: 'Roadmap проверки',
    roadmapHint: 'Последовательность действий: что сделать, сколько это займёт и от какого шага зависит.',
    criticalPath: 'Критический путь',
    criticalStep: 'Критический шаг',
    dependency: 'Зависит от',
    duration: 'Длительность',
    all: 'Все',
    owner: 'Ответственный',
    goal: 'Цель',
    parameters: 'Параметры',
    results: 'Результаты',
    kpi: 'KPI',
    target: 'Цель',
    mainParams: 'Основные параметры',
    material: 'Материал',
    mass: 'Масса, кг',
    effect: 'Ожидаемый эффект',
    uploadResult: 'Загрузить результат',
    noResults: 'Результаты ещё не загружены',
    saved: 'Сохранено 09:28',
    changed: 'Есть изменения',
    protocolTitle: 'Протокол готов',
    protocolText: 'Собран черновик протокола EXP-12-01. Его можно передать в лабораторию или экспортировать позже.',
    close: 'Закрыть',
    exportPdf: 'Экспорт PDF',
    reportReady: 'Можно экспортировать',
    reportHint: 'Недостающие поля будут отмечены.',
    sections: ['Резюме', 'Доказательства', 'Гипотезы', 'Протоколы', 'Исходные файлы'],
    language: 'Язык',
    missing: '4 поля не заполнены',
    exportFormat: 'Формат и интеграция',
    exportAction: 'Экспорт',
    workflow: ['Гипотеза выбрана', 'План проверки', 'Протокол эксперимента'],
    parallel: 'Параллельная проверка',
    afterR2: 'Запускается после R2',
    beforeR5: 'Результат нужен до R5',
    selectExperiment: 'Выберите эксперимент',
    configureProtocol: 'Настройте протокол',
    experimentHint: 'Карточки слева — варианты проверки H-12. Справа редактируется выбранный протокол.',
  },
  en: {
    subtitle: 'H-12 · regrinding',
    selected: 'selected for protocol',
    experiments: 'Experiments',
    report: 'Report',
    roadmap: 'Validation roadmap',
    roadmapHint: 'A clear checklist with the action, duration and dependency for every validation step.',
    criticalPath: 'Critical path',
    criticalStep: 'Critical step',
    dependency: 'Depends on',
    duration: 'Duration',
    all: 'All',
    owner: 'Owner',
    goal: 'Goal',
    parameters: 'Parameters',
    results: 'Results',
    kpi: 'KPI',
    target: 'Target',
    mainParams: 'Core parameters',
    material: 'Material',
    mass: 'Mass, kg',
    effect: 'Expected effect',
    uploadResult: 'Upload result',
    noResults: 'No results uploaded yet',
    saved: 'Saved 09:28',
    changed: 'Unsaved changes',
    protocolTitle: 'Protocol ready',
    protocolText: 'Draft protocol EXP-12-01 is compiled. It can be sent to the lab or exported later.',
    close: 'Close',
    exportPdf: 'Export PDF',
    reportReady: 'Ready to export',
    reportHint: 'Missing fields will be marked.',
    sections: ['Summary', 'Evidence', 'Hypotheses', 'Protocols', 'Source files'],
    language: 'Language',
    missing: '4 fields are missing',
    exportFormat: 'Format and integration',
    exportAction: 'Export',
    workflow: ['Hypothesis selected', 'Validation plan', 'Experiment protocol'],
    parallel: 'Parallel validation',
    afterR2: 'Starts after R2',
    beforeR5: 'Result required before R5',
    selectExperiment: 'Select an experiment',
    configureProtocol: 'Configure the protocol',
    experimentHint: 'Cards on the left are H-12 validation options. The selected protocol is edited on the right.',
  },
  'zh-CN': {
    subtitle: 'H-12 · 再磨',
    selected: '已选择用于方案',
    experiments: '实验',
    report: '报告',
    roadmap: '验证路线图',
    roadmapHint: '以清单形式展示每个验证步骤、持续时间和依赖关系。',
    criticalPath: '关键路径',
    criticalStep: '关键步骤',
    dependency: '依赖',
    duration: '持续时间',
    all: '全部',
    owner: '负责人',
    goal: '目标',
    parameters: '参数',
    results: '结果',
    kpi: 'KPI',
    target: '目标',
    mainParams: '主要参数',
    material: '物料',
    mass: '质量, kg',
    effect: '预期效果',
    uploadResult: '上传结果',
    noResults: '尚未上传结果',
    saved: '已保存 09:28',
    changed: '有未保存更改',
    protocolTitle: '方案已生成',
    protocolText: '已生成 EXP-12-01 方案草稿，可发送至实验室或稍后导出。',
    close: '关闭',
    exportPdf: '导出 PDF',
    reportReady: '可以导出',
    reportHint: '缺失字段会被标记。',
    sections: ['摘要', '证据', '假设', '方案', '源文件'],
    language: '语言',
    missing: '4 个字段缺失',
    exportFormat: '格式和集成',
    exportAction: '导出',
    workflow: ['已选择假设', '验证计划', '实验方案'],
    parallel: '并行验证',
    afterR2: '在 R2 后启动',
    beforeR5: 'R5 前需要结果',
    selectExperiment: '选择实验',
    configureProtocol: '配置方案',
    experimentHint: '左侧卡片是 H-12 的验证方案，右侧用于编辑所选实验方案。',
  },
} as const

type RoadmapNode = {
  id: string
  title: string
  duration: string
  depends: string
  critical: boolean
}

function compactHypothesisId(id: string) {
  if (!id.startsWith('hyp_')) return id
  return `H-${id.slice(4, 10).toUpperCase()}`
}

function RoadmapListItem({ node, selected, onSelect, dependencyLabel, criticalLabel }: { node: RoadmapNode; selected: boolean; onSelect: (id: string) => void; dependencyLabel: string; criticalLabel: string }) {
  return <li className={`${node.critical ? 'is-critical' : ''} ${selected ? 'is-selected' : ''}`}>
    <button onClick={() => onSelect(node.id)}>
      <span className="roadmap-list__index">{node.id}</span>
      <span className="roadmap-list__content">
        <span className="roadmap-list__meta">{node.critical ? criticalLabel : dependencyLabel}</span>
        <strong>{node.title}</strong>
        <small>{dependencyLabel}: {node.depends}</small>
      </span>
      <span className="roadmap-list__duration">{node.duration}</span>
      <ArrowRight className="roadmap-list__arrow" />
    </button>
  </li>
}

export default function ExperimentsPage() {
  const { t, i18n } = useTranslation()
  const ui = copy[(i18n.language as keyof typeof copy)] ?? copy.ru
  const { projectId } = useParams()
  const [params, setParams] = useSearchParams()
  const activeProjectId = projectId ?? PROJECT_ID
  const queryClient = useQueryClient()
  const projectQuery = useQuery({ queryKey: ['project', activeProjectId, i18n.language], queryFn: () => api.project(activeProjectId), enabled: Boolean(activeProjectId) })
  const experimentsQuery = useQuery({ queryKey: ['experiments', activeProjectId, i18n.language], queryFn: () => api.experiments(activeProjectId), enabled: Boolean(activeProjectId) })
  const hypothesesQuery = useQuery({ queryKey: ['hypotheses', activeProjectId, 'experiments-picker', i18n.language], queryFn: () => api.hypotheses(activeProjectId, { sort: 'rating' }), enabled: Boolean(activeProjectId) })
  const experiments = (experimentsQuery.data ?? []).map(experimentFromDto)
  const hypotheses = hypothesesQuery.data?.items ?? []
  const requestedHypothesisId = params.get('hypothesis')
  const context = projectQuery.data ? projectContextFromDto(projectQuery.data) : null
  const [selectedId, setSelectedId] = useState('')
  const selected = experiments.find((item) => item.dto.hypothesis_id === requestedHypothesisId) ?? experiments.find((item) => item.id === selectedId) ?? experiments[0]
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('R3')
  const [reportOpen, setReportOpen] = useState(false)
  const [protocolOpen, setProtocolOpen] = useState(false)
  const [saved, setSaved] = useState(true)
  const [editorTab, setEditorTab] = useState<'goal' | 'parameters' | 'results'>('goal')
  const [resultFile, setResultFile] = useState('')
  const [exportFormat, setExportFormat] = useState('PDF')
  const roadmapNodes = selected?.dto.roadmap.map((node) => ({ id: node.id, title: node.title, duration: `${node.duration_days} дня`, depends: node.depends_on.join(' + ') || 'Старт', critical: node.critical })) ?? []
  const selectedRoadmap = roadmapNodes.find((node) => node.id === selectedRoadmapId) ?? roadmapNodes[0]
  const criticalDays = roadmapNodes.filter((node) => node.critical).reduce((sum, node) => sum + Number.parseInt(node.duration, 10), 0)
  const updateExperiment = useMutation({
    mutationFn: () => api.updateExperiment(activeProjectId, selected.id, { goal: selected.title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['experiments', activeProjectId] })
    },
  })
  const compileProtocol = useMutation({
    mutationFn: () => api.compileProtocol(activeProjectId, selected.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['experiments', activeProjectId] })
    },
  })
  const uploadResult = useMutation({
    mutationFn: (file: File) => api.uploadExperimentResult(activeProjectId, selected.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['experiments', activeProjectId] })
    },
  })
  const exportReport = useMutation({ mutationFn: () => api.exportReport(activeProjectId, { sections: ['summary', 'evidence', 'hypotheses', 'protocols'], format: exportFormat === 'Jira / API' ? 'JIRA_API' : exportFormat as 'PDF' | 'DOCX' | 'CSV' | 'JSON', locale: i18n.language as 'ru' | 'en' | 'zh-CN' }) })
  const createExperiment = useMutation({
    mutationFn: (hypothesisId: string) => api.createExperiment(activeProjectId, hypothesisId),
    onSuccess: async (experiment) => {
      await queryClient.invalidateQueries({ queryKey: ['experiments', activeProjectId] })
      setSelectedId(experiment.id)
      const next = new URLSearchParams(params)
      next.set('hypothesis', experiment.hypothesis_id)
      setParams(next, { replace: true })
    },
  })

  useEffect(() => {
    if (requestedHypothesisId) {
      const experiment = experiments.find((item) => item.dto.hypothesis_id === requestedHypothesisId)
      if (experiment && experiment.id !== selectedId) setSelectedId(experiment.id)
      return
    }
    if (!selectedId && selected?.id) setSelectedId(selected.id)
  }, [experiments, requestedHypothesisId, selected?.id, selectedId])

  function updateHypothesisParam(hypothesisId: string) {
    const next = new URLSearchParams(params)
    if (hypothesisId) next.set('hypothesis', hypothesisId)
    else next.delete('hypothesis')
    setParams(next, { replace: true })
  }

  function selectExperiment(item: typeof experiments[number]) {
    setSelectedId(item.id)
    updateHypothesisParam(item.dto.hypothesis_id)
  }

  function selectHypothesis(hypothesisId: string) {
    if (!hypothesisId) return
    const existing = experiments.find((item) => item.dto.hypothesis_id === hypothesisId)
    if (existing) {
      selectExperiment(existing)
      return
    }
    createExperiment.mutate(hypothesisId)
  }

  if (experimentsQuery.isLoading) return <div className="page experiments-page"><div className="tab-focus"><h2>Загрузка экспериментов…</h2><p>Получаем roadmap и revisions.</p></div></div>
  if (experimentsQuery.isError || !experiments.length || !selected) return <div className="page experiments-page"><div className="tab-focus"><h2>Эксперименты ещё не готовы</h2><p>Сначала завершите исследовательский прогон или создайте эксперимент из гипотезы.</p></div></div>

  return <div className="page experiments-page">
    <header className="page-heading">
      <div><h1>{t('experiments.title')}</h1><p>{context?.focus ?? 'Проект'} · {ui.subtitle}</p></div>
      <div className="page-heading__actions"><Button variant="primary" onClick={() => { compileProtocol.mutate(); setProtocolOpen(true) }}><Beaker />{t('experiments.compile')}</Button></div>
    </header>

    <section className="selected-hypothesis selected-hypothesis--compact"><Beaker /><span><strong>{compactHypothesisId(selected.dto.hypothesis_id)}</strong><small>{ui.selected}</small></span><ArrowRight /></section>

    <section className="experiment-hypothesis-picker">
      <label>
        <span>Гипотеза для протокола</span>
        <select value={selected.dto.hypothesis_id} onChange={(event) => selectHypothesis(event.target.value)} disabled={createExperiment.isPending}>
          {hypotheses.map((hypothesis) => <option key={hypothesis.id} value={hypothesis.id}>{compactHypothesisId(hypothesis.id)} · {hypothesis.claim}</option>)}
          {!hypotheses.some((hypothesis) => hypothesis.id === selected.dto.hypothesis_id) ? <option value={selected.dto.hypothesis_id}>{compactHypothesisId(selected.dto.hypothesis_id)}</option> : null}
        </select>
      </label>
      <Status tone={createExperiment.isPending ? 'info' : 'success'}>{createExperiment.isPending ? 'Собираем протокол…' : 'Связано с выбранной гипотезой'}</Status>
    </section>

    <div className="experiment-workflow" aria-label="Experiment workflow">{ui.workflow.map((step, index) => <div className={index < 2 ? 'is-done' : 'is-active'} key={step}><span>{index < 2 ? <CheckCircle2 /> : index + 1}</span><strong>{step}</strong>{index < ui.workflow.length - 1 ? <ArrowRight /> : null}</div>)}</div>

    <section className="roadmap-builder">
      <header><div><h2>{ui.roadmap}</h2><p>{ui.roadmapHint}</p></div><Status tone="info">{ui.criticalPath}: {criticalDays || '—'} дней</Status></header>
      {roadmapNodes.length ? <ol className="roadmap-list" aria-label={ui.roadmap}>
        {roadmapNodes.map((node) => <RoadmapListItem key={node.id} node={node} selected={selectedRoadmap?.id === node.id} onSelect={setSelectedRoadmapId} dependencyLabel={ui.dependency} criticalLabel={ui.criticalStep} />)}
      </ol> : <div className="file-preview-state"><GitBranch /><strong>Roadmap не получен от backend</strong></div>}
    </section>

    <div className="experiment-workbench-intro"><h2>{ui.experiments}</h2><p>{ui.experimentHint}</p></div>
    <div className="experiment-layout">
      <section className="experiment-list">
        <header className="experiment-pane-heading"><div><span>1</span><div><small>{ui.selectExperiment}</small><h3>{t('experiments.active')}</h3></div></div><button onClick={() => setReportOpen(true)}><small>{ui.report}</small><strong>68%</strong><ArrowRight /></button></header>
        {experiments.map((item) => <article key={item.id} role="button" tabIndex={0} aria-label={`${item.id}: ${item.title}`} className={selected.id === item.id ? 'is-selected' : ''} onClick={() => selectExperiment(item)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectExperiment(item) } }}>
          <div className="experiment-title"><span className="experiment-icon"><Beaker /></span><span><h2>{item.title}</h2><small>{item.id} · {item.version}</small></span><Status tone={item.status === 'Готов' ? 'success' : item.status === 'Черновик' ? 'info' : 'warning'}>{item.status}</Status><ArrowRight /></div>
          <div className="experiment-chips"><span><small>KPI</small>{item.kpi}</span><span><small>{ui.duration}</small>{item.duration}</span><span><small>{ui.results}</small>{item.next}</span></div>
        </article>)}
      </section>

      <section className="experiment-editor experiment-editor--compact" key={selected.id}>
        <header><div className="experiment-editor-title"><span>2</span><div><small>{ui.configureProtocol}</small><h2>{selected.title}</h2><Status tone={selected.status === 'Готов' ? 'success' : 'info'}>{selected.status}</Status></div></div><select value={selected.version} onChange={() => setSaved(false)} aria-label="Версия"><option>{selected.version}</option><option>v2</option><option>v1</option></select></header>
        <div className="editor-tabs editor-tabs--compact">{[['goal', ui.goal], ['parameters', ui.parameters], ['results', ui.results]].map(([value, label]) => <button key={value} aria-pressed={editorTab === value} className={editorTab === value ? 'is-active' : ''} onClick={() => setEditorTab(value as typeof editorTab)}>{label}</button>)}</div>
        <div className="editor-form editor-form--compact">
          {editorTab === 'goal' ? <>
            <label>{ui.goal}<textarea defaultValue="Оценить влияние доизмельчения на извлечение Ni." onChange={() => setSaved(false)} /></label>
            <div><label>{ui.kpi}<input defaultValue={selected.kpi} onChange={() => setSaved(false)} /></label><label>{ui.target}<input defaultValue="≥ 82" onChange={() => setSaved(false)} /></label></div>
          </> : editorTab === 'parameters' ? <>
            <details open><summary>{ui.mainParams}</summary><div><label>{ui.material}<input defaultValue="Сульфидная фракция хвостов" onChange={() => setSaved(false)} /></label><label>{ui.mass}<input defaultValue="10.0" onChange={() => setSaved(false)} /></label></div></details>
            <details><summary>{ui.effect}</summary><textarea defaultValue="Прирост извлечения Ni не менее 3 п.п. при сохранении селективности." onChange={() => setSaved(false)} /></details>
          </> : <>
            <div className="result-upload"><UploadCloud /><strong>{resultFile || ui.noResults}</strong><label>{ui.uploadResult}<input type="file" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setResultFile(file.name); uploadResult.mutate(file) }} /></label></div>
          </>}
        </div>
        <footer><Status tone={saved ? 'success' : 'warning'}>{saved ? ui.saved : ui.changed}</Status><Button onClick={() => { updateExperiment.mutate(); setSaved(true) }} variant="primary"><Save />{t('experiments.save')}</Button></footer>
      </section>
    </div>

    <Overlay open={protocolOpen} onClose={() => setProtocolOpen(false)} title={ui.protocolTitle} kind="modal" footer={<Button variant="primary" onClick={() => setProtocolOpen(false)}>{ui.close}</Button>}>
      <div className="create-confirm"><Beaker /><h3>{ui.protocolTitle}</h3><p>{ui.protocolText}</p></div>
    </Overlay>

    <Overlay open={reportOpen} onClose={() => setReportOpen(false)} title={ui.report} kind="modal" footer={<Button variant="primary" onClick={() => { exportReport.mutate(); setReportOpen(false) }}><FileOutput />{ui.exportAction} {exportFormat}</Button>}>
      <div className="report-readiness report-readiness--compact"><strong>68%</strong><span><h3>{ui.reportReady}</h3><p>{ui.reportHint}</p></span></div>
      <div className="report-sections report-sections--compact">{ui.sections.map((section, index) => <label key={section}><input type="checkbox" defaultChecked={index < 4} />{section}</label>)}</div>
      <fieldset className="export-formats"><legend>{ui.exportFormat}</legend><div>{['PDF','DOCX','CSV','JSON','Jira / API'].map((format) => <button type="button" key={format} aria-pressed={exportFormat === format} className={exportFormat === format ? 'is-active' : ''} onClick={() => setExportFormat(format)}>{format}</button>)}</div></fieldset>
      <label className="report-language">{ui.language}<select defaultValue="ru"><option value="ru">Русский</option><option value="en">English</option><option value="zh">中文</option></select></label>
      <Status tone="warning">{ui.missing}</Status>
    </Overlay>
  </div>
}

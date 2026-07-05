import { useEffect, useState } from 'react'
import { Activity, ArrowRight, Check, Circle, Clock, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROJECT_ID } from '../../shared/lib/data'
import { Button, Status } from '../../shared/ui/Primitives'
import { Overlay } from '../../shared/ui/Overlay'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { formatDuration, hypothesisFromDto, projectContextFromDto, runStageIndex } from '../../shared/api/viewModels'

const copy = {
  ru: {
    stages: ['Память', 'Генерация', 'Дедупликация', 'Gates', 'Критика', 'Финал'],
    completedTitle: 'Исследование завершено',
    failedTitle: 'Исследование остановлено',
    completedText: (finalists: number, generated: number) => `${finalists} финалистов из ${generated} принятых кандидатов.`,
    lastTwo: 'последние 2',
    eventGate: '12 гипотез проверяются',
    eventDedupe: '24 уникальные',
    decision: 'Нужно решение',
    energyLimit: 'Лимит энергозатрат?',
    passing: 'идёт отбор',
    funnel: ['принято', 'уникальные', 'gates', 'критика', 'финал'],
    answer: 'Ответить',
    blocks: 'Блокирует экономику',
    allowed: 'Допустимый прирост',
    comment: 'Комментарий',
    commentPlaceholder: 'Опишите ограничение обычным текстом',
    elapsed: 'Прошло',
    eta: 'Осталось',
    etaValue: '≈ 02:10',
    elapsedValue: '06:40',
    recoverTitle: 'Восстановление прогона',
    recoverText: 'Если внешний источник или модель временно недоступны, прогон сохраняет состояние этапа Gates и продолжает с последнего подтверждённого шага.',
    recoverAction: 'Восстановить с Gates',
    restored: 'Состояние восстановлено',
    clarificationAnswer: 'Ответ инженера',
    clarificationDefault: 'Для текущего прогона считаем допустимым рост энергозатрат до 10%, если гипотеза объясняет механизм раскрытия сростков и сохраняет селективность флотации. Все предложения вне домена отвальных хвостов, шлаков и металлургического передела исключить.',
    expertTitle: 'Параметры ранжирования',
    expertButton: 'Параметры',
    expertHint: 'Настройте приоритеты до следующего прогона. Профиль сохранится в проекте.',
    weights: ['Новизна', 'Реализуемость', 'Потенциальный эффект', 'Низкий риск'],
    excluded: 'Исключить направления',
    excludedPlaceholder: 'Например: цианидные реагенты, температура выше 90 °C',
    constraints: 'Доменные ограничения',
    constraintsPlaceholder: 'Оборудование, сырьё, бюджет, нормативные требования',
    reset: 'Сбросить',
    saveSettings: 'Сохранить профиль',
    weightTotal: 'Итого весов',
    weightOk: 'Баланс корректный',
    weightWarn: 'Сумма должна быть 100%',
    weightHelp: 'Это доли итогового рейтинга. При изменении одного веса остальные автоматически перераспределяются, поэтому сумма всегда остаётся 100%.',
    formulaTitle: 'Как считается итоговый рейтинг',
    formula: 'Интегральный рейтинг = Новизна × вес + Реализуемость × вес + Физико-химический эффект × вес + Низкий риск × вес. Весовой профиль влияет на сортировку следующего прогона.',
    qaFocus: 'Домен зафиксирован: отвальные хвосты, шлаки, цепи аппаратов, Excel-история и картинки схем. Промышленный синтез исключён.',
  },
  en: {
    stages: ['Memory', 'Generation', 'Dedupe', 'Gates', 'Critique', 'Final'],
    completedTitle: 'Research completed',
    failedTitle: 'Research stopped',
    completedText: (finalists: number, generated: number) => `${finalists} finalists from ${generated} accepted candidates.`,
    lastTwo: 'latest 2',
    eventGate: '12 hypotheses in review',
    eventDedupe: '24 unique',
    decision: 'Decision needed',
    energyLimit: 'Energy limit?',
    passing: 'screening',
    funnel: ['accepted', 'unique', 'gates', 'critique', 'final'],
    answer: 'Answer',
    blocks: 'Blocks economics',
    allowed: 'Allowed increase',
    comment: 'Comment',
    commentPlaceholder: 'Describe the constraint as plain text',
    elapsed: 'Elapsed',
    eta: 'ETA',
    etaValue: '≈ 02:10',
    elapsedValue: '06:40',
    recoverTitle: 'Run recovery',
    recoverText: 'If an external source or model is temporarily unavailable, the run keeps the Gates state and continues from the last confirmed step.',
    recoverAction: 'Recover from Gates',
    restored: 'State recovered',
    clarificationAnswer: 'Engineer answer',
    clarificationDefault: 'For this run, allow energy growth up to 10% only when the hypothesis explains the liberation mechanism and preserves flotation selectivity. Exclude all proposals outside tailings, slags and metallurgical processing.',
    expertTitle: 'Ranking parameters',
    expertButton: 'Parameters',
    expertHint: 'Set priorities for the next run. The profile will be saved in this project.',
    weights: ['Novelty', 'Feasibility', 'Potential impact', 'Low risk'],
    excluded: 'Excluded directions',
    excludedPlaceholder: 'For example: cyanide reagents, temperatures above 90 °C',
    constraints: 'Domain constraints',
    constraintsPlaceholder: 'Equipment, feedstock, budget, regulatory requirements',
    reset: 'Reset',
    saveSettings: 'Save profile',
    weightTotal: 'Total weight',
    weightOk: 'Balance is correct',
    weightWarn: 'Total must be 100%',
    weightHelp: 'These are shares of the final rating. Changing one weight automatically redistributes the others, so the total always stays at 100%.',
    formulaTitle: 'How the final rating is calculated',
    formula: 'Integral rating = Novelty × weight + Feasibility × weight + Physicochemical effect × weight + Low risk × weight. The weight profile changes sorting in the next run.',
    qaFocus: 'Domain locked: tailings, slags, equipment chains, Excel history and scheme images. Industrial synthesis is excluded.',
  },
  'zh-CN': {
    stages: ['记忆', '生成', '去重', '关卡', '评审', '最终'],
    completedTitle: '研究已完成',
    failedTitle: '研究已停止',
    completedText: (finalists: number, generated: number) => `${generated} 个候选中有 ${finalists} 个入选。`,
    lastTwo: '最近 2 条',
    eventGate: '12 个假设正在检查',
    eventDedupe: '24 个唯一项',
    decision: '需要决策',
    energyLimit: '能耗上限？',
    passing: '12 个通过',
    funnel: ['已生成', '唯一项', '关卡', '评审', '最终'],
    answer: '回答',
    blocks: '阻塞经济性',
    allowed: '允许增幅',
    comment: '备注',
    commentPlaceholder: '用一个工作提示描述约束，而不是清单',
    elapsed: '已用时',
    eta: '剩余',
    etaValue: '≈ 02:10',
    elapsedValue: '06:40',
    recoverTitle: '运行恢复',
    recoverText: '如果外部来源或模型暂时不可用，运行会保留 Gates 状态并从最后确认步骤继续。',
    recoverAction: '从 Gates 恢复',
    restored: '状态已恢复',
    clarificationAnswer: '工程师回答',
    clarificationDefault: '本次运行允许能耗最多增加 10%，前提是假设解释解离机理并保持浮选选择性。排除尾矿、炉渣和冶金处理以外的所有建议。',
    expertTitle: '排序参数',
    expertButton: '参数',
    expertHint: '为下一次运行设置优先级，配置将保存在项目中。',
    weights: ['新颖性', '可行性', '潜在影响', '低风险'],
    excluded: '排除方向',
    excludedPlaceholder: '例如：氰化物试剂、温度高于 90 °C',
    constraints: '领域约束',
    constraintsPlaceholder: '设备、原料、预算、法规要求',
    reset: '重置',
    saveSettings: '保存配置',
    weightTotal: '权重总和',
    weightOk: '权重正确',
    weightWarn: '总和必须为 100%',
    weightHelp: '这些是综合评分中的占比。修改一个权重时，其他权重会自动重新分配，因此总和始终为 100%。',
    formulaTitle: '综合评分的计算方式',
    formula: '综合评分 = 新颖性 × 权重 + 可行性 × 权重 + 物理化学效果 × 权重 + 低风险 × 权重。权重配置会影响下一次运行排序。',
    qaFocus: '领域已固定：尾矿、炉渣、设备链、Excel 历史和流程图图片。工业合成被排除。',
  },
} as const

const defaultWeights = [30, 25, 30, 15]
const funnelStageKeys = ['generation', 'deduplication', 'gates', 'critique', 'final'] as const

function compactHypothesisId(id: string) {
  if (!id.startsWith('hyp_')) return id
  return `H-${id.slice(4, 10).toUpperCase()}`
}

function formatRejectionReason(reason: string) {
  const labels: Record<string, string> = {
    empty_or_invalid_llm_response: 'модель вернула пустой или неверный JSON',
    evidence_gate: 'нет достаточной привязки к источникам',
    grounding_gate: 'не подтверждена трассировка evidence',
    engineering_constraint_gate: 'не доказано соблюдение ограничений проекта',
    falsifiability_gate: 'нет условия, которое опровергает гипотезу',
    experimentability_gate: 'нет проверяемого лабораторного шага',
    'duplicate or near-duplicate title': 'дубликат или слишком близкая гипотеза',
  }
  return labels[reason] ?? reason.replace(/_/g, ' ')
}

function rebalanceWeights(current: number[], changedIndex: number, requestedValue: number) {
  const changedValue = Math.min(100, Math.max(0, Math.round(requestedValue)))
  const remaining = 100 - changedValue
  const otherIndexes = current.map((_, index) => index).filter((index) => index !== changedIndex)
  const otherTotal = otherIndexes.reduce((sum, index) => sum + current[index], 0)
  const next = [...current]
  next[changedIndex] = changedValue

  if (otherTotal === 0) {
    const base = Math.floor(remaining / otherIndexes.length)
    otherIndexes.forEach((index, position) => { next[index] = base + (position < remaining % otherIndexes.length ? 1 : 0) })
    return next
  }

  const rawShares = otherIndexes.map((index) => ({ index, value: current[index] / otherTotal * remaining }))
  rawShares.forEach(({ index, value }) => { next[index] = Math.floor(value) })
  let remainder = remaining - otherIndexes.reduce((sum, index) => sum + next[index], 0)
  rawShares.sort((a, b) => (b.value - Math.floor(b.value)) - (a.value - Math.floor(a.value)))
  for (let index = 0; remainder > 0; index = (index + 1) % rawShares.length) {
    next[rawShares[index].index] += 1
    remainder -= 1
  }
  return next
}

export default function ResearchPage() {
  const { t, i18n } = useTranslation()
  const ui = copy[(i18n.language as keyof typeof copy)] ?? copy.ru
  const navigate = useNavigate()
  const { projectId } = useParams()
  const activeProjectId = projectId ?? PROJECT_ID
  const queryClient = useQueryClient()
  const projectQuery = useQuery({ queryKey: ['project', activeProjectId, i18n.language], queryFn: () => api.project(activeProjectId), enabled: Boolean(activeProjectId) })
  const context = projectQuery.data ? projectContextFromDto(projectQuery.data) : null
  const runStorageKey = `norlab-run-${activeProjectId}`
  const [runId, setRunId] = useState(() => window.localStorage.getItem(runStorageKey) ?? '')
  const startRun = useMutation({
    mutationFn: () => api.startRun(activeProjectId),
    onSuccess: (run) => {
      window.localStorage.setItem(runStorageKey, run.id)
      setRunId(run.id)
      void queryClient.invalidateQueries({ queryKey: ['run', activeProjectId, run.id] })
    },
  })
  const runQuery = useQuery({
    queryKey: ['run', activeProjectId, runId, i18n.language],
    queryFn: () => api.run(activeProjectId, runId),
    enabled: Boolean(activeProjectId && runId),
    refetchInterval: (query) => query.state.data?.status === 'running' || query.state.data?.status === 'queued' ? 2000 : false,
  })
  const hypothesesQuery = useQuery({ queryKey: ['hypotheses', activeProjectId, i18n.language, {}], queryFn: () => api.hypotheses(activeProjectId), enabled: Boolean(activeProjectId) })
  const [tab, setTab] = useState('finalists')
  const [expertSettingsOpen, setExpertSettingsOpen] = useState(false)
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [runSnapshot, setRunSnapshot] = useState<{ id: string; elapsed: number; seenAt: number } | null>(null)
  const [weights, setWeights] = useState(defaultWeights)
  const [excludedDirections, setExcludedDirections] = useState('')
  const [domainConstraints, setDomainConstraints] = useState('')
  const [profileRunId, setProfileRunId] = useState('')
  const saveRanking = useMutation({ mutationFn: () => api.rankingProfile(activeProjectId, { novelty: weights[0], feasibility: weights[1], physicochemical_mechanism: weights[2], low_risk: weights[3], excluded_directions: excludedDirections, domain_constraints: domainConstraints }) })
  const run = runQuery.data
  const runSnapshotId = run?.id
  const runSnapshotElapsed = run?.elapsed_seconds
  const runSnapshotStatus = run?.status
  const stageIndex = runStageIndex(run)
  const stages = ui.stages.map((name, index) => [name, index < stageIndex ? 'done' : index === stageIndex ? 'active' : 'queued'] as const)
  const events = (run?.events ?? []).slice(-4).reverse()
  const allProjectHypotheses = (hypothesesQuery.data?.items ?? []).map(hypothesisFromDto)
  const latestHypothesisRunId = allProjectHypotheses.find((item) => item.dto.run_id)?.dto.run_id
  const runCandidateItems = allProjectHypotheses.filter((item) => !runId || item.dto.run_id === runId)
  const filteredCandidateItems = runCandidateItems.filter((item) => {
    if (tab === 'finalists') return item.status === 'finalist'
    if (tab === 'excluded') return item.status === 'rejected'
    return true
  })
  const selectedHypothesis = runCandidateItems.find((item) => item.id === selectedHypothesisId)
  const weightTotal = weights.reduce((sum, value) => sum + value, 0)
  const activeFunnelIndex = Math.max(0, funnelStageKeys.indexOf((run?.stage ?? 'generation') as typeof funnelStageKeys[number]))
  const funnelValues = [run?.funnel.generated ?? 0, run?.funnel.unique ?? 0, run?.funnel.gates ?? 0, run?.funnel.critique ?? 0, run?.funnel.finalists ?? 0]
  const rejections = run?.rejections ?? []
  const effectiveElapsedSeconds = (() => {
    if (!run) return undefined
    if (run.status !== 'running' && run.status !== 'queued' && run.status !== 'waiting_for_input') return run.elapsed_seconds
    if (!runSnapshot || runSnapshot.id !== run.id) return run.elapsed_seconds
    return runSnapshot.elapsed + Math.max(0, Math.floor((nowMs - runSnapshot.seenAt) / 1000))
  })()

  useEffect(() => {
    if (runId || startRun.isPending || !activeProjectId || !hypothesesQuery.isFetched) return
    if (latestHypothesisRunId) {
      window.localStorage.setItem(runStorageKey, latestHypothesisRunId)
      setRunId(latestHypothesisRunId)
      return
    }
    startRun.mutate()
  }, [activeProjectId, hypothesesQuery.isFetched, latestHypothesisRunId, runId, runStorageKey, startRun])

  useEffect(() => {
    if (!latestHypothesisRunId || !run || latestHypothesisRunId === runId) return
    if (!['completed', 'failed'].includes(run.status)) return
    window.localStorage.setItem(runStorageKey, latestHypothesisRunId)
    setRunId(latestHypothesisRunId)
  }, [latestHypothesisRunId, run, runId, runStorageKey])

  useEffect(() => {
    if (!run?.ranking_profile || profileRunId === run.id) return
    const profile = run.ranking_profile
    setWeights([profile.novelty, profile.feasibility, profile.physicochemical_mechanism, profile.low_risk])
    setExcludedDirections(profile.excluded_directions ?? '')
    setDomainConstraints(profile.domain_constraints ?? '')
    setProfileRunId(run.id)
  }, [profileRunId, run])

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!runSnapshotId || runSnapshotElapsed == null) return
    setRunSnapshot((current) => {
      const isLive = runSnapshotStatus === 'running' || runSnapshotStatus === 'queued' || runSnapshotStatus === 'waiting_for_input'
      if (current?.id === runSnapshotId && isLive) return current
      return { id: runSnapshotId, elapsed: runSnapshotElapsed, seenAt: Date.now() }
    })
  }, [runSnapshotId, runSnapshotElapsed, runSnapshotStatus])

  useEffect(() => {
    if (!runId) return
    const source = new EventSource(api.runEventsUrl(activeProjectId, runId))
    source.addEventListener('run.updated', () => {
      void queryClient.invalidateQueries({ queryKey: ['run', activeProjectId, runId] })
      void queryClient.invalidateQueries({ queryKey: ['hypotheses', activeProjectId] })
    })
    source.onerror = () => source.close()
    return () => source.close()
  }, [activeProjectId, queryClient, runId])

  return <div className="research-page">
    <section className="run-header run-header--compact">
      <div className="run-icon"><Activity /></div>
      <div><h1>{run?.status === 'completed' ? ui.completedTitle : run?.status === 'failed' ? ui.failedTitle : t('research.running')}</h1><p>{context?.focus ?? 'Проект'}. {run?.status === 'completed' ? ui.completedText(run.funnel.finalists, run.funnel.generated) : t('research.runningText')}</p><div className="run-meta"><Status tone={run?.status === 'failed' ? 'danger' : run?.status === 'completed' ? 'success' : 'info'}>{run ? `${run.stage} · ${run.status}` : 'Запуск'}</Status><span><Clock />{ui.elapsed}: {formatDuration(effectiveElapsedSeconds)}</span><span>{ui.eta}: {run?.eta_seconds == null ? '—' : `≈ ${formatDuration(run.eta_seconds)}`}</span></div></div>
      <div className="run-actions"><Button onClick={() => setExpertSettingsOpen(true)}><SlidersHorizontal />{ui.expertButton}</Button><Button onClick={() => navigate(`/projects/${activeProjectId}/workspace`)}>{t('research.project')}</Button></div>
    </section>

    <section className="stage-timeline stage-timeline--compact" aria-label="Этапы исследования">{stages.map(([name,state]) => <div className={`stage stage--${state}`} key={name}><span className="stage__icon">{state === 'done' ? <Check /> : <Circle />}</span><strong>{name}</strong></div>)}</section>

    <div className="research-body research-body--compact">
      <section className="activity-feed activity-feed--compact">
        <div className="panel-title"><h2>{t('research.activity')}</h2><span className="muted-text">{ui.lastTwo}</span></div>
        {!events.length ? <article><time>—</time><span className="activity-icon is-active"><Clock /></span><div><strong>{startRun.isPending ? 'Запускаем pipeline' : 'Ожидаем события'}</strong><p>{runQuery.isError ? 'Backend вернул ошибку прогона.' : 'Состояние будет обновляться через GET/SSE.'}</p></div></article> : null}
        {events.map((event, index) => <article key={event.id}><time>{new Date(event.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time><span className={index === 0 ? 'activity-icon is-active' : 'activity-icon'}>{index === 0 ? <SlidersHorizontal /> : <Check />}</span><div><strong>{event.title}</strong><p>{event.message}</p></div></article>)}
      </section>

      <section className="collider collider--compact">
        <div className="panel-title"><h2>{t('research.collider')}</h2><Status tone="info">{run ? `${run.funnel.finalists} финалистов` : ui.passing}</Status></div>
        <div className="funnel-metrics">{funnelValues.map((value, index) => <div className={index === activeFunnelIndex ? 'is-active' : index < activeFunnelIndex ? 'is-done' : ''} key={ui.funnel[index]}><strong>{value}</strong><span>{ui.funnel[index]}</span>{index < 4 ? <ArrowRight /> : null}</div>)}</div>
        <div className="funnel-bars">{funnelValues.map((_value, index) => <i className={index === activeFunnelIndex ? 'is-active' : index < activeFunnelIndex ? 'is-done' : ''} key={ui.funnel[index]} />)}</div>
        <div className="generation-skeleton" aria-label="Генерируются следующие гипотезы"><i /><i /><i /></div>
        {rejections.length ? <details className="rejection-panel">
          <summary><strong>Отсев кандидатов</strong><span>{rejections.length} причин</span></summary>
          <div className="rejection-list">
            {rejections.slice(-6).reverse().map((item, index) => <article key={`${item.stage}-${item.title ?? 'untitled'}-${index}`}>
              <span>{item.stage === 'critic' || item.stage === 'critique' ? 'Критик' : item.stage === 'gates' ? 'Gates' : 'Генерация'}</span>
              <strong>{item.title || 'Кандидат без корректного названия'}</strong>
              <p>{(item.reasons.length ? item.reasons : ['причина не указана']).map(formatRejectionReason).join('; ')}</p>
            </article>)}
          </div>
        </details> : null}
        <div className="candidate-head"><h3>{t('research.candidates')}</h3><div className="tabs">{[['finalists','research.finalists'],['all','research.all'],['excluded','research.excluded']].map(([value,key]) => <button key={value} aria-pressed={tab === value} className={tab === value ? 'is-active' : ''} onClick={() => setTab(value)}>{t(key)}</button>)}</div></div>
        <div className="candidate-list candidate-list--compact">{filteredCandidateItems.map((item) => <button key={item.id} onClick={() => setSelectedHypothesisId(item.id)}><span className="candidate-id">{compactHypothesisId(item.id)}</span><span><strong>{item.claim}</strong><small>{item.family} · {item.kpi} · {item.status === 'finalist' ? 'финалист' : item.status === 'rejected' ? 'исключена' : 'кандидат'}</small></span><ArrowRight /></button>)}{!filteredCandidateItems.length ? <button><span className="candidate-id">—</span><span><strong>{runCandidateItems.length ? 'В этом фильтре гипотез нет' : 'Гипотезы текущего прогона ещё не готовы'}</strong><small>{runCandidateItems.length ? 'Переключите фильтр или дождитесь нового прогона.' : run?.status === 'failed' ? 'Текущий прогон завершился ошибкой качества данных.' : 'Дождитесь завершения этапа generation.'}</small></span></button> : null}</div>
      </section>
    </div>

    <Overlay open={Boolean(selectedHypothesis)} onClose={() => setSelectedHypothesisId(null)} title={selectedHypothesis ? compactHypothesisId(selectedHypothesis.id) : ''} kind="source" footer={<Button variant="primary" onClick={() => navigate(`/projects/${activeProjectId}/experiments?hypothesis=${selectedHypothesis?.id ?? ''}`)}>Собрать эксперимент</Button>}>
      <div className="research-hypothesis-preview">
        {selectedHypothesis ? <>
          <section className="hypothesis-overview-hero"><span>Главная идея</span><h3>{selectedHypothesis.claim}</h3><p>{selectedHypothesis.family}</p></section>
          <section className="hypothesis-statement hypothesis-statement--hero"><span>Проверяемая гипотеза</span><strong>{selectedHypothesis.statement}</strong></section>
          <div className="hypothesis-detail-grid"><div><span>KPI</span><strong>{selectedHypothesis.kpi}</strong></div><div><span>Экономический эффект</span><strong>{selectedHypothesis.dto.economic_effect}</strong></div><div><span>Первый тест</span><strong>{selectedHypothesis.dto.first_check}</strong></div></div>
          <section className="mechanism-callout"><Activity /><div><span>Почему это должно сработать</span><strong>{selectedHypothesis.dto.mechanism}</strong></div></section>
        </> : null}
      </div>
    </Overlay>

    <Overlay open={expertSettingsOpen} onClose={() => setExpertSettingsOpen(false)} title={ui.expertTitle} kind="modal" footer={<><Button variant="ghost" onClick={() => setWeights(defaultWeights)}><RotateCcw />{ui.reset}</Button><Button variant="primary" onClick={() => { void saveRanking.mutateAsync(); setExpertSettingsOpen(false) }}>{ui.saveSettings}</Button></>}>
      <div className="expert-settings">
        <p>{ui.expertHint}</p>
        <div className="ranking-intro"><SlidersHorizontal /><p>{ui.weightHelp}</p></div>
        <div className="ranking-weights">{ui.weights.map((label, index) => <label key={label}><span>{label}<output>{weights[index]}%</output></span><input type="range" min="0" max="100" value={weights[index]} onChange={(event) => setWeights((current) => rebalanceWeights(current, index, Number(event.target.value)))} /></label>)}</div>
        <div className={`ranking-total ${weightTotal === 100 ? 'is-ok' : 'is-warning'}`}><span>{ui.weightTotal}</span><strong>{weightTotal}%</strong><small>{weightTotal === 100 ? ui.weightOk : ui.weightWarn}</small></div>
        <details className="ranking-formula"><summary>{ui.formulaTitle}</summary><p>{ui.formula}</p></details>
        <label>{ui.excluded}<textarea value={excludedDirections} placeholder={ui.excludedPlaceholder} onChange={(event) => setExcludedDirections(event.target.value)} /></label>
        <label>{ui.constraints}<textarea value={domainConstraints} placeholder={ui.constraintsPlaceholder} onChange={(event) => setDomainConstraints(event.target.value)} /></label>
      </div>
    </Overlay>
  </div>
}

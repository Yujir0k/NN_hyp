import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Atom, Check, ChevronLeft, ChevronRight, ClipboardCheck, Cog, ExternalLink, FileText, Filter, FlaskConical, Lightbulb, MessageSquare, Microscope, Plus, Scale, SlidersHorizontal, ThumbsUp } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROJECT_ID } from '../../shared/lib/data'
import { ScoreDots } from '../../shared/ui/Icons'
import { Button, Status } from '../../shared/ui/Primitives'
import { Overlay } from '../../shared/ui/Overlay'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { hypothesisFromDto, type HypothesisView } from '../../shared/api/viewModels'

const copy = {
  ru: {
    newHypothesis: 'Новая гипотеза',
    final: 'Финал',
    risk: 'Риск',
    novelty: 'Новизна',
    selected: 'Выбрано',
    compare: 'Сравнить',
    tabs: [['overview','Обзор'],['evidence','Доказ.'],['novelty','Новизна'],['disagreement','Риски'],['uncertainty','Неопред.'],['history','История']],
    scoreLabels: ['Наука', 'Инж.', 'Механизм', 'Тест'],
    rating: 'Рейтинг',
    scoreLegendTitle: 'Легенда оценки',
    scoreLegendText: 'Каждая шкала читается от 1 до 5: 1 — слабое основание, 5 — сильное основание. Интегральный рейтинг показывает взвешенную пригодность гипотезы для проверки.',
    ratingFormula: 'Формула: наука × 30% + инженерная реализуемость × 25% + физико-химический механизм × 30% + тестируемость/низкий риск × 15%.',
    uncertaintyHint: '0% означает высокую уверенность, 100% означает нехватку данных или высокий разброс. Чем больше процент, тем выше риск перед экспериментом.',
    source: 'Открыть источник',
    claim: 'Формулировка',
    family: 'Семейство',
    kpi: 'KPI',
    save: 'Создать',
    sourceTitle: 'Исходный источник',
    sourceText: 'Хвосты_КГМК_характеристика.pdf · стр. 3 · абзац 2',
    sourceUploaded: 'Загружен в проект',
    sourcePages: 'Страницы документа',
    sourceOriginal: 'Оригинал',
    sourceFragment: 'Цитируемый фрагмент',
    sourcePage: 'Страница',
    close: 'Закрыть',
    feedbackTitle: 'Экспертная оценка',
    useful: 'Полезна',
    revise: 'Нужна доработка',
    reason: 'Причина',
    feedbackComment: 'Комментарий эксперта',
    feedbackPlaceholder: 'Например: механизм убедителен, но нужно проверить P80 и глинистость на отдельном тесте.',
    reasons: ['Механизм убедителен', 'Недостаточно данных', 'Проверить P80', 'Не подходит под ограничения'],
    filterTitle: 'Фильтры гипотез',
    sortBy: 'Сортировка',
    sortRating: 'Сначала высокий рейтинг',
    sortKpi: 'Сначала высокий KPI',
    sortId: 'По ID',
    riskFilter: 'Риск',
    noveltyFilter: 'Новизна',
    any: 'Любой',
    riskOther: 'Прочие риски',
    reset: 'Сбросить',
    apply: 'Применить',
    idea: 'Главная идея',
    statementLabel: 'Проверяемая гипотеза',
    economicEffect: 'Экономический эффект',
    why: 'Почему это должно сработать',
    conditions: 'Ключевое условие',
    assessment: 'Оценка готовности',
    whatToCheck: 'Что проверить в первую очередь',
  },
  en: {
    newHypothesis: 'New hypothesis',
    final: 'Final',
    risk: 'Risk',
    novelty: 'Novelty',
    selected: 'Selected',
    compare: 'Compare',
    tabs: [['overview','Overview'],['evidence','Evidence'],['novelty','Novelty'],['disagreement','Risks'],['uncertainty','Uncert.'],['history','History']],
    scoreLabels: ['Science', 'Eng.', 'Mechanism', 'Test'],
    rating: 'Rating',
    scoreLegendTitle: 'Score legend',
    scoreLegendText: 'Each scale runs from 1 to 5: 1 means weak support, 5 means strong support. The integral rating shows weighted readiness for validation.',
    ratingFormula: 'Formula: science × 30% + engineering feasibility × 25% + physicochemical mechanism × 30% + testability / low risk × 15%.',
    uncertaintyHint: '0% means high confidence, 100% means missing data or high spread. The higher the percentage, the higher the pre-experiment risk.',
    source: 'Open source',
    claim: 'Claim',
    family: 'Family',
    kpi: 'KPI',
    save: 'Create',
    sourceTitle: 'Source file',
    sourceText: 'KGMK_tailings_characteristics.pdf · page 3 · paragraph 2',
    sourceUploaded: 'Uploaded to the project',
    sourcePages: 'Document pages',
    sourceOriginal: 'Original',
    sourceFragment: 'Cited passage',
    sourcePage: 'Page',
    close: 'Close',
    feedbackTitle: 'Expert feedback',
    useful: 'Useful',
    revise: 'Needs revision',
    reason: 'Reason',
    feedbackComment: 'Expert comment',
    feedbackPlaceholder: 'For example: the mechanism is convincing, but P80 and clay content need a separate test.',
    reasons: ['Mechanism is convincing', 'Insufficient data', 'Check P80', 'Outside constraints'],
    filterTitle: 'Hypothesis filters',
    sortBy: 'Sort by',
    sortRating: 'Highest rating first',
    sortKpi: 'Highest KPI first',
    sortId: 'By ID',
    riskFilter: 'Risk',
    noveltyFilter: 'Novelty',
    any: 'Any',
    riskOther: 'Other risks',
    reset: 'Reset',
    apply: 'Apply',
    idea: 'Core idea',
    statementLabel: 'Testable hypothesis',
    economicEffect: 'Economic effect',
    why: 'Why it should work',
    conditions: 'Key condition',
    assessment: 'Readiness assessment',
    whatToCheck: 'What to validate first',
  },
  'zh-CN': {
    newHypothesis: '新建假设',
    final: '入围',
    risk: '风险',
    novelty: '新颖性',
    selected: '已选择',
    compare: '比较',
    tabs: [['overview','概览'],['evidence','证据'],['novelty','新颖性'],['disagreement','风险'],['uncertainty','不确定'],['history','历史']],
    scoreLabels: ['科学', '工程', '机理', '测试'],
    rating: '评分',
    scoreLegendTitle: '评分说明',
    scoreLegendText: '每个尺度为 1 到 5：1 表示依据弱，5 表示依据强。综合评分表示假设用于验证的加权成熟度。',
    ratingFormula: '公式：科学 × 30% + 工程可行性 × 25% + 物理化学机理 × 30% + 可测试性/低风险 × 15%。',
    uncertaintyHint: '0% 表示高置信度，100% 表示数据不足或分歧较大。百分比越高，实验前风险越高。',
    source: '打开来源',
    claim: '表述',
    family: '类别',
    kpi: 'KPI',
    save: '创建',
    sourceTitle: '源文件',
    sourceText: 'KGMK 尾矿特征.pdf · 第 3 页 · 第 2 段',
    sourceUploaded: '已上传到项目',
    sourcePages: '文档页面',
    sourceOriginal: '原文',
    sourceFragment: '引用片段',
    sourcePage: '第页',
    close: '关闭',
    feedbackTitle: '专家反馈',
    useful: '有用',
    revise: '需要修改',
    reason: '原因',
    feedbackComment: '专家备注',
    feedbackPlaceholder: '例如：机理可信，但需要单独验证 P80 和黏土含量。',
    reasons: ['机理可信', '数据不足', '检查 P80', '不符合限制'],
    filterTitle: '假设筛选',
    sortBy: '排序',
    sortRating: '评分优先',
    sortKpi: 'KPI 优先',
    sortId: '按 ID',
    riskFilter: '风险',
    noveltyFilter: '新颖性',
    any: '任意',
    riskOther: '其他风险',
    reset: '重置',
    apply: '应用',
    idea: '核心思路',
    statementLabel: '可验证假设',
    economicEffect: '经济效果',
    why: '为什么可行',
    conditions: '关键条件',
    assessment: '成熟度评估',
    whatToCheck: '优先验证项',
  },
} as const

type Hypothesis = HypothesisView
type FeedbackState = { verdict?: 'useful' | 'revise'; reason?: string; comment?: string }

function getNoveltyTone(novelty: string) {
  if (novelty.toLowerCase().includes('извест')) return 'muted'
  if (novelty.toLowerCase().includes('умер')) return 'info'
  return 'success'
}

function getRiskTone(weak: string) {
  if (weak.toLowerCase().includes('энерг') || weak.toLowerCase().includes('селектив')) return 'warning'
  if (weak.toLowerCase().includes('данн')) return 'danger'
  return 'info'
}

const scoreIcons = [Atom, Cog, Microscope, ClipboardCheck] as const

function compactHypothesisId(id: string) {
  if (!id.startsWith('hyp_')) return id
  return `H-${id.slice(4, 10).toUpperCase()}`
}

function parseKpi(kpi: string) {
  return Number.parseFloat(kpi.replace(',', '.').replace(/[^\d.+-]/g, '')) || 0
}

export default function HypothesesPage() {
  const { t, i18n } = useTranslation()
  const ui = copy[(i18n.language as keyof typeof copy)] ?? copy.ru
  const navigate = useNavigate()
  const { projectId } = useParams()
  const activeProjectId = projectId ?? PROJECT_ID
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<'cards' | 'comparison'>('cards')
  const [selected, setSelected] = useState<string[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'rating' | 'kpi' | 'id'>('rating')
  const [riskFilter, setRiskFilter] = useState('any')
  const [noveltyFilter, setNoveltyFilter] = useState('any')
  const hypothesesQuery = useQuery({ queryKey: ['hypotheses', activeProjectId, i18n.language, { sortBy, riskFilter, noveltyFilter }], queryFn: () => api.hypotheses(activeProjectId, { sort: sortBy }), enabled: Boolean(activeProjectId) })
  const items = useMemo(() => (hypothesesQuery.data?.items ?? []).map(hypothesisFromDto), [hypothesesQuery.data])
  const [sourceOpen, setSourceOpen] = useState(false)
  const [sourcePage, setSourcePage] = useState(3)
  const [feedback, setFeedback] = useState<Record<string, FeedbackState>>({})
  const [draft, setDraft] = useState({ claim: 'Контроль P80 снизит потери Ni', family: 'Гранулометрия', kpi: '+1,2 п.п.' })
  const createHypothesisMutation = useMutation({
    mutationFn: () => api.createHypothesis(activeProjectId, { claim: draft.claim, family: draft.family, kpi_label: draft.kpi }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['hypotheses', activeProjectId] })
      setCreateOpen(false)
      openInspector(created.id)
    },
  })
  const saveFeedback = useMutation({
    mutationFn: ({ hypothesisId, state }: { hypothesisId: string; state: FeedbackState }) => api.saveFeedback(activeProjectId, hypothesisId, { verdict: state.verdict ?? 'useful', reason: state.reason ?? '', comment: state.comment ?? '' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hypotheses', activeProjectId] })
    },
  })
  const activeId = params.get('hypothesis')
  const panel = params.get('panel') ?? 'overview'
  const active = useMemo(() => items.find((item) => item.id === activeId), [activeId, items])
  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => (riskFilter === 'any' || getRiskTone(item.weak) === riskFilter) && (noveltyFilter === 'any' || getNoveltyTone(item.novelty) === noveltyFilter))
    return [...filtered].sort((a, b) => {
      if (sortBy === 'kpi') return parseKpi(b.kpi) - parseKpi(a.kpi)
      if (sortBy === 'id') return a.id.localeCompare(b.id)
      return b.rating - a.rating
    })
  }, [items, noveltyFilter, riskFilter, sortBy])
  const openInspector = (id: string, nextPanel = 'overview') => setParams({ hypothesis: id, panel: nextPanel })
  const closeInspector = () => setParams({})

  const createHypothesis = () => createHypothesisMutation.mutate()

  useEffect(() => {
    if (!selected.length && items.length) setSelected(items.slice(0, 2).map((item) => item.id))
  }, [items, selected.length])

  return <div className="page hypotheses-page">
    <header className="page-heading">
      <div><h1>{t('hypotheses.title')}</h1><p>{t('hypotheses.summary')}</p></div>
      <div className="page-heading__actions"><Button variant="primary" onClick={() => setCreateOpen(true)}><Plus />{ui.newHypothesis}</Button><Button onClick={() => setFiltersOpen(true)}><Filter />{t('hypotheses.filters')}</Button><div className="segmented"><button aria-pressed={mode === 'cards'} className={mode === 'cards' ? 'is-active' : ''} onClick={() => setMode('cards')}>{t('hypotheses.cards')}</button><button aria-pressed={mode === 'comparison'} className={mode === 'comparison' ? 'is-active' : ''} onClick={() => setMode('comparison')}>{t('hypotheses.comparison')}</button></div></div>
    </header>
    <section className="score-legend">
      <div><strong>{ui.scoreLegendTitle}</strong><p>{ui.scoreLegendText}</p></div>
      <small>{ui.ratingFormula}</small>
    </section>
    {hypothesesQuery.isLoading ? <section className="hypothesis-list"><article className="hypothesis-card"><h2>Гипотезы загружаются…</h2><p>Получаем результаты pipeline.</p></article></section> : null}
    {hypothesesQuery.isError ? <section className="hypothesis-list"><article className="hypothesis-card"><h2>Не удалось загрузить гипотезы</h2><p>Проверьте backend или повторите прогон.</p></article></section> : null}
    {!hypothesesQuery.isLoading && !hypothesesQuery.isError && !items.length ? <section className="hypothesis-list"><article className="hypothesis-card"><h2>Гипотезы ещё не сформированы</h2><p>Запустите исследование, чтобы получить реальные гипотезы от pipeline.</p></article></section> : null}

    {items.length && mode === 'cards' ? <section className="hypothesis-list">{visibleItems.map((item) => <article className={`hypothesis-card hypothesis-card--compact hypothesis-card--hierarchy ${activeId === item.id ? 'is-selected' : ''}`} key={item.id}>
      <label className="compare-check" title={t('hypotheses.compare')}><input aria-label={`${t('hypotheses.compare')}: ${item.claim}`} type="checkbox" checked={selected.includes(item.id)} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current,item.id].slice(-5))}/><span>{t('hypotheses.compare')}</span></label>
      <div className="hypothesis-id"><strong title={item.id}>{compactHypothesisId(item.id)}</strong><Status tone="info">{ui.final}</Status></div>
      <div className="hypothesis-claim"><span className="hypothesis-eyebrow">{ui.idea}</span><h2>{item.claim}</h2><p><Lightbulb />{item.family}</p><div className="hypothesis-statement"><span>{ui.statementLabel}</span><strong>{item.statement}</strong></div><div className="hypothesis-economics"><span>{ui.economicEffect}</span><strong>{item.dto.economic_effect}</strong></div><div className="hypothesis-keypoint"><span>{ui.why}</span><strong>{item.dto.mechanism}</strong></div></div>
      <div className="hypothesis-meta hypothesis-meta--compact">
        <span className="metric-chip metric-chip--rating">{ui.rating}<strong>{item.rating}/100</strong></span>
        <span className="metric-chip metric-chip--success">KPI<strong>{item.kpi}</strong></span>
        <span className={`metric-chip metric-chip--${getRiskTone(item.weak)}`}>{ui.risk}<strong>{item.weak}</strong></span>
        <span className={`metric-chip metric-chip--${getNoveltyTone(item.novelty)}`}>{ui.novelty}<strong>{item.novelty}</strong></span>
      </div>
      <div className="hypothesis-assessment"><span className="hypothesis-assessment__title">{ui.assessment}</span><div className="four-keys four-keys--compact">{item.scores.map((score, index) => { const Icon = scoreIcons[index]; return <ScoreDots key={ui.scoreLabels[index]} label={ui.scoreLabels[index]} value={score} icon={<Icon />} /> })}</div><div className="hypothesis-condition"><span>{ui.conditions}</span><strong>{item.dto.key_condition}</strong></div></div>
      <Button className="open-hypothesis" onClick={() => openInspector(item.id)}>{t('hypotheses.open')}<ArrowRight /></Button>
    </article>)}</section> : items.length ? <ComparisonMatrix items={visibleItems} onOpen={openInspector} /> : null}

    {selected.length ? <div className="comparison-tray comparison-tray--compact"><span>{ui.selected}: {selected.length}</span>{selected.map((id) => <button key={id} onClick={() => openInspector(id)}>{compactHypothesisId(id)}</button>)}<Button variant="primary" onClick={() => setMode('comparison')}>{ui.compare} <ArrowRight /></Button></div> : null}

    <Overlay open={Boolean(active)} onClose={closeInspector} title={active ? compactHypothesisId(active.id) : ''} kind="source" footer={<Button variant="primary" onClick={() => navigate(`/projects/${activeProjectId}/experiments?hypothesis=${active?.id ?? ''}`)}><FlaskConical />{t('hypotheses.compile')}</Button>}>
      <div className="inspector-tabs">{ui.tabs.map(([value,label]) => <button key={value} aria-pressed={panel === value} className={panel === value ? 'is-active' : ''} onClick={() => active && openInspector(active.id,value)}>{label}</button>)}</div>
      {active ? <InspectorPanel hypothesis={active} panel={panel} onOpenSource={() => { setSourcePage(1); setSourceOpen(true) }} sourceLabel={ui.source} feedback={feedback[active.id] ?? {}} onFeedback={(patch) => {
        const next = { ...feedback[active.id], ...patch }
        setFeedback((current) => ({ ...current, [active.id]: next }))
        if (next.verdict && next.reason !== undefined) saveFeedback.mutate({ hypothesisId: active.id, state: next })
      }} feedbackLabels={{ title: ui.feedbackTitle, useful: ui.useful, revise: ui.revise, reason: ui.reason, comment: ui.feedbackComment, placeholder: ui.feedbackPlaceholder, reasons: ui.reasons, uncertaintyHint: ui.uncertaintyHint, rating: ui.rating, ratingFormula: ui.ratingFormula, idea: ui.idea, statementLabel: ui.statementLabel, economicEffect: ui.economicEffect, why: ui.why, conditions: ui.conditions, whatToCheck: ui.whatToCheck }} /> : null}
    </Overlay>

    <Overlay open={createOpen} onClose={() => setCreateOpen(false)} title={ui.newHypothesis} kind="modal" footer={<Button variant="primary" onClick={createHypothesis} disabled={createHypothesisMutation.isPending}>{createHypothesisMutation.isPending ? 'Создаём…' : ui.save}</Button>}>
      <div className="form-stack"><label>{ui.claim}<textarea value={draft.claim} onChange={(event) => setDraft((current) => ({ ...current, claim: event.target.value }))} /></label><label>{ui.family}<input value={draft.family} onChange={(event) => setDraft((current) => ({ ...current, family: event.target.value }))} /></label><label>{ui.kpi}<input value={draft.kpi} onChange={(event) => setDraft((current) => ({ ...current, kpi: event.target.value }))} /></label></div>
    </Overlay>

    <Overlay open={filtersOpen} onClose={() => setFiltersOpen(false)} title={ui.filterTitle} kind="modal" footer={<><Button variant="ghost" onClick={() => { setSortBy('rating'); setRiskFilter('any'); setNoveltyFilter('any') }}>{ui.reset}</Button><Button variant="primary" onClick={() => setFiltersOpen(false)}>{ui.apply}</Button></>}>
      <div className="filter-form">
        <label>{ui.sortBy}<select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="rating">{ui.sortRating}</option><option value="kpi">{ui.sortKpi}</option><option value="id">{ui.sortId}</option></select></label>
        <label>{ui.riskFilter}<select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option value="any">{ui.any}</option><option value="warning">Энергия / селективность</option><option value="danger">Данные</option><option value="info">{ui.riskOther}</option></select></label>
        <label>{ui.noveltyFilter}<select value={noveltyFilter} onChange={(event) => setNoveltyFilter(event.target.value)}><option value="any">{ui.any}</option><option value="success">Новая</option><option value="info">Умеренно новая</option><option value="muted">Известная</option></select></label>
      </div>
    </Overlay>

    <Overlay open={sourceOpen} onClose={() => setSourceOpen(false)} title={ui.sourceTitle} kind="source" footer={<Button variant="primary" onClick={() => setSourceOpen(false)}>{ui.close}</Button>}>
      <SourceReader page={sourcePage} onPageChange={setSourcePage} evidence={active?.dto.evidence ?? []} labels={{ uploaded: ui.sourceUploaded, pages: ui.sourcePages, original: ui.sourceOriginal, fragment: ui.sourceFragment, page: ui.sourcePage, sourceText: active?.dto.evidence[0]?.file_name ?? ui.sourceText }} />
    </Overlay>
  </div>
}

function InspectorPanel({ hypothesis, panel, onOpenSource, sourceLabel, feedback, onFeedback, feedbackLabels }: {
  hypothesis: Hypothesis
  panel: string
  onOpenSource: () => void
  sourceLabel: string
  feedback: FeedbackState
  onFeedback: (patch: FeedbackState) => void
  feedbackLabels: { title: string; useful: string; revise: string; reason: string; comment: string; placeholder: string; reasons: readonly string[]; uncertaintyHint: string; rating: string; ratingFormula: string; idea: string; statementLabel: string; economicEffect: string; why: string; conditions: string; whatToCheck: string }
}) {
  if (panel === 'evidence') return <div className="inspector-content inspector-content--compact"><h3>{hypothesis.dto.evidence.length} источника</h3>{hypothesis.dto.evidence.map((item) => <div key={item.id}><blockquote>{item.claim || item.quote}</blockquote><button className="citation" onClick={onOpenSource}><ExternalLink />{sourceLabel}: {item.file_name}{item.page ? ` · стр. ${item.page}` : ''}</button></div>)}</div>
  if (panel === 'novelty') return <div className="inspector-content inspector-content--compact"><h3>Новизна</h3><Status tone={getNoveltyTone(hypothesis.novelty)}>{hypothesis.novelty}</Status><p>{hypothesis.statement}</p></div>
  if (panel === 'disagreement') return <div className="inspector-content inspector-content--compact"><h3>Риски</h3><p>{hypothesis.weak}</p><Status tone={getRiskTone(hypothesis.weak)}>{hypothesis.disagreement}</Status></div>
  if (panel === 'uncertainty') return <div className="inspector-content inspector-content--compact"><h3>Неопределённость</h3><p className="uncertainty-hint">{feedbackLabels.uncertaintyHint}</p><div className="uncertainty-row"><span>Уровень pipeline</span><i><b style={{width: hypothesis.uncertainty === 'Высокая' ? '80%' : hypothesis.uncertainty === 'Средняя' ? '50%' : '20%'}} /></i><strong>{hypothesis.uncertainty}</strong></div><Button><SlidersHorizontal />Назначить тест</Button></div>
  if (panel === 'history') return <div className="inspector-content inspector-content--compact"><h3>История</h3><p>Backend не вернул историю изменений для этой гипотезы.</p></div>

  return <div className="inspector-content inspector-content--compact">
    <section className="hypothesis-overview-hero">
      <span>{feedbackLabels.idea}</span>
      <h3>{hypothesis.claim}</h3>
      <p>{hypothesis.family}</p>
    </section>
    <section className="hypothesis-statement hypothesis-statement--hero"><span>{feedbackLabels.statementLabel}</span><strong>{hypothesis.statement}</strong></section>
    <div className="kpi-surface"><Scale /><span>{feedbackLabels.rating}<strong>{hypothesis.rating}/100</strong></span><span>Ключевой KPI<strong>{hypothesis.kpi}</strong></span></div>
    <section className="mechanism-callout"><Lightbulb /><div><span>{feedbackLabels.why}</span><strong>{hypothesis.dto.mechanism}</strong></div></section>
    <section className="hypothesis-detail-grid"><div><span>{feedbackLabels.conditions}</span><strong>{hypothesis.dto.key_condition}</strong></div><div><span>{feedbackLabels.whatToCheck}</span><strong>{hypothesis.dto.first_check}</strong></div><div><span>{feedbackLabels.economicEffect}</span><strong>{hypothesis.dto.economic_effect}</strong></div></section>
    <details className="secondary-disclosure"><summary>Оценка и формула рейтинга</summary><p className="rating-formula-inline">{feedbackLabels.ratingFormula}</p></details>
    <details className="secondary-disclosure"><summary>Engineering Gates</summary><ul className="gate-list"><li><Check />Данные достаточны</li><li><Check />Технология реализуема</li><li><Check />Экономика положительная</li></ul></details>
    <div className="expert-feedback"><strong>{feedbackLabels.title}</strong><div><button className={feedback.verdict === 'useful' ? 'is-active' : ''} onClick={() => onFeedback({ verdict: 'useful' })}><ThumbsUp />{feedbackLabels.useful}</button><button className={feedback.verdict === 'revise' ? 'is-active' : ''} onClick={() => onFeedback({ verdict: 'revise' })}><MessageSquare />{feedbackLabels.revise}</button></div>
      <label>{feedbackLabels.reason}<select value={feedback.reason ?? ''} onChange={(event) => onFeedback({ reason: event.target.value })}><option value="">—</option>{feedbackLabels.reasons.map((reason) => <option key={reason} value={reason}>{reason}</option>)}</select></label>
      <label>{feedbackLabels.comment}<textarea value={feedback.comment ?? ''} placeholder={feedbackLabels.placeholder} onChange={(event) => onFeedback({ comment: event.target.value })} /></label>
    </div>
  </div>
}

type SourceReaderProps = {
  page: number
  onPageChange: (page: number) => void
  evidence: Hypothesis['dto']['evidence']
  labels: { uploaded: string; pages: string; original: string; fragment: string; page: string; sourceText: string }
}

function SourceReader({ page, onPageChange, evidence, labels }: SourceReaderProps) {
  if (!evidence.length) return <div className="embedded-source-reader"><article className="embedded-source-reader__document"><div className="source-page-paper"><h3>Evidence не найден</h3><p>Backend не вернул источник для этой гипотезы.</p></div></article></div>

  const activeEvidence = evidence[Math.min(page - 1, evidence.length - 1)]
  const activePage = { title: `${activeEvidence.file_name}${activeEvidence.page ? ` · стр. ${activeEvidence.page}` : ''}`, text: activeEvidence.quote || activeEvidence.claim }
  const pages = evidence.map((item, index) => ({ title: item.file_name, page: index + 1 }))
  return <div className="embedded-source-reader">
    <aside className="embedded-source-reader__sidebar">
      <button className="source-file-card source-file-card--interactive" onClick={() => onPageChange(3)} aria-label={labels.sourceText}>
        <ExternalLink /><span><strong>{activeEvidence?.file_name ?? 'Источник evidence'}</strong><small>{activeEvidence?.source_file_id ?? 'backend evidence'}</small></span><ChevronRight />
      </button>
      <div className="source-page-list"><strong>{labels.pages}</strong>{pages.map((item) => <button key={`${item.title}-${item.page}`} className={page === item.page ? 'is-active' : ''} onClick={() => onPageChange(item.page)}><FileText /><span>{labels.page} {item.page}</span></button>)}</div>
    </aside>
    <article className="embedded-source-reader__document" id="source-content">
      <div className="source-reader-toolbar"><Status tone="success">{labels.uploaded}</Status><span>{labels.original} · {labels.page} {page} / {pages.length}</span></div>
      <div className="source-page-paper"><span className="source-page-number">{page}</span><h3>{activePage.title}</h3><p>{activePage.text}</p><div className="source-cited-fragment"><strong>{labels.fragment}</strong><p>{activeEvidence?.claim ?? activePage.text}</p></div>{activeEvidence?.paragraph ? <p>Абзац: {activeEvidence.paragraph}. Сила evidence: {activeEvidence.strength}.</p> : null}</div>
      <div className="source-reader-pagination"><Button disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))}><ChevronLeft />{labels.page} {Math.max(1, page - 1)}</Button><Button disabled={page === pages.length} onClick={() => onPageChange(Math.min(pages.length, page + 1))}>{labels.page} {Math.min(pages.length, page + 1)}<ChevronRight /></Button></div>
    </article>
  </div>
}

function ComparisonMatrix({ items, onOpen }: { items: Hypothesis[]; onOpen: (id: string, panel?: string) => void }) {
  const rows = ['Рейтинг','Наука','Инженерия','Механизм','Тест','Новизна','KPI']
  const getCell = (item: Hypothesis, index: number) => {
    if (index === 0) return `${item.rating}/100`
    if (index >= 1 && index <= 4) return `${item.scores[index - 1]}/5`
    if (index === 5) return item.novelty
    return item.kpi
  }
  return <section className="comparison-matrix"><header><span>Критерий</span>{items.slice(0,3).map((item) => <strong key={item.id} title={item.id}>{compactHypothesisId(item.id)}</strong>)}</header>{rows.map((row,index) => <div key={row}><strong>{row}</strong>{items.slice(0,3).map((item) => <button key={item.id} onClick={() => onOpen(item.id,index === 5 ? 'novelty' : 'overview')}>{getCell(item, index)}</button>)}</div>)}</section>
}

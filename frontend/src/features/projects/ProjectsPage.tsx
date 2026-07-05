import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowRight, Beaker, ChevronRight, Search, Sparkles, UploadCloud, Waves } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, MetricStrip, Status } from '../../shared/ui/Primitives'
import { Overlay } from '../../shared/ui/Overlay'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { projectRowFromDto } from '../../shared/api/viewModels'

const icons = [Beaker, Waves, Sparkles]

const copy = {
  ru: {
    data: 'Данные',
    run: 'Прогон',
    finalists: 'Финалисты',
    experiments: 'Эксперименты',
    back: 'Назад',
    next: 'Продолжить',
    create: 'Создать проект',
    task: 'Исследовательская задача',
    result: 'Ожидаемый результат',
    area: 'Область',
    success: 'Критерий успеха',
    constraints: 'Ограничения',
    readyTitle: 'Проект готов к созданию',
    readyText: 'Brief можно уточнить, документы будут добавлены в рабочую область.',
    addFiles: 'Добавить файлы',
    attached: 'Файл прикреплён',
    dropTitle: 'Перетащите файлы сюда или нажмите для выбора',
    dropHint: 'PDF, XLSX, PNG/JPG со схемами оборудования',
  },
  en: {
    data: 'Data',
    run: 'Run',
    finalists: 'Finalists',
    experiments: 'Experiments',
    back: 'Back',
    next: 'Continue',
    create: 'Create project',
    task: 'Research task',
    result: 'Expected result',
    area: 'Area',
    success: 'Success criterion',
    constraints: 'Constraints',
    readyTitle: 'Project is ready',
    readyText: 'The brief can be refined and documents will be added to the workspace.',
    addFiles: 'Add files',
    attached: 'File attached',
    dropTitle: 'Drag files here or click to choose',
    dropHint: 'PDF, XLSX, PNG/JPG with equipment schemes',
  },
  'zh-CN': {
    data: '数据',
    run: '运行',
    finalists: '入围',
    experiments: '实验',
    back: '返回',
    next: '继续',
    create: '创建项目',
    task: '研究任务',
    result: '预期结果',
    area: '领域',
    success: '成功标准',
    constraints: '限制',
    readyTitle: '项目已准备好',
    readyText: '可以继续完善 brief，文档会加入工作区。',
    addFiles: '添加文件',
    attached: '文件已附加',
    dropTitle: '拖放文件或点击选择',
    dropHint: 'PDF、XLSX、PNG/JPG 设备流程图',
  },
} as const

type ProjectDraft = {
  task: string
  result: string
  area: string
  success: string
  constraints: string
}

export default function ProjectsPage() {
  const { t, i18n } = useTranslation()
  const ui = copy[(i18n.language as keyof typeof copy)] ?? copy.ru
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: projectDtos = [], isLoading, isError, refetch } = useQuery({ queryKey: ['projects', i18n.language], queryFn: api.projects })
  const projects = projectDtos.map(projectRowFromDto)
  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<ProjectDraft>({
    task: 'Повысить извлечение ценных компонентов из хвостов флотации',
    result: 'Проверяемый технологический протокол',
    area: 'met',
    success: 'Прирост извлечения не менее 2 п.п.',
    constraints: 'Считать допустимыми только гипотезы по отвальным хвостам, шлакам и металлургическому переделу. Промышленный синтез исключить. Ограничить рост расхода реагента 5% и обязательно объяснять физико-химический механизм, за счёт которого предложение повысит извлечение.',
  })
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesQuery = project.title.toLowerCase().includes(deferredQuery.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'attention' ? project.status === 'attention' : project.status === 'active')
    return matchesQuery && matchesFilter
  }), [deferredQuery, filter, projects])

  const finishCreate = async () => {
    const project = await createProject.mutateAsync({
      task: draft.task,
      result: draft.result,
      area: draft.area,
      success: draft.success,
      constraints: draft.constraints,
      files: attachedFiles,
    })
    setCreateOpen(false)
    setStep(1)
    setAttachedFiles([])
    navigate(`/projects/${project.id}/workspace`)
  }

  const attachFiles = (files: FileList | File[]) => {
    const nextFiles = Array.from(files)
    if (!nextFiles.length) return
    setAttachedFiles((current) => [...current, ...nextFiles].slice(0, 8))
  }

  return <div className="page projects-page">
    <section className="projects-hero">
      <div className="projects-intro"><h1>{t('projects.title')}</h1><p>{t('projects.subtitle')}</p></div>
      <button className="create-feature" onClick={() => setCreateOpen(true)}><span><strong>{t('projects.create')}</strong><small>{t('projects.createHint')}</small></span><span className="arrow-button" aria-hidden="true"><ArrowRight /></span></button>
    </section>
    <div className="project-toolbar"><label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('projects.search')} /></label><div className="segmented">{[['all','projects.all'],['active','projects.active'],['attention','projects.attention']].map(([value,key]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>{t(key)}</button>)}</div></div>
    {isLoading ? <section className="project-list" aria-label="Проекты"><article className="project-row"><div className="project-row__title"><h2>Загрузка проектов…</h2><p>Получаем данные backend</p></div></article></section> : null}
    {isError ? <section className="project-list" aria-label="Ошибка"><article className="project-row"><div className="project-row__title"><h2>Не удалось загрузить проекты</h2><p>Проверьте backend и повторите запрос.</p></div><Button onClick={() => void refetch()}>Повторить</Button></article></section> : null}
    {!isLoading && !isError && !filtered.length ? <section className="project-list" aria-label="Пусто"><article className="project-row"><div className="project-row__title"><h2>Проекты не найдены</h2><p>Создайте первый проект или измените фильтр.</p></div></article></section> : null}
    {!isLoading && !isError ? <section className="project-list" aria-label="Проекты">{filtered.map((project, index) => { const Icon = icons[index % icons.length]; return <article className="project-row" key={project.id} role="button" aria-label={project.title} onClick={() => navigate(`/projects/${project.id}/workspace`)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/projects/${project.id}/workspace`) } }}>
      <div className={`project-symbol project-symbol--${project.tone}`}><Icon /></div><div className="project-row__title"><h2>{project.title}</h2><p>{project.area}</p></div><MetricStrip items={[{label:ui.data,value:`${project.readiness}%`},{label:ui.run,value:project.run},{label:ui.finalists,value:project.finalists},{label:ui.experiments,value:project.experiments}]} /><ChevronRight className="row-arrow" />
    </article>})}</section> : null}
    <Overlay open={createOpen} onClose={() => { setCreateOpen(false); setStep(1) }} title={`${t('projects.create')} · ${step}/3`} kind="modal" footer={<><Button variant="ghost" onClick={() => setStep((value) => Math.max(1, value - 1))}>{ui.back}</Button><Button variant="primary" onClick={() => step < 3 ? setStep((value) => value + 1) : void finishCreate()} disabled={createProject.isPending}>{step < 3 ? ui.next : createProject.isPending ? 'Создаём…' : ui.create}</Button></>}>
      <div className="step-indicator">{[1,2,3].map((value) => <i key={value} className={value <= step ? 'is-active' : ''} />)}</div>
      {step === 1 ? <div className="form-stack">
        <label>{ui.task}<textarea value={draft.task} onChange={(event) => setDraft((current) => ({ ...current, task: event.target.value }))} /></label>
        <label>{ui.result}<input value={draft.result} onChange={(event) => setDraft((current) => ({ ...current, result: event.target.value }))} /></label>
      </div> : step === 2 ? <div className="form-stack">
        <label>{ui.area}<select value={draft.area} onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}><option value="met">Обогащение и металлургия</option></select></label>
        <label>{ui.success}<input value={draft.success} onChange={(event) => setDraft((current) => ({ ...current, success: event.target.value }))} /></label>
        <details open><summary>{ui.constraints}</summary><textarea value={draft.constraints} onChange={(event) => setDraft((current) => ({ ...current, constraints: event.target.value }))} /></details>
      </div> : <div className="create-confirm">
        <Beaker /><h3>{ui.readyTitle}</h3><p>{ui.readyText}</p>
        <label
          className={`upload-compact upload-compact--dropzone ${dragOver ? 'is-dragover' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => { event.preventDefault(); setDragOver(false); attachFiles(event.dataTransfer.files) }}
        >
          <UploadCloud />
          <strong>{ui.dropTitle}</strong>
          <small>{ui.dropHint}</small>
          <input type="file" multiple accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.svg" onChange={(event) => attachFiles(event.target.files ?? [])} />
        </label>
        {attachedFiles.map((file) => <Status key={`${file.name}-${file.lastModified}`} tone="success">{ui.attached}: {file.name}</Status>)}
        {createProject.isError ? <Status tone="danger">Backend отклонил создание проекта. Проверьте поля и файлы.</Status> : null}
      </div>}
    </Overlay>
  </div>
}

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, Download, ExternalLink, FileSpreadsheet, FileText, Image as ImageIcon, Pencil, Play, Plus, Trash2, UploadCloud } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROJECT_ID } from '../../shared/lib/data'
import { Button, SectionHeader, Status } from '../../shared/ui/Primitives'
import { Overlay } from '../../shared/ui/Overlay'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import type { ProjectFileDto } from '../../shared/api/contracts'
import { fileMeta, projectContextFromDto } from '../../shared/api/viewModels'

const copy = {
  ru: {
    allFiles: 'Все файлы',
    edit: 'Изменить',
    graph: 'Граф связей',
    nextStep: 'Следующий шаг',
    warnings: '4 предупреждения',
    warningsHint: 'Наведите, чтобы посмотреть',
    noWarnings: 'Предупреждений нет',
    closePgm: 'Закрыть пробелы по PGM',
    openData: 'Открыть данные',
    memoryHint: '6 похожих кейсов',
    dataTitle: 'Данные проекта',
    addFiles: 'Добавить файлы',
    uploaded: 'Добавлен',
    ready: 'Готов',
    memoryTitle: 'Память института',
    memoryStats: '6 кейсов · 18 экспериментов · 3 противоречия',
    openGraph: 'Открыть граф',
    save: 'Сохранить',
    briefProblem: 'Проблема',
    briefGoal: 'Цель',
    briefCriteria: 'Ограничения и критерии',
    problemLead: 'Ключевой узел:',
    goalLead: 'Рабочая цель:',
    pages: 'Страницы',
    page: 'Стр.',
    original: 'Оригинал',
    translation: 'Перевод',
    documentText: 'Текст документа',
    preview: 'Предпросмотр',
    fileInfo: 'О файле',
    sheets: 'Листы',
    dataSheet: 'Данные',
    previewLoading: 'Читаем содержимое файла…',
    previewError: 'Не удалось открыть содержимое файла',
    localFile: 'Локальный файл',
    sourceFile: 'Исходный файл',
    sourceTitle: 'Фрагмент источника',
    confirmed: 'RU · подтверждено',
    sourceMark: 'Стр. {{page}} · абзац 2 · точное совпадение',
    download: 'Скачать файл',
    openOriginal: 'Открыть исходный файл',
    warningItems: ['Нет повторных анализов PGM', 'Не указан диапазон P80 для двух опытов', 'В схеме не отмечена точка отбора проб', 'В Excel отсутствуют данные по глинистости'],
  },
  en: {
    allFiles: 'All files',
    edit: 'Edit',
    graph: 'Relation graph',
    nextStep: 'Next step',
    warnings: '4 warnings',
    warningsHint: 'Hover to view',
    noWarnings: 'No warnings',
    closePgm: 'Close PGM gaps',
    openData: 'Open data',
    memoryHint: '6 similar cases',
    dataTitle: 'Project data',
    addFiles: 'Add files',
    uploaded: 'Added',
    ready: 'Ready',
    memoryTitle: 'Institute memory',
    memoryStats: '6 cases · 18 experiments · 3 conflicts',
    openGraph: 'Open graph',
    save: 'Save',
    briefProblem: 'Problem',
    briefGoal: 'Goal',
    briefCriteria: 'Constraints and criteria',
    problemLead: 'Core issue:',
    goalLead: 'Working goal:',
    pages: 'Pages',
    page: 'Page',
    original: 'Original',
    translation: 'Translation',
    documentText: 'Document text',
    preview: 'Preview',
    fileInfo: 'File info',
    sheets: 'Sheets',
    dataSheet: 'Data',
    previewLoading: 'Reading file contents…',
    previewError: 'Unable to preview this file',
    localFile: 'Local file',
    sourceFile: 'Source file',
    sourceTitle: 'Source fragment',
    confirmed: 'EN · confirmed',
    sourceMark: 'Page {{page}} · paragraph 2 · exact match',
    download: 'Download file',
    openOriginal: 'Open source file',
    warningItems: ['No repeated PGM assays', 'P80 range is missing for two runs', 'Sampling point is missing from the scheme', 'Clay content is missing from Excel'],
  },
  'zh-CN': {
    allFiles: '全部文件',
    edit: '编辑',
    graph: '关系图',
    nextStep: '下一步',
    warnings: '4 条提醒',
    warningsHint: '悬停查看',
    noWarnings: '暂无提醒',
    closePgm: '补齐 PGM 数据',
    openData: '打开数据',
    memoryHint: '6 个相似案例',
    dataTitle: '项目数据',
    addFiles: '添加文件',
    uploaded: '已添加',
    ready: '就绪',
    memoryTitle: '机构记忆',
    memoryStats: '6 个案例 · 18 个实验 · 3 个冲突',
    openGraph: '打开图谱',
    save: '保存',
    briefProblem: '问题',
    briefGoal: '目标',
    briefCriteria: '限制和标准',
    problemLead: '核心问题：',
    goalLead: '工作目标：',
    pages: '页面',
    page: '页',
    original: '原文',
    translation: '翻译',
    documentText: '文档文本',
    preview: '预览',
    fileInfo: '文件信息',
    sheets: '工作表',
    dataSheet: '数据',
    previewLoading: '正在读取文件内容…',
    previewError: '无法预览此文件',
    localFile: '本地文件',
    sourceFile: '源文件',
    sourceTitle: '来源片段',
    confirmed: 'ZH · 已确认',
    sourceMark: '第 {{page}} 页 · 第 2 段 · 精确匹配',
    download: '下载文件',
    openOriginal: '打开源文件',
    warningItems: ['缺少 PGM 复测数据', '两个实验缺少 P80 范围', '流程图中未标注取样点', 'Excel 中缺少黏土含量数据'],
  },
} as const

function FileKindIcon({ name }: { name: string }) {
  if (name.endsWith('xlsx')) return <FileSpreadsheet />
  if (name.match(/\.(png|jpg|jpeg|svg)$/i)) return <ImageIcon />
  return <FileText />
}

type FileKind = 'pdf' | 'spreadsheet' | 'image' | 'document' | 'text' | 'unsupported'

function getFileKind(name: string): FileKind {
  if (/\.pdf$/i.test(name)) return 'pdf'
  if (/\.(xlsx|xls|csv)$/i.test(name)) return 'spreadsheet'
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'image'
  if (/\.docx$/i.test(name)) return 'document'
  if (/\.(txt|md|json|xml|html?|log|rtf)$/i.test(name)) return 'text'
  return 'unsupported'
}

export default function WorkspacePage() {
  const { t, i18n } = useTranslation()
  const ui = copy[(i18n.language as keyof typeof copy)] ?? copy.ru
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [params, setParams] = useSearchParams()
  const activeProjectId = projectId ?? PROJECT_ID
  const queryClient = useQueryClient()
  const projectQuery = useQuery({ queryKey: ['project', activeProjectId, i18n.language], queryFn: () => api.project(activeProjectId), enabled: Boolean(activeProjectId) })
  const filesQuery = useQuery({ queryKey: ['project-files', activeProjectId], queryFn: () => api.files(activeProjectId), enabled: Boolean(activeProjectId) })
  const project = projectQuery.data
  const files = filesQuery.data ?? []
  const context = project ? projectContextFromDto(project, files) : null
  const tabParam = params.get('tab')
  const tab = ['overview', 'data'].includes(tabParam ?? '') ? tabParam as 'overview' | 'data' : 'overview'
  const setTab = (nextTab: 'overview' | 'data') => {
    const next = new URLSearchParams(params)
    if (nextTab === 'overview') next.delete('tab')
    else next.set('tab', nextTab)
    setParams(next, { replace: true })
  }
  const [briefOpen, setBriefOpen] = useState(false)
  const [source, setSource] = useState<string | null>(null)
  const [sourcePage, setSourcePage] = useState(2)
  const [sourceMode, setSourceMode] = useState<'text' | 'file'>('file')
  const selectedServerFile = files.find((file) => file.name === source)
  const selectedUploadedFile = undefined
  const selectedKind = getFileKind(source ?? '')
  const [draftBrief, setDraftBrief] = useState(project?.brief ?? { problem: '', goal: '', constraints: '', success_criterion: '', domain: 'tailings_and_metallurgy' as const })
  const uploadFiles = useMutation({
    mutationFn: (files: File[]) => api.uploadFiles(activeProjectId, files),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-files', activeProjectId] }),
      ])
    },
  })
  const updateBrief = useMutation({
    mutationFn: () => api.updateBrief(activeProjectId, draftBrief),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] })
      setBriefOpen(false)
    },
  })
  const deleteFile = useMutation({
    mutationFn: (fileId: string) => api.deleteFile(activeProjectId, fileId),
    onSuccess: async (_result, fileId) => {
      if (selectedServerFile?.id === fileId) setSource(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-files', activeProjectId] }),
        queryClient.invalidateQueries({ queryKey: ['hypotheses', activeProjectId] }),
      ])
    },
  })

  const onFilesSelected = (files: FileList | null) => {
    if (!files?.length) return
    uploadFiles.mutate(Array.from(files))
    setTab('data')
  }
  const criteriaItems = context?.criteriaText.split(';').map((item) => item.trim()).filter(Boolean) ?? []

  useEffect(() => {
    if (!project) return
    setDraftBrief(project.brief)
  }, [project])

  if (projectQuery.isLoading) return <div className="page workspace-page"><div className="tab-focus"><h2>Загрузка проекта…</h2><p>Получаем данные backend.</p></div></div>
  if (projectQuery.isError || !context || !project) return <div className="page workspace-page"><div className="tab-focus"><h2>Проект не найден</h2><p>Backend не вернул рабочую область.</p><Button onClick={() => navigate('/projects')}>К проектам</Button></div></div>

  return <div className="page workspace-page">
    <section className="workspace-head">
      <div className="readiness-ring"><strong>{project.readiness}%</strong><span>{t('workspace.readiness')}</span></div>
      <div><h1>{context.title}</h1><p>{context.subtitle}</p></div>
      <div className="workspace-actions"><Button variant="primary" onClick={() => navigate(`/projects/${activeProjectId}/research`)}><Play />{t('workspace.start')}</Button></div>
    </section>

    <div className="tabs page-tabs">
      {([
        ['overview', t('workspace.overview')],
        ['data', t('workspace.data')],
      ] as const).map(([value, label]) => <button key={value} className={tab === value ? 'is-active' : ''} onClick={() => setTab(value)}>{label}</button>)}
    </div>

    {tab === 'overview' ? <div className="workspace-grid workspace-grid--clean">
      <section className="surface document-rail">
        <SectionHeader title={t('workspace.sources')} text={context.filesReady} actions={<label className="icon-button" aria-label={ui.addFiles}><Plus /><input type="file" multiple onChange={(event) => onFilesSelected(event.target.files)} /></label>} />
        <div className="document-list">{context.documents.slice(0, 3).map(([name, meta], index) => <button key={name} onClick={() => { setSource(name); setSourceMode('file'); setSourcePage(index + 1) }}><span>{index + 1}</span><FileKindIcon name={name} /><span><strong>{name}</strong><small>{meta}</small></span><ArrowRight /></button>)}</div>
        <Button onClick={() => setTab('data')}>{ui.allFiles} <ArrowRight /></Button>
      </section>

      <section className="surface problem-brief problem-brief--full">
        <SectionHeader title={t('workspace.brief')} actions={<Button onClick={() => setBriefOpen(true)}><Pencil />{ui.edit}</Button>} />
        <div className="brief-section"><h3>{ui.briefProblem}</h3><p><strong>{ui.problemLead}</strong> {context.problemText}</p></div>
        <div className="brief-section"><h3>{ui.briefGoal}</h3><p><strong>{ui.goalLead}</strong> {context.goalText}</p></div>
        <div className="brief-section brief-section--last"><h3>{ui.briefCriteria}</h3><ul className="brief-bullets">{criteriaItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>
    </div> : tab === 'data' ? <div className="tab-focus tab-focus--compact">
      <div className="tab-focus__head"><UploadCloud /><div><h2>{ui.dataTitle}</h2><p>{context.dataHint}</p></div></div>
      <label className="upload-zone upload-zone--compact">{ui.addFiles}<input type="file" multiple onChange={(event) => onFilesSelected(event.target.files)} /></label>
      {uploadFiles.isPending ? <Status tone="info">Файлы загружаются и обрабатываются…</Status> : null}
      {uploadFiles.isError ? <Status tone="danger">Не удалось загрузить файлы</Status> : null}
      {filesQuery.isLoading ? <Status tone="info">Загрузка списка файлов…</Status> : null}
      {!filesQuery.isLoading && !files.length ? <div className="file-row"><FileText /><strong>Файлы ещё не загружены</strong><span>Добавьте источники для анализа</span><Status tone="warning">Пусто</Status></div> : null}
      {files.map((file) => <div className="file-row file-row--with-delete" key={file.id}>
        <button className="file-row__main" type="button" onClick={() => { setSource(file.name); setSourceMode('file') }}><FileKindIcon name={file.name}/><strong>{file.name}</strong><span>{fileMeta(file)}</span><Status tone={file.status === 'ready' ? 'success' : file.status === 'failed' ? 'danger' : 'warning'}>{file.status === 'ready' ? ui.ready : file.status}</Status></button>
        <button className="file-row__delete" type="button" aria-label={`Удалить ${file.name}`} disabled={deleteFile.isPending} onClick={() => deleteFile.mutate(file.id)}><Trash2 /></button>
      </div>)}
    </div> : null}

    <Overlay open={briefOpen} onClose={() => setBriefOpen(false)} title={t('workspace.brief')} kind="modal" footer={<Button variant="primary" disabled={updateBrief.isPending} onClick={() => updateBrief.mutate()}>{updateBrief.isPending ? 'Сохраняем…' : ui.save}</Button>}>
      <div className="form-stack">
        <label>{ui.briefProblem}<textarea value={draftBrief.problem} onChange={(event) => setDraftBrief((current) => ({ ...current, problem: event.target.value }))} /></label>
        <label>{ui.briefGoal}<textarea value={draftBrief.goal} onChange={(event) => setDraftBrief((current) => ({ ...current, goal: event.target.value }))} /></label>
        <label>{ui.briefCriteria}<textarea value={draftBrief.constraints} onChange={(event) => setDraftBrief((current) => ({ ...current, constraints: event.target.value }))} /></label>
        <label>{i18n.language === 'en' ? 'Success criterion' : i18n.language === 'zh-CN' ? '成功标准' : 'Критерий успеха'}<textarea value={draftBrief.success_criterion} onChange={(event) => setDraftBrief((current) => ({ ...current, success_criterion: event.target.value }))} /></label>
      </div>
    </Overlay>

    <Overlay open={Boolean(source)} onClose={() => setSource(null)} title={source ?? ''} kind="fullscreen">
      <div className="source-viewer">
        <aside>{selectedKind === 'pdf' && !selectedUploadedFile ? <><strong>{ui.pages}</strong>{[1, 2, 3, 4, 5].map((page) => <button key={page} className={sourcePage === page ? 'is-active' : ''} onClick={() => setSourcePage(page)}>{ui.page} {page}</button>)}</> : <><strong>{selectedKind === 'spreadsheet' ? ui.sheets : ui.preview}</strong><div className="source-kind-card"><FileKindIcon name={source ?? ''} /><span><b>{selectedKind === 'spreadsheet' ? ui.dataSheet : ui.sourceFile}</b><small>{selectedServerFile ? fileMeta(selectedServerFile) : ui.localFile}</small></span></div></>}</aside>
        <article>
          <div className="source-toolbar">
            <button aria-pressed={sourceMode === 'text'} className={sourceMode === 'text' ? 'is-active' : ''} onClick={() => setSourceMode((current) => current === 'text' ? 'file' : 'text')}>{ui.preview}</button>
            <button aria-pressed={sourceMode === 'file'} className={sourceMode === 'file' ? 'is-active' : ''} onClick={() => setSourceMode('file')}><ExternalLink />{ui.fileInfo}</button>
            <Status tone="success">{ui.confirmed}</Status>
          </div>
          {sourceMode === 'file' ? <div className="source-file-preview">
            <div className="source-file-card">
              <FileKindIcon name={source ?? ''} /><div><h3>{source}</h3><p>{selectedServerFile ? fileMeta(selectedServerFile) : ui.localFile}</p></div>
              {selectedServerFile ? <a className="button" href={api.fileDownloadUrl(selectedServerFile.id)} download><Download />{ui.download}</a> : null}
            </div>
            <div className="source-file-meta source-file-meta--details">
              <span>{ui.fileInfo}</span>
              <p>{selectedServerFile ? fileMeta(selectedServerFile) : ui.localFile}</p>
              <small>{ui.preview}: содержимое откроется только после нажатия кнопки.</small>
            </div>
          </div> : <FileContentPreview key={`${source}-${sourcePage}`} file={selectedUploadedFile} serverFile={selectedServerFile} name={source ?? ''} kind={selectedServerFile?.kind === 'docx' ? 'document' : selectedKind} labels={{ title: ui.sourceTitle, mark: ui.sourceMark.replace('{{page}}', String(sourcePage)), loading: ui.previewLoading, error: ui.previewError, download: ui.download }} />}
        </article>
      </div>
    </Overlay>
  </div>
}

type PreviewLabels = { title: string; mark: string; loading: string; error: string; download: string }
type SpreadsheetCell = unknown

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!file) { setUrl(''); return }
    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])
  return url
}

function LocalFileDownload({ file, label }: { file: File; label: string }) {
  const url = useObjectUrl(file)
  return <a className="button local-file-download" href={url || undefined} download={file.name}><Download />{label}</a>
}

function parseCsv(text: string) {
  const delimiter = text.includes(';') ? ';' : ','
  return text.split(/\r?\n/).filter(Boolean).slice(0, 100).map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, '')))
}

async function readTextWithEncoding(file: File) {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('windows-1251').decode(buffer)
  }
}

function SpreadsheetPreview({ rows }: { rows: SpreadsheetCell[][] }) {
  if (!rows.length) return <div className="file-preview-empty">В таблице нет строк для отображения.</div>
  return <div className="spreadsheet-preview"><table><thead><tr>{rows[0].map((cell, index) => <th key={`${String(cell)}-${index}`}>{String(cell ?? '—')}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{rows[0].map((_, cellIndex) => <td key={cellIndex}>{row[cellIndex] instanceof Date ? (row[cellIndex] as Date).toLocaleDateString() : String(row[cellIndex] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}

function FileContentPreview({ file, serverFile, name, kind, labels }: { file?: File; serverFile?: ProjectFileDto; name: string; kind: FileKind; labels: PreviewLabels }) {
  const objectUrl = useObjectUrl(file)
  const [rows, setRows] = useState<SpreadsheetCell[][]>([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready')

  useEffect(() => {
    let active = true
    if (serverFile && !file) {
      if (kind === 'pdf' || kind === 'image' || kind === 'unsupported') { setStatus('ready'); setRows([]); setText(''); return }
      setStatus('loading')
      const readServerPreview = async () => {
        try {
          const response = await fetch(api.filePreviewUrl(serverFile.id))
          if (!response.ok) throw new Error('preview failed')
          if (kind === 'spreadsheet') {
            const table = await response.json() as { columns?: unknown[]; rows?: unknown[][] }
            if (active) setRows([table.columns ?? [], ...(table.rows ?? [])])
          } else {
            const contents = await response.text()
            if (active) setText(contents.slice(0, 100000))
          }
          if (active) setStatus('ready')
        } catch {
          if (active) setStatus('error')
        }
      }
      void readServerPreview()
      return () => { active = false }
    }
    if (!file || kind === 'pdf' || kind === 'image' || kind === 'unsupported') { setStatus('ready'); setRows([]); setText(''); return }
    setStatus('loading')
    const read = async () => {
      try {
        if (kind === 'spreadsheet') {
          if (/\.csv$/i.test(file.name)) {
            const contents = await readTextWithEncoding(file)
            if (active) setRows(parseCsv(contents))
          } else {
            const { readSheet } = await import('read-excel-file/browser')
            const contents = await readSheet(file)
            if (active) setRows(contents.slice(0, 100))
          }
        } else if (kind === 'document') {
          const arrayBuffer = await file.arrayBuffer()
          const mammoth = await import('mammoth')
          const result = await mammoth.extractRawText({ arrayBuffer })
          if (active) setText(result.value.slice(0, 100000))
        } else {
          const contents = await readTextWithEncoding(file)
          if (active) setText(contents.slice(0, 100000))
        }
        if (active) setStatus('ready')
      } catch {
        if (active) setStatus('error')
      }
    }
    void read()
    return () => { active = false }
  }, [file, serverFile, kind])

  if (status === 'loading') return <div className="file-preview-state"><UploadCloud /><strong>{labels.loading}</strong></div>
  if (status === 'error') return <div className="file-preview-state is-error"><AlertTriangle /><strong>{labels.error}</strong><span>{name}</span></div>

  const documentParagraphs = text.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean).slice(0, 250)

  return <div className="file-content-preview">
    {file ? <header><span><FileKindIcon name={name} /><strong>{name}</strong></span><LocalFileDownload file={file} label={labels.download} /></header> : serverFile ? <header><span><FileKindIcon name={name} /><strong>{name}</strong></span><a className="button local-file-download" href={api.fileDownloadUrl(serverFile.id)} download><Download />{labels.download}</a></header> : null}
    {kind === 'spreadsheet' ? <SpreadsheetPreview rows={rows} /> : null}
    {kind === 'image' ? serverFile ? <div className="image-file-preview"><img src={api.filePreviewUrl(serverFile.id)} alt={name} /></div> : file && objectUrl ? <div className="image-file-preview"><img src={objectUrl} alt={name} /></div> : <div className="file-preview-state is-error"><AlertTriangle /><strong>{labels.error}</strong><span>Нет файла для предпросмотра.</span></div> : null}
    {kind === 'pdf' ? serverFile ? <iframe className="pdf-file-preview" src={api.fileDownloadUrl(serverFile.id)} title={name} /> : file && objectUrl ? <iframe className="pdf-file-preview" src={objectUrl} title={name} /> : <div className="file-preview-state is-error"><AlertTriangle /><strong>{labels.error}</strong><span>Нет PDF-файла для предпросмотра.</span></div> : null}
    {kind === 'document' ? <section className="docx-file-preview"><span>DOCX · текст документа</span><h3>{name.replace(/\.docx$/i, '')}</h3><div>{documentParagraphs.map((paragraph, index) => index === 0 ? <h4 key={`${index}-${paragraph}`}>{paragraph}</h4> : <p key={`${index}-${paragraph}`}>{paragraph}</p>)}</div></section> : null}
    {kind === 'text' ? <pre className="text-file-preview">{text}</pre> : null}
    {kind === 'unsupported' ? <div className="file-preview-state is-error"><AlertTriangle /><strong>{labels.error}</strong><span>Формат файла не поддерживает безопасный просмотр в браузере. Файл можно скачать без искажения.</span></div> : null}
  </div>
}

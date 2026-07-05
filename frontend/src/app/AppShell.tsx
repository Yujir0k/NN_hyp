import { Bell, Check, ChevronDown, FolderOpen, Search, Settings, UserRound } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NorlabMark } from '../shared/ui/Icons'
import { Overlay } from '../shared/ui/Overlay'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../shared/api/client'
import { projectRowFromDto } from '../shared/api/viewModels'

const nav = [
  ['workspace', 'nav.workspace'], ['research', 'nav.research'], ['hypotheses', 'nav.hypotheses'], ['experiments', 'nav.experiments'],
] as const

const shellCopy = {
  ru: { projectTitle: 'Извлечение металлов из хвостов КГМК', search: 'Поиск', notifications: 'Уведомления', profile: 'Профиль пользователя', models: 'Профиль моделей', language: 'Язык интерфейса', note: 'Оптимизирован для инженерной проверки гипотез. Совместимость подтверждена.' },
  en: { projectTitle: 'Metal recovery from KGMK tailings', search: 'Search', notifications: 'Notifications', profile: 'User profile', models: 'Model profile', language: 'Interface language', note: 'Optimized for engineering hypothesis review. Compatibility confirmed.' },
  'zh-CN': { projectTitle: '从 KGMK 尾矿中回收金属', search: '搜索', notifications: '通知', profile: '用户资料', models: '模型配置', language: '界面语言', note: '已针对工程假设评审优化，兼容性已确认。' },
} as const

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const isProjects = location.pathname === '/projects'
  const copy = shellCopy[(i18n.language as keyof typeof shellCopy)] ?? shellCopy.ru
  const { data: projectDtos = [] } = useQuery({ queryKey: ['projects', i18n.language], queryFn: api.projects })
  const projects = projectDtos.map(projectRowFromDto)
  const activeProjectId = location.pathname.split('/')[2] || projects[0]?.id || ''
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0]
  const activeProjectTitle = activeProject?.title ?? copy.projectTitle
  const changeLanguage = (language: string) => void i18n.changeLanguage(language)

  useEffect(() => {
    if (!switcherOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setSwitcherOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSwitcherOpen(false)
    }
    window.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [switcherOpen])

  const switchProject = (nextProjectId: string) => {
    const currentSection = location.pathname.split('/').at(-1)
    const section = nav.some(([path]) => path === currentSection) ? currentSection : 'workspace'
    setSwitcherOpen(false)
    navigate(`/projects/${nextProjectId}/${section}`)
  }

  return <div className="app-shell">
    <LaunchSplash />
    <header className="app-header">
      <button className="brand" onClick={() => navigate('/projects')} aria-label="NORLAB — проекты"><NorlabMark /><span>NORLAB</span></button>
      <div className="project-switcher-wrap" ref={switcherRef}>
        <button className="project-switcher" onClick={() => setSwitcherOpen((open) => !open)} aria-haspopup="menu" aria-expanded={switcherOpen}>
          <FolderOpen /><span>{isProjects ? t('projects.title') : activeProjectTitle}</span><ChevronDown className={switcherOpen ? 'is-open' : ''} />
        </button>
        {switcherOpen ? <div className="project-switcher-menu" role="menu" aria-label={t('projects.title')}>
          <div className="project-switcher-menu__head"><strong>{t('projects.title')}</strong><span>{projects.length}</span></div>
          {projects.map((project) => <button key={project.id} role="menuitemradio" aria-checked={!isProjects && project.id === activeProject.id} onClick={() => switchProject(project.id)}>
            <span className={`project-switcher-dot project-switcher-dot--${project.tone}`} />
            <span><strong>{project.title}</strong><small>{project.area} · {project.readiness}%</small></span>
            {!isProjects && project.id === activeProject.id ? <Check /> : null}
          </button>)}
          {!projects.length ? <button type="button" disabled><span><strong>Нет проектов</strong><small>Создайте проект на главном экране</small></span></button> : null}
        </div> : null}
      </div>
      <div className="header-tools">
        <button className="header-icon" aria-label={copy.search}><Search /></button>
        <button className="header-icon has-dot" aria-label={copy.notifications}><Bell /></button>
        <div className="language-switch" aria-label="Language"><button onClick={() => changeLanguage('ru')} aria-pressed={i18n.language === 'ru'}>RU</button><span>/</span><button onClick={() => changeLanguage('en')} aria-pressed={i18n.language === 'en'}>EN</button><span>/</span><button onClick={() => changeLanguage('zh-CN')} aria-pressed={i18n.language === 'zh-CN'}>中文</button></div>
        <button className="avatar" onClick={() => setSettingsOpen(true)} aria-label={t('common.settings')}><UserRound /></button>
      </div>
    </header>
    {!isProjects && activeProject ? <nav className="project-nav" aria-label={t('common.project')}>{nav.map(([path, key]) => <NavLink key={path} to={`/projects/${activeProject.id}/${path}`}>{t(key)}</NavLink>)}</nav> : null}
    <main>{children}</main>
    <Overlay open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t('common.settings')} kind="modal">
      <div className="settings-language" aria-label="Language settings">
        <span>{copy.language}</span>
        <div className="segmented"><button className={i18n.language === 'ru' ? 'is-active' : ''} onClick={() => changeLanguage('ru')}>RU</button><button className={i18n.language === 'en' ? 'is-active' : ''} onClick={() => changeLanguage('en')}>EN</button><button className={i18n.language === 'zh-CN' ? 'is-active' : ''} onClick={() => changeLanguage('zh-CN')}>中文</button></div>
      </div>
      <div className="settings-list"><button><UserRound />{copy.profile}<ChevronDown /></button><button><Settings />{copy.models}<ChevronDown /></button><button><Bell />{copy.notifications}<ChevronDown /></button></div>
      <div className="settings-note"><strong>Research profile</strong><p>{copy.note}</p></div>
    </Overlay>
  </div>
}

function LaunchSplash() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 1550)
    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return <div className="launch-splash" aria-label="NORLAB загружается">
    <div className="launch-splash__glow" />
    <div className="launch-splash__logo">
      <NorlabMark />
      <strong>NORLAB</strong>
    </div>
    <p>Фабрика гипотез для R&amp;D</p>
  </div>
}

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: { translation: {
    nav: { workspace: 'Рабочая область', research: 'Исследование', hypotheses: 'Гипотезы', experiments: 'Эксперименты' },
    projects: { title: 'Исследовательские проекты', subtitle: 'Проекты с готовыми данными, гипотезами и экспериментами.', create: 'Создать проект', createHint: 'Новый brief, данные и критерии', search: 'Найти проект', all: 'Все', active: 'Активные', attention: 'Требуют внимания' },
    workspace: { readiness: 'Готовность', lastRun: 'Обновлено сегодня, 12:40', start: 'Запустить', edit: 'Brief', add: 'Данные', overview: 'Обзор', data: 'Данные', memory: 'Память', brief: 'Brief', sources: 'Источники', instituteMemory: 'Память', diagnostics: 'Качество данных' },
    research: { running: 'Исследование идёт', runningText: 'Отбираем до 12 проверяемых гипотез; в финал попадут только валидные кандидаты.', connected: 'Онлайн', cancel: 'Пауза', project: 'К проекту', activity: 'События', collider: 'Воронка гипотез', candidates: 'Кандидаты', finalists: 'Финалисты', all: 'Все', excluded: 'Исключённые' },
    hypotheses: { title: 'Портфель гипотез', summary: '3 финалиста · 1 требует внимания', filters: 'Фильтры', saved: 'Виды', cards: 'Карточки', comparison: 'Сравнение', open: 'Открыть', compare: 'Сравнить', compile: 'Собрать эксперимент' },
    experiments: { title: 'Эксперименты', compile: 'Собрать протокол', report: 'Отчёт', active: '2 активных · 1 ждёт результат', save: 'Сохранить версию' },
    common: { close: 'Закрыть', settings: 'Настройки', project: 'Проект', status: 'Статус', retry: 'Повторить', details: 'Подробнее' },
  }},
  en: { translation: {
    nav: { workspace: 'Workspace', research: 'Research', hypotheses: 'Hypotheses', experiments: 'Experiments' },
    projects: { title: 'Research projects', subtitle: 'From a problem to evidence, hypotheses and a testable experiment.', create: 'Create project', createHint: 'Start a new research project in a few steps', search: 'Find a project', all: 'All', active: 'Active', attention: 'Needs attention' },
    workspace: { readiness: 'Readiness', lastRun: 'Latest research: today, 12:40', start: 'Start research', edit: 'Edit brief', add: 'Add data', overview: 'Overview', data: 'Data', memory: 'Memory', brief: 'Problem Brief', sources: 'Sources and documents', instituteMemory: 'Institute memory', diagnostics: 'Data diagnostics' },
    research: { running: 'Research in progress', runningText: 'Screening up to 12 testable hypotheses; only valid candidates reach the final set.', connected: 'SSE connected', cancel: 'Cancel run', project: 'To project', activity: 'Activity feed', collider: 'Hypothesis collider', candidates: 'Candidates', finalists: 'Finalists', all: 'All', excluded: 'Excluded' },
    hypotheses: { title: 'Hypothesis portfolio', summary: '3 finalists · 4 families · 1 needs attention', filters: 'Filters', saved: 'Saved views', cards: 'Cards', comparison: 'Comparison', open: 'Open', compare: 'Compare', compile: 'Compile experiment' },
    experiments: { title: 'Experiments and report', compile: 'Compile protocol', report: 'Create report', active: '2 active · 1 ready for results', save: 'Save new version' },
    common: { close: 'Close', settings: 'Settings', project: 'Project', status: 'Status', retry: 'Retry', details: 'Details' },
  }},
  'zh-CN': { translation: {
    nav: { workspace: '工作区', research: '研究', hypotheses: '假设', experiments: '实验' },
    projects: { title: '研究项目', subtitle: '从问题到证据、假设与可验证实验。', create: '创建项目', createHint: '只需几步即可开始新的研究项目', search: '查找项目', all: '全部', active: '进行中', attention: '需要关注' },
    workspace: { readiness: '准备度', lastRun: '最近研究：今天 12:40', start: '开始研究', edit: '编辑简报', add: '添加数据', overview: '概览', data: '数据', memory: '记忆', brief: '问题简报', sources: '来源与文档', instituteMemory: '研究所记忆', diagnostics: '数据诊断' },
    research: { running: '研究进行中', runningText: '最多筛选 12 个可验证假设；只有有效候选进入最终集。', connected: 'SSE 已连接', cancel: '取消运行', project: '返回项目', activity: '活动记录', collider: '假设碰撞器', candidates: '候选', finalists: '入围', all: '全部', excluded: '已排除' },
    hypotheses: { title: '假设组合', summary: '3 个入围 · 4 个类别 · 1 个需要关注', filters: '筛选', saved: '已保存视图', cards: '卡片', comparison: '比较', open: '打开', compare: '比较', compile: '生成实验' },
    experiments: { title: '实验与报告', compile: '生成方案', report: '创建报告', active: '2 个进行中 · 1 个等待结果', save: '保存新版本' },
    common: { close: '关闭', settings: '设置', project: '项目', status: '状态', retry: '重试', details: '详情' },
  }},
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('norlab-locale') ?? 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (language) => {
  localStorage.setItem('norlab-locale', language)
  document.documentElement.lang = language
})

export default i18n

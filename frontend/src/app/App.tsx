import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from './AppShell'

const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage'))
const WorkspacePage = lazy(() => import('../features/workspace/WorkspacePage'))
const ResearchPage = lazy(() => import('../features/research/ResearchPage'))
const HypothesesPage = lazy(() => import('../features/hypotheses/HypothesesPage'))
const ExperimentsPage = lazy(() => import('../features/experiments/ExperimentsPage'))

function PageSkeleton() { return <div className="page page-skeleton"><div /><div /><div /></div> }

export function App() {
  return <AppShell><Suspense fallback={<PageSkeleton />}><Routes>
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:projectId/workspace" element={<WorkspacePage />} />
    <Route path="/projects/:projectId/research" element={<ResearchPage />} />
    <Route path="/projects/:projectId/hypotheses" element={<HypothesesPage />} />
    <Route path="/projects/:projectId/experiments" element={<ExperimentsPage />} />
    <Route path="*" element={<Navigate to="/projects" replace />} />
  </Routes></Suspense></AppShell>
}

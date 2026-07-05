// Generated from openapi.mock.yml. Run `npm run api:generate` to refresh the .d.ts source.
export interface paths {
  '/projects': { get: { responses: { 200: { content: { 'application/json': ProjectSummary[] } } } } }
  '/projects/{projectId}/workspace-view': { get: { responses: { 200: { content: { 'application/json': WorkspaceView } } } } }
}
export type Projection = { id: string; version: number; updated_at: string; capabilities: string[]; warnings: string[]; partial: boolean }
export type ProjectSummary = Projection & { name: string; readiness: number; finalists: number; open_experiments: number }
export type WorkspaceView = Projection & { project_name: string; readiness: number; indexed_files: number; memory_matches: number }

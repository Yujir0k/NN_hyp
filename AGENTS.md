# NORLAB: instructions for the next Codex agent

You are inheriting a completed and visually approved React frontend for the NORLAB «Фабрика гипотез» product. Your primary task is to connect a backend without redesigning the UI.

Before editing code, read in this order:

1. `frontend/docs/handoff/FRONTEND_HANDOFF.md`
2. `frontend/docs/handoff/API_INTEGRATION.md`
3. `frontend/docs/handoff/SCREENSHOTS.md`
4. `frontend/src/shared/api/contracts.ts`
5. `frontend/src/shared/api/client.ts`

Key rules:

- Preserve the current routes, layout, typography and modal positioning.
- `/projects` has a deliberately smaller approved scale; internal screens and modals are larger.
- Constraints and clarifications are free-form text, not prompt blocks or bullet-only controls.
- Hypothesis detail and other primary dialogs open in the center.
- File content is hidden by default. The Preview button is a toggle.
- Do not decode DOCX as plain text. Current client preview uses mammoth.
- Ranking weights must always total exactly 100%.
- Run UI must keep elapsed time, ETA, checkpoints and recovery.
- Evidence must remain traceable to `source_file_id`, page and paragraph.
- The knowledge graph must explain source → fact → hypothesis → experiment/risk.
- Preserve URL state: `projectId`, workspace `tab`, hypothesis and inspector `panel`.
- Keep RU/EN/zh-CN switching route-independent.
- Add loading, error, empty and partial states for every backend query.

Current state:

- UI functionality is implemented with code-native mocks.
- Typed transport DTOs and API methods are prepared.
- React Query and Zod are installed but not yet wired to pages.
- Docker builds a static nginx frontend.
- Integration compose/nginx examples are provided but are not active by default.

Recommended integration sequence:

1. Add QueryClientProvider.
2. Projects and project creation.
3. Workspace/brief/files/warnings.
4. File content and preview.
5. Knowledge graph.
6. Research run GET + SSE + actions.
7. Ranking profile and clarifications.
8. Hypotheses/list/detail/evidence/feedback.
9. Experiments/revisions/results.
10. Export jobs.

Run before and after each integration slice:

```bash
cd frontend
npm ci
npm run lint
npm test -- --run
npm run build
```

Use the screenshots in `frontend/docs/handoff/screenshots` as the visual baseline. Do not remove the mock for a screen until its API path, error state and e2e flow work.

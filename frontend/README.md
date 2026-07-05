# NORLAB frontend

React 19 + TypeScript prototype for the five-route NORLAB research workflow. The app uses code-native mock projections while the backend and final OpenAPI contract are being developed.

## Backend handoff

- Full implementation map: [`docs/handoff/FRONTEND_HANDOFF.md`](docs/handoff/FRONTEND_HANDOFF.md)
- API contract and integration order: [`docs/handoff/API_INTEGRATION.md`](docs/handoff/API_INTEGRATION.md)
- Visual baseline: [`docs/handoff/SCREENSHOTS.md`](docs/handoff/SCREENSHOTS.md)
- Transport DTOs: `src/shared/api/contracts.ts`
- Prepared API client: `src/shared/api/client.ts`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

## Checks

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

## Architecture

- `src/app`: shell and route composition.
- `src/features`: route-owned product surfaces.
- `src/shared/ui`: reusable controls and overlays.
- `src/shared/i18n`: RU / EN / zh-CN dictionaries. Locale changes never change the URL.
- `src/shared/api`: typed client seam. `openapi.mock.yml` documents the aggregate projection shape.
- `src/mocks`: the twelve required UI fixture scenarios.

Run `npm run api:generate` after replacing `openapi.mock.yml` with the backend OpenAPI document. Query cache keys should include `projectId`, `runId`, locale and active filters when server reads are connected.

## Visual rules

- Brand blues: `#004C97`, `#0066B3`, `#0077C8`; light accent `#6CC5E9`.
- True-white primary surfaces and `#F3F4F8` section background.
- Onest-like system grotesk fallback stack; comfortable 16–18 px content text.
- 34 px feature radii, 18 px normal radii, and an occasional square lower-left corner.
- One blue gradient feature surface per screen at most.
- Minimal shadow; hierarchy comes from spacing, lines, scale and background.

The generated screen concepts used as the implementation spec live in `docs/concepts`.

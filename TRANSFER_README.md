# NORLAB frontend transfer package

Start here after copying to another PC.

## Contents

- `frontend/` — complete React/Vite frontend source.
- `frontend/docs/handoff/` — implementation map, API contract and 26 screenshots.
- `AGENTS.md` — instructions for the next Codex agent.
- `docker-compose.yml` — current frontend-only container.
- `docker-compose.integration.example.yml` — backend integration template.

## Quick start

```bash
cd frontend
copy .env.example .env.local
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`.

Or run the frontend-only container:

```bash
docker compose up --build
```

Detailed handoff: `frontend/docs/handoff/FRONTEND_HANDOFF.md`.

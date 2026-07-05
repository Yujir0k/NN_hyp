from __future__ import annotations

import json
import sys
import time
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


client = TestClient(app)


def wait_run(run_id: str, timeout_seconds: float = 30) -> dict:
    deadline = time.time() + timeout_seconds
    run = client.get(f'/runs/{run_id}').json()
    while run['status'] not in {'COMPLETED', 'FAILED', 'CANCELLED'} and time.time() < deadline:
        time.sleep(0.2)
        run = client.get(f'/runs/{run_id}').json()
    return run


def main() -> None:
    project = client.post('/projects', json={
        'name': 'NORLAB smoke',
        'problem': 'Потери ценных компонентов в хвостах флотации',
        'target_kpi': 'снизить потери металлов в хвостах',
        'constraints': ['без капитальной замены оборудования'],
        'response_language': 'ru',
    }).json()
    imported = client.post(
        f'/projects/{project["id"]}/documents/import-local',
        json={'path': str(Path('data/organizer_raw')), 'limit': 6},
    ).json()
    run_start = client.post(f'/projects/{project["id"]}/runs', json={'max_finalists': 3, 'use_llm': False}).json()
    run = wait_run(run_start['id'])
    report = client.get(f'/runs/{run["id"]}/report').json()
    print(json.dumps({
        'project_id': project['id'],
        'imported_documents': imported['count'],
        'run_id': run['id'],
        'run_status': run['status'],
        'hypotheses': len(client.get(f'/runs/{run["id"]}/hypotheses').json()),
        'report_id': report.get('id'),
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

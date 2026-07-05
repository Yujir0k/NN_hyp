from __future__ import annotations

import json
import re
import sys
import time
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


client = TestClient(app)


def tokens(text: str) -> set[str]:
    return {item.lower() for item in re.findall(r'[A-Za-zА-Яа-яЁё]{4,}', text)}


def docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as docx:
        xml = docx.read('word/document.xml')
    root = ElementTree.fromstring(xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    return '\n'.join(''.join(node.text or '' for node in paragraph.findall('.//w:t', ns)) for paragraph in root.findall('.//w:p', ns))


def wait_run(run_id: str, timeout_seconds: int = 240) -> dict:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        run = client.get(f'/runs/{run_id}').json()
        if run['status'] in {'COMPLETED', 'FAILED', 'CANCELLED'}:
            return run
        time.sleep(1)
    raise TimeoutError(run_id)


def main() -> None:
    root = Path('data/organizer_raw')
    examples = sorted(root.rglob('Пример *'))
    results = []
    for example in examples:
        xlsx = next(example.glob('Хвосты*.xlsx'), None)
        expert = next(example.glob('Гипотезы*.docx'), None)
        if not xlsx or not expert:
            continue
        project = client.post('/projects', json={
            'name': f'Golden eval {example.name}',
            'problem': 'Generate hypotheses from organizer tailings workbook only.',
            'target_kpi': 'semantic coverage of expert hypotheses',
            'external_research_enabled': False,
        }).json()
        with xlsx.open('rb') as file:
            client.post(f'/projects/{project["id"]}/documents', files={'file': (xlsx.name, file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')})
        run = client.post(f'/projects/{project["id"]}/runs', json={'use_llm': False, 'max_finalists': 3}).json()
        run = wait_run(run['id'])
        hypotheses = client.get(f'/runs/{run["id"]}/hypotheses').json()
        generated_text = ' '.join(item['title'] + ' ' + item['statement'] for item in hypotheses)
        expert_text = docx_text(expert)
        overlap = tokens(generated_text) & tokens(expert_text)
        coverage = len(overlap) / max(1, len(tokens(expert_text)))
        results.append({
            'example': example.name,
            'run_status': run['status'],
            'hypotheses': len(hypotheses),
            'semantic_token_coverage': round(coverage, 4),
            'overlap_terms': sorted(overlap)[:30],
        })
    output = {'evaluated_examples': len(results), 'results': results}
    path = Path('data/state/golden_eval.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

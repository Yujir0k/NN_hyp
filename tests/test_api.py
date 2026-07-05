from pathlib import Path
import time

import pytest
from fastapi.testclient import TestClient

from app.main import (
    app,
    constraint_violations,
    deduplicate,
    is_critic_rejection_reason,
    store,
    unsupported_numeric_claims,
    unsupported_vague_parameter_phrases,
    vision_graph_to_facts,
)


client = TestClient(app)


def wait_run(run_id: str, timeout_seconds: float = 10) -> dict:
    deadline = time.time() + timeout_seconds
    run = client.get(f'/runs/{run_id}').json()
    while run['status'] not in {'COMPLETED', 'FAILED', 'CANCELLED'} and time.time() < deadline:
        time.sleep(0.1)
        run = client.get(f'/runs/{run_id}').json()
    return run


@pytest.fixture(autouse=True)
def isolated_state(tmp_path: Path):
    original_path = store.path
    original_data = store.data
    store.path = tmp_path / 'state.json'
    store.data = {
        'projects': {},
        'documents': {},
        'runs': {},
        'hypotheses': {},
        'experiments': {},
        'entities': {},
        'sources': {},
        'audit': [],
    }
    try:
        yield
    finally:
        store.path = original_path
        store.data = original_data


def test_health_and_model_profile() -> None:
    response = client.get('/health')
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'ok'
    assert body['model_gateway']['generator']


def test_project_upload_run_and_projections(tmp_path: Path) -> None:
    project_response = client.post('/projects', json={
        'name': 'Хвосты тест',
        'problem': 'Потери золота и меди в хвостах после флотации',
        'target_kpi': 'снизить потери Au в хвостах',
        'constraints': ['без капитальной замены оборудования'],
        'response_language': 'ru',
        'external_research_enabled': False,
    })
    assert project_response.status_code == 200
    project_id = project_response.json()['id']

    file_path = tmp_path / 'sample.txt'
    file_path.write_text('Флотация хвостов. pH влияет на извлечение Au и Cu. Гидроциклон задает крупность.', encoding='utf-8')
    with file_path.open('rb') as file:
        upload_response = client.post(
            f'/projects/{project_id}/documents',
            files={'file': ('sample.txt', file, 'text/plain')},
        )
    assert upload_response.status_code == 200
    assert upload_response.json()['facts']

    run_response = client.post(f'/projects/{project_id}/runs', json={'max_finalists': 2, 'use_llm': False})
    assert run_response.status_code == 200
    run = wait_run(run_response.json()['id'])
    assert run['status'] == 'COMPLETED'

    hypotheses = client.get(f'/runs/{run["id"]}/hypotheses').json()
    assert len(hypotheses) >= 6
    assert hypotheses[0]['supporting_evidence']

    workspace = client.get(f'/projects/{project_id}/workspace-view').json()
    assert workspace['summary']['documents'] == 1

    report = client.get(f'/runs/{run["id"]}/report').json()
    assert 'markdown' in report


def test_xlsx_errors_are_data_quality_facts(tmp_path: Path) -> None:
    from openpyxl import Workbook

    project_id = client.post('/projects', json={'name': 'xlsx', 'problem': 'Проверить хвосты', 'external_research_enabled': False}).json()['id']
    workbook = Workbook()
    sheet = workbook.active
    sheet['A1'] = '#REF!'
    sheet['B1'] = 'извлечение Au'
    path = tmp_path / 'tailings.xlsx'
    workbook.save(path)

    with path.open('rb') as file:
        response = client.post(
            f'/projects/{project_id}/documents',
            files={'file': ('tailings.xlsx', file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')},
        )
    assert response.status_code == 200
    facts = response.json()['facts']
    assert any(item['type'] == 'data_quality' for item in facts)


def test_semantic_deduplication_preserves_traceable_rejection() -> None:
    hypotheses = [
        {
            'title': 'Уменьшение P80 помола',
            'statement': 'Если уменьшить P80, раскрытие минералов и извлечение никеля должны вырасти.',
            'intervention': {'description': 'Снизить P80 на существующей мельнице.'},
        },
        {
            'title': 'Тонкий помол для раскрытия никеля',
            'statement': 'Если увеличить тонкость помола, извлечение никеля должно вырасти за счёт раскрытия.',
            'intervention': {'description': 'Настроить существующий контур измельчения.'},
        },
        {
            'title': 'Регулирование pH флотации',
            'statement': 'Если изменить pH, селективность флотации никеля должна вырасти.',
            'intervention': {'description': 'Проверить несколько режимов pH.'},
        },
    ]

    unique, duplicates = deduplicate(hypotheses)

    assert len(unique) == 2
    assert len(duplicates) == 1
    assert duplicates[0]['status'] == 'DUPLICATE'
    assert duplicates[0]['rejection_stage'] == 'deduplication'
    assert 'Смысловой дубль' in duplicates[0]['rejection_reasons'][0]


def test_missing_measurements_are_not_a_fatal_critic_rejection() -> None:
    assert not is_critic_rejection_reason(
        'Не указаны текущие диапазоны pH, поэтому невозможно оценить ожидаемый эффект.'
    )
    assert is_critic_rejection_reason('Гипотеза нарушает ограничение проекта и требует промышленного синтеза.')


def test_numeric_claim_validator_accepts_supported_equivalent_units() -> None:
    allowed = 'Target: recovery increase >= 2 percentage points. Source range: sand nozzle diameter 8-12 mm.'

    assert unsupported_numeric_claims(
        'Прирост извлечения не менее 2 п.п.; проверить насадки 8 мм и 12 мм.',
        allowed,
    ) == []
    assert '5 %' in unsupported_numeric_claims('Добавить 5 % нового реагента.', allowed)


def test_vague_parameters_and_equipment_replacement_are_rejected() -> None:
    assert unsupported_vague_parameter_phrases(
        'Вводить короткие перемешивания каждые несколько минут при кондиционировании хвостов.'
    )
    assert not unsupported_vague_parameter_phrases('Увеличить время кондиционирования до 8 мин.')
    assert constraint_violations(
        'Проверить замену классификаторов на более производительные.',
        ['без смены технологического контура'],
    )


def test_vision_graph_is_converted_to_evidence_facts() -> None:
    document = {'id': 'doc_image', 'filename': 'Схема 1.png', 'project_id': 'proj'}
    graph = {
        'nodes': [
            {'type': 'Equipment', 'label': 'Гидроциклон', 'confidence': 0.91},
            {'type': 'ProcessStage', 'label': 'Контрольная флотация', 'confidence': 0.84},
        ],
        'edges': [
            {'source': 'Гидроциклон', 'target': 'Контрольная флотация', 'type': 'FLOWS_TO', 'confidence': 0.8},
        ],
        'uncertain_items': [],
    }

    fragments, facts = vision_graph_to_facts(document, graph)

    assert fragments
    assert all(fragment['extraction_method'] == 'vision:qwen' for fragment in fragments)
    assert any(fact['type'] == 'equipment' and 'Гидроциклон' in fact['statement'] for fact in facts)
    assert any('Гидроциклон → Контрольная флотация' in fact['statement'] for fact in facts)
    assert all(fact['provenance']['extraction_method'] == 'vision:qwen' for fact in facts)

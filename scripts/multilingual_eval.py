from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import gateway  # noqa: E402


TASKS = {
    'ru': 'Сформулируй одну проверяемую гипотезу по снижению потерь металлов в хвостах флотации на основе allowed_evidence. Верни JSON.',
    'en': 'Create one testable hypothesis for reducing metal losses in flotation tailings using allowed_evidence only. Return JSON.',
    'zh': '仅根据 allowed_evidence 提出一个用于降低浮选尾矿中金属损失的可验证假设。返回 JSON。',
}

EVIDENCE = [
    {'id': 'ev_tailings', 'statement': 'В хвостах флотации наблюдаются потери ценных металлов; требуется лабораторная проверка режимных факторов.'},
    {'id': 'ev_constraints', 'statement': 'Ограничения: без капитальной замены оборудования, использовать доступное лабораторное оборудование.'},
]


async def main() -> None:
    results = {}
    for language, prompt in TASKS.items():
        result = await gateway.chat_json(
            'generator',
            [
                {'role': 'system', 'content': 'Return a JSON object only. Keys: language, hypothesis, kpi, evidence_ids, constraint_satisfaction. Use only allowed_evidence ids. Do not invent numeric improvements or exact percentages.'},
                {'role': 'user', 'content': json.dumps({'prompt': prompt, 'allowed_evidence': EVIDENCE}, ensure_ascii=False)},
            ],
            {'language': language, 'hypothesis': None, 'kpi': None, 'evidence_ids': []},
        )
        evidence_ids = result.get('evidence_ids') if isinstance(result.get('evidence_ids'), list) else []
        unsupported_numbers = any(char.isdigit() for char in str(result.get('hypothesis', '')))
        results[language] = {
            'valid_json': isinstance(result, dict),
            'has_hypothesis': bool(result.get('hypothesis')),
            'has_evidence': bool(evidence_ids),
            'no_unsupported_numbers': not unsupported_numbers,
            'response': result,
        }
    output = {'languages': results}
    path = Path('data/state/multilingual_eval.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(output, ensure_ascii=True, indent=2))
    if not all(item['valid_json'] and item['has_hypothesis'] and item['has_evidence'] and item['no_unsupported_numbers'] for item in results.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    asyncio.run(main())

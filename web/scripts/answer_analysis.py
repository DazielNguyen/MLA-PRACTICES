"""Load explicit, option-by-option explanations and validate their coverage."""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
GENERIC = (
    'This is correct because it directly addresses the requirement',
    'This option does not meet the requirements as effectively',
)

def normalize(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())

def source_analysis(question):
    text = question['explanation']
    concept = re.search(r'Key Concept:\s*(.*?)\s*Why this is correct:', text, re.S)
    if not concept:
        return {'keyConcept': '', 'options': {}}
    concept = re.sub(r'^-\s*', '', concept[1].strip(), flags=re.M)
    result = {'keyConcept': concept, 'options': {}}
    options = {normalize(v): k for k, v in question['choices'].items()}
    for label, reason in re.findall(r'^- (.*?) — (.*?)(?=\n- |\nWhy other options|\Z)', text, re.M | re.S):
        letter = options.get(normalize(label))
        if letter and not any(phrase in reason for phrase in GENERIC):
            result['options'][letter] = reason.strip()
    return result

def collect(bank):
    authored = {}
    for file in sorted((HERE / 'explanations').glob('*.json')):
        for key, value in json.loads(file.read_text()).items():
            assert key not in authored, f'Duplicate authored analysis: {key}'
            authored[key] = value
    result, pending = {}, {}
    for q in bank:
        value = source_analysis(q)
        edit = authored.get(str(q['id']))
        if isinstance(edit, list):
            assert len(edit) == len(q['choices']) + 1, f'Option count mismatch: {q["id"]}'
            value = {'keyConcept': edit[0], 'options': dict(zip(q['choices'], edit[1:]))}
        elif isinstance(edit, dict):
            if 'keyConcept' in edit: value['keyConcept'] = edit['keyConcept']
            value['options'].update(edit.get('options', {}))
        assert set(value['options']) <= set(q['choices']), f'Unknown option: {q["id"]}'
        for part in [value['keyConcept'], *value['options'].values()]:
            assert isinstance(part, str), f'Analysis must be text: {q["id"]}'
            assert not any(phrase.lower() in part.lower() for phrase in GENERIC), f'Generic analysis: {q["id"]}'
        missing = [k for k in q['choices'] if not value['options'].get(k, '').strip()]
        if not value['keyConcept'].strip(): missing.insert(0, 'keyConcept')
        if missing: pending[str(q['id'])] = missing
        result[q['id']] = value
    assert set(authored) <= {str(q['id']) for q in bank}, 'Authored analysis references an unknown question'
    return result, pending

def attach(bank):
    reviews = json.loads((HERE / 'answer-review.json').read_text())
    assert set(reviews) <= {str(q['id']) for q in bank}
    for q in bank:
        edit = reviews.get(str(q['id']), {})
        assert set(edit) <= {'status', 'answer', 'sources', 'notes'}, f'Unsupported review field: {q["id"]}'
        if edit:
            assert edit.get('status') in {'checked', 'historical', 'review'}, f'Invalid reviewed status: {q["id"]}'
            assert edit.get('sources'), f'Review requires references: {q["id"]}'
            assert all(s.get('title') and s.get('url', '').startswith('https://') for s in edit['sources'])
            assert all(isinstance(n, str) and n.strip() for n in edit.get('notes', []))
            if edit['status'] == 'review':
                assert edit.get('notes'), f'Unresolved key requires a reason: {q["id"]}'
            q['notes'] = list(dict.fromkeys([
                *[n for n in q['notes'] if not n.startswith('Đáp án và giải thích nhập từ ZIP;')],
                *edit.get('notes', []),
            ]))
            q['sources'] = list({s['url']: s for s in [*q['sources'], *edit['sources']]}.values())
            q['status'] = edit['status']
            if 'answer' in edit:
                q['answer'] = edit['answer']
        assert len(q['answer']) == len(set(q['answer'])) and set(q['answer']) <= set(q['choices'])
        if q['status'] != 'review':
            assert len(q['answer']) == q['required'], f'Answer cardinality mismatch: {q["id"]}'
    analyses, pending = collect(bank)
    assert not pending, f'Incomplete answer analyses: {pending}'
    for q in bank:
        q['analysis'] = analyses[q['id']]
        assert set(q['analysis']['options']) == set(q['choices'])
        # Keep the legacy string field useful for consumers that do not render analysis.
        # Original source explanations remain in the source records, not in the study UI.
        q['explanation'] = 'Key Concept: ' + q['analysis']['keyConcept'] + '\n\n' + '\n\n'.join(
            f"{letter}. {q['choices'][letter]} — {reason}"
            for letter, reason in q['analysis']['options'].items()
        )

if __name__ == '__main__':
    bank = json.loads((HERE.parent / 'src/data/questions.json').read_text())
    _, pending = collect(bank)
    print(json.dumps({'total':len(bank), 'complete':len(bank)-len(pending), 'remaining':len(pending)}, indent=2))
    destination = HERE.parent.parent / 'tmp/answer-analysis/pending.json'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(pending,indent=2)+'\n')

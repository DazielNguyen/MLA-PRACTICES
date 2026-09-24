"""Import the user's private supplemental bank; duplicate labels never merge IDs."""
import hashlib
import json
import re
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
PRIVATE = APP / 'scripts/udemy'
SOURCE = APP.parent / 'MLA-C01-195-cau-hoi.json'
FIRST_ID = 701
DOMAINS = {
    'Data Preparation for Machine Learning (ML)': 'Data Preparation',
    'ML Model Development': 'ML Model Development',
    'Deployment and Orchestration of ML Workflows': 'Deployment and Orchestration',
    'ML Solution Monitoring, Maintenance, and Security': 'Monitoring, Maintenance and Security',
}


def normalized(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())


def load_udemy(existing):
    source = json.loads(SOURCE.read_text())
    records = source['questions']
    assert len(records) == source['metadata']['question_count'] == 195
    assert [q['number'] for q in records] == list(range(1, 196))
    hashes = json.loads((PRIVATE / 'source-sha256.json').read_text())
    corrections = json.loads((PRIVATE / 'corrections.json').read_text())
    matches = json.loads((PRIVATE / 'duplicates.json').read_text())
    translations = {}
    for file in sorted((PRIVATE / 'vi').glob('*.json')):
        chunk = json.loads(file.read_text())
        assert not translations.keys() & chunk.keys(), f'Duplicate Udemy translation: {file.name}'
        translations.update(chunk)
    assert set(translations) == {str(q['number']) for q in records}, 'Complete all Udemy Vietnamese explanations before publishing'
    imported = []
    for q in records:
        number = q['number']
        digest = hashlib.sha256(json.dumps(q, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        assert digest == hashes[str(number)], f'Review changed Udemy source #{number}'
        assert q['images'] == [], 'New source images require an explicit asset import'
        choices = {c['label']: c['text'] for c in q['choices']}
        answer = [c['label'] for c in q['choices'] if c['is_correct']]
        assert len(choices) == len(q['choices']) and set(choices) == set('ABCDEF'[:len(choices)])
        assert answer and answer == [c['label'] for c in q['correct_answers']]
        assert all(choices[c['label']] == c['text'] for c in q['correct_answers'])
        assert len({normalized(v) for v in choices.values()}) == len(choices)
        vi = translations[str(number)]
        assert len(vi) == len(choices) + 1 and all(isinstance(v, str) and len(v.strip()) > 20 for v in vi)
        fix = corrections.get(str(number), {})
        notes = ['Nguồn Udemy theo tệp do người dùng cung cấp. Khóa đáp án được giữ theo nguồn; bản dịch tiếng Việt tóm lược ý chính và phân tích từng lựa chọn.']
        if fix.get('note'):
            notes.append(fix['note'])
        options = dict(zip(choices, vi[1:]))
        imported.append({
            'id': FIRST_ID + number - 1, 'page': None, 'collection': 'mla', 'origin': 'udemy',
            'sourceIds': [number], 'sourceName': 'Udemy · MLA-C01 · 195 câu',
            'domain': DOMAINS[q['domain']], 'text': fix.get('text', q['question']),
            'choices': choices, 'answer': answer, 'required': len(answer), 'status': 'source',
            **({'conditionalAnswer': True} if fix.get('conditionalAnswer') else {}),
            'analysis': {'keyConcept': vi[0], 'options': options}, 'explanationLanguage': 'vi',
            'explanation': '\n\n'.join(['Đáp án theo bộ đề: ' + ' + '.join(answer) + '.', 'Ý chính: ' + vi[0], *[f'{letter}. {reason}' for letter, reason in options.items()]]),
            'sources': [{'title': url.split('/')[2] + ' · ' + url.rstrip('/').split('/')[-1], 'url': url} for url in dict.fromkeys(q['references'] + fix.get('references', [])) if url.startswith('https://')],
            'notes': notes, 'images': [],
        })
    base = [q for q in existing if q.get('origin') != 'original']
    source_records = json.loads((APP.parent / 'output/merged/MLA_SOURCE_RECORDS.json').read_text())
    originals = {q['id']: q for q in source_records}
    audit = []
    for question in imported:
        number = question['sourceIds'][0]
        source_id = matches.get(str(number))
        if source_id is None:
            continue
        retained = next(q for q in base if source_id in q['sourceIds'])
        exact = normalized(records[number - 1]['question']) == normalized(originals[source_id]['text'])
        kind = 'exact' if exact else 'variant'
        source_key = {normalized(retained['choices'][a]) for a in retained['answer']}
        new_key = {normalized(question['choices'][a]) for a in question['answer']}
        conflict = exact and source_key != new_key
        question['duplicateMatches'] = [{'questionId': retained['id'], 'sourceLabel': f'Bộ 286 · Q{source_id:03d}', 'kind': kind, 'answerConflict': conflict}]
        retained.setdefault('duplicateMatches', []).append({'questionId': question['id'], 'sourceLabel': f'Udemy · Q{number:03d}', 'kind': kind, 'answerConflict': conflict})
        if conflict:
            question['notes'].append('Câu trùng nguyên văn có khác biệt về nội dung đáp án giữa hai nguồn; mỗi bản giữ khóa riêng để học và đối chiếu.')
        audit.append({'udemy': number, 'questionId': question['id'], 'source286': source_id, 'retainedId': retained['id'], 'kind': kind, 'answerConflict': conflict})
    assert len({q['id'] for q in existing + imported}) == len(existing) + len(imported)
    assert all('duplicateOf' not in q and 'relatedIds' not in q for q in imported), 'Keep supplemental attempts independent'
    (PRIVATE / 'import-audit.json').write_text(json.dumps({'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'imported': len(imported), 'removed': 0, 'formatRepairs': [n for n, fix in corrections.items() if 'text' in fix], 'duplicates': audit}, ensure_ascii=False, indent=2) + '\n')
    return imported

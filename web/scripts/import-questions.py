"""Build the study bank deterministically; never renumber existing question IDs."""
from pathlib import Path, PurePosixPath
from collections import Counter, defaultdict
import hashlib
import json
import re
import shutil
import zipfile
from answer_analysis import attach

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parent
OUTPUT = ROOT / 'output/merged'
ZIP = ROOT / 'MLA-C01_Web_Study_Bundle.zip'
MARKDOWN = 'MLA-C01_286_CauHoi_DapAn_Hints_Web.md'


def normalized(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())


def plain(text):
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', text)
    text = re.sub(r'<[^>]*>', '', text)
    return text.replace('**', '').replace('`', '').strip()


def legacy_bank():
    records = json.loads((ROOT / 'tmp/pdfs/reviewed_questions.json').read_text())
    questions = []
    for q in records:
        images = []
        for number, image in enumerate(q['images'], 1):
            filename = f"q{q['id']:03d}_{number}{Path(image['source']).suffix}"
            destination = APP / 'public/images' / filename
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / image['source'], destination)
            images.append({'url': '/images/' + filename, 'slot': image['slot'], 'alt': q['image_descriptions'].get(image['slot'], f"Question {q['id']} image")})
        questions.append({
            'id': q['id'], 'page': q['page'], 'text': q['question'],
            'choices': q['choices'], 'answer': list(q['answer']),
            'required': q['expected_answers'], 'status': q['status'],
            'explanation': q['explanation'], 'sources': q['sources'],
            'notes': q['source_notes'], 'images': images,
            'collection': 'mls', 'sourceIds': [q['id']],
            'sourceName': 'Machine Learning - Specialty Exam.pdf',
        })
    assert [q['id'] for q in questions] == list(range(1, 333))
    return questions


def parse_bundle(archive):
    for entry in archive.infolist():
        path = PurePosixPath(entry.filename)
        assert not path.is_absolute() and '..' not in path.parts
        assert (entry.external_attr >> 16) & 0o170000 != 0o120000
    assert archive.testzip() is None
    content = archive.read(MARKDOWN).decode('utf-8-sig')
    blocks = re.split(r'(?=^## Q\d{3} -)', content, flags=re.M)[1:]
    records = []
    for block in blocks:
        source_id = int(re.match(r'## Q(\d+)', block)[1])
        meta = dict(re.findall(r'^(\w+): (.+)$', re.search(r'<!-- web-quiz-meta\n(.*?)-->', block, re.S)[1], re.M))
        question = re.search(r'\*\*Câu hỏi:\*\* (.*?)\n### Lựa chọn', block, re.S)[1].strip()
        choices = dict(re.findall(r'^- \[ \] \*\*([A-Z])\.\*\* (.*?)(?=\n- \[ \]|\n<details>)', block, re.M | re.S))
        answer = re.findall('[A-Z]', re.search(r'^### Đáp án đúng: (.+)', block, re.M)[1])
        explanation = re.search(r'### Explanation từ nguồn\n(.*?)\n</details>', block, re.S)[1]
        hint = re.search(r'<summary><strong>Hint.*?</summary>\n(.*?)\n</details>', block, re.S)[1]
        images = []
        for alt, path in re.findall(r'!\[(.*?)\]\((.*?)\)', question):
            data = archive.read(path)
            images.append({'source': path, 'alt': alt, 'sha256': hashlib.sha256(data).hexdigest()})
        records.append({'id': source_id, 'text': plain(question), 'choices': {k: plain(v) for k, v in choices.items()},
                        'answer': answer, 'required': int(meta['correct_count']), 'meta': meta,
                        'explanation': plain(explanation), 'hint': plain(hint), 'images': images})
    assert [q['id'] for q in records] == list(range(1, 287))
    for q in records:
        assert q['required'] == len(set(q['answer']))
        assert set(q['answer']) <= set(q['choices'])
        assert len(q['choices']) >= 4 and all(q['choices'].values())
        assert len({normalized(v) for v in q['choices'].values()}) == len(q['choices'])
    return records


def signature(q):
    return (normalized(q['text']), tuple(sorted(normalized(v) for v in q['choices'].values())),
            tuple(sorted(i['sha256'] for i in q['images'])))


def merge_bundle(old):
    review = json.loads((APP / 'scripts/bank-review.json').read_text())
    with zipfile.ZipFile(ZIP) as archive:
        source = parse_bundle(archive)
        by_id = {q['id']: q for q in source}
        canonical = {}
        seen = {}
        for q in source:
            sig = signature(q)
            canonical[q['id']] = seen.setdefault(sig, q['id'])
        # These pairs were inspected. No fuzzy match is merged automatically.
        for alias, target in review['aliases'].items():
            canonical[int(alias)] = target
        groups = defaultdict(list)
        for q in source:
            groups[canonical[q['id']]].append(q)
        imported = []
        duplicates = []
        for source_id, versions in sorted(groups.items()):
            q = by_id[source_id]
            answer_sets = [sorted(normalized(v['choices'][a]) for a in v['answer']) for v in versions]
            answer_text_differs = any(a != answer_sets[0] for a in answer_sets[1:])
            conflict = answer_text_differs and source_id not in review.get('equivalentAnswerGroups', [])
            if len(versions) > 1:
                duplicates.append({'canonical': source_id, 'sourceIds': [v['id'] for v in versions],
                                   'answerConflict': conflict, 'answerTextDiffers': answer_text_differs,
                                   'matchMethod': 'manual' if any(str(v['id']) in review['aliases'] for v in versions) else 'exact_normalized',
                                   'versions': [
                                       {'id': v['id'], 'answer': v['answer'], 'answerText': [v['choices'][a] for a in v['answer']]} for v in versions]})
            images = []
            for im in q['images']:
                filename = 'mla-' + im['sha256'][:16] + Path(im['source']).suffix
                (APP / 'public/images' / filename).write_bytes(archive.read(im['source']))
                images.append({'url': '/images/' + filename, 'slot': 'question', 'alt': im['alt']})
            notes = ['Đáp án và giải thích nhập từ ZIP; chưa được kiểm chứng toàn bộ với tài liệu AWS.']
            if images:
                notes.append('Câu gốc dạng ghép hoặc sắp xếp. Chọn một phương án chứa toàn bộ tổ hợp đúng.')
            item = {'id': 332 + source_id, 'page': None, 'collection': 'mla', 'sourceIds': [v['id'] for v in versions],
                    'sourceName': MARKDOWN, 'domain': q['meta']['domain'], 'text': q['text'], 'choices': q['choices'],
                    'answer': q['answer'], 'required': q['required'], 'status': 'source',
                    'hint': q['hint'], 'explanation': q['explanation'], 'sources': [], 'notes': notes, 'images': images}
            if str(source_id) in review['overrides']:
                item.update(review['overrides'][str(source_id)])
            elif conflict:
                raise ValueError(f'Unresolved answer conflict at MLA Q{source_id}')
            imported.append(item)
        (OUTPUT / 'MLA_SOURCE_RECORDS.json').write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n')
        cross_exact = [{'mls': a['id'], 'mla': b['id']} for a in old for b in source if normalized(a['text']) == normalized(b['text'])]
        return imported, {'zipSha256': hashlib.sha256(ZIP.read_bytes()).hexdigest(), 'inputCount': len(source),
                          'retainedCount': len(imported), 'removedDuplicates': len(source) - len(imported),
                          'duplicates': duplicates, 'crossExact': cross_exact, 'manualReview': review['notes']}


def write_exports(bank):
    md = ['# Bộ câu hỏi tổng hợp MLS và MLA-C01', '',
          f'{len(bank)} câu để học. Biến thể đã gộp giữ mã cũ trong dữ liệu lịch sử. Câu MLA dùng mã 332 + số câu nguồn.', '',
          'Mỗi câu có phân tích tiếng Anh cho từng lựa chọn. “Cần xác minh” không dùng để tính điểm.', '']
    cards = []
    statuses = {'checked': 'Đã đối chiếu', 'historical': 'Dịch vụ cũ', 'source': 'Theo nguồn', 'review': 'Cần xác minh'}
    for q in bank:
        label = ('MLS' if q['collection'] == 'mls' else 'MLA-C01') + ' Q' + '/Q'.join(f'{i:03}' for i in q['sourceIds'])
        md += [f"## #{q['id']} · {label}", '', f"Trạng thái: **{statuses[q['status']]}** · Chọn {q['required']}.", '', q['text'], '']
        md += [f"![{im['alt']}](../../web/public{im['url']})" for im in q['images'] if im['slot'] == 'question']
        for letter, text in q['choices'].items():
            md += [f'{letter}. {text}']
            md += [f"![{im['alt']}](../../web/public{im['url']})" for im in q['images'] if im['slot'] == letter]
        analysis = q['analysis']
        answer_label = 'Source answer' if q['status'] == 'source' else 'Correct answer'
        md += ['', '<details><summary>Answer and explanation</summary>', '',
               'Answer not finalized. This question is not scored.' if q['status'] == 'review' else answer_label + ': ' + ' | '.join(f"**{a}. {q['choices'][a]}**" for a in q['answer']), '',
               '### Explanation and distractor analysis', '', '#### Key Concept', '', analysis['keyConcept'], '']
        groups = [('Option-by-option analysis', list(q['choices']))] if q['status'] == 'review' else [
            ('Why the source selects this answer' if q['status'] == 'source' else 'Why this is correct', q['answer']),
            ('Why other options are incorrect', [a for a in q['choices'] if a not in q['answer']])]
        for heading, letters in groups:
            md += [f'#### {heading}', '']
            md += [f"- **{a}. {q['choices'][a]}** — {analysis['options'][a]}" for a in letters]
            md += ['']
        if q['notes']:
            md += ['#### Notes', '', *[f'- {note}' for note in q['notes']], '']
        md += ['#### References', '', *[f"- [{s['title']}]({s['url']})" for s in q['sources']]]
        md += ['', '</details>', '']
        front = f"[{label}] {q['text']} " + ' '.join(f'{a}. {t}' for a, t in q['choices'].items())
        answer_text = ' | '.join(f"{a}. {q['choices'][a]}" for a in q['answer']).rstrip('. ')
        back = f"[{statuses[q['status']]}] " + ('Answer not finalized. ' if q['status'] == 'review' else answer_label + ': ' + answer_text + '. ')
        back += 'Key Concept: ' + analysis['keyConcept'] + ' '
        for heading, letters in groups:
            back += heading + ': ' + ' | '.join(f"{a}. {q['choices'][a]} — {analysis['options'][a]}" for a in letters) + ' '
        if q['notes']: back += 'Notes: ' + ' | '.join(q['notes']) + ' '
        if q['images']: front += ' [Có hình: xem bản Markdown tổng hợp.]'
        cards.append(re.sub(r'\s+', ' ', front).strip() + '\t' + re.sub(r'\s+', ' ', back).strip())
    (OUTPUT / 'ML_COMBINED.md').write_text('\n'.join(md).rstrip() + '\n')
    (OUTPUT / 'QUIZLET_COMBINED.md').write_text('\n'.join(cards) + '\n')


def group_study_duplicates(bank):
    """Exclude reviewed variants from new study pools without changing old answers."""
    decisions = json.loads((APP / 'scripts/study-duplicates.json').read_text())
    by_id = {q['id']: q for q in bank}
    groups = defaultdict(list)
    audit = []
    for alias, decision in decisions.items():
        alias, canonical = int(alias), decision['canonical']
        assert alias != canonical and alias in by_id and canonical in by_id
        assert str(canonical) not in decisions, 'Duplicate chains are not supported'
        archived, retained = by_id[alias], by_id[canonical]
        assert archived['collection'] == retained['collection'] == 'mls'
        assert archived['required'] == retained['required'] and decision['reason'].strip()
        archived['duplicateOf'] = canonical
        groups[canonical].append(alias)
        audit.append({'id': alias, 'canonical': canonical, 'reason': decision['reason'],
                      'originalAnswer': archived['answer'], 'canonicalAnswer': retained['answer']})
    for canonical, aliases in groups.items():
        members = [canonical, *sorted(aliases)]
        for member in members:
            by_id[member]['relatedIds'] = members
        retained = by_id[canonical]
        retained['sourceIds'] = sorted({i for member in members for i in by_id[member]['sourceIds']})
        retained['notes'].append('Grouped study variants: MLS Q' + ', Q'.join(str(i) for i in members) + '. Wording or distractors can differ. Answer letters refer to this version.')
    return audit


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    old = legacy_bank()
    new, audit = merge_bundle(old)
    bank = old + new
    original_keys = {q['id']: {'answer': list(q['answer']), 'status': q['status']} for q in bank}
    attach(bank)
    study_duplicates = group_study_duplicates(bank)
    study_bank = [q for q in bank if 'duplicateOf' not in q]
    assert len({q['id'] for q in bank}) == len(bank)
    assert all(len(q['answer']) == q['required'] for q in bank if q['status'] != 'review')
    catalog = {'total': len(study_bank), 'records': len(bank), 'archivedVariants': len(study_duplicates), 'maxId': max(q['id'] for q in bank),
               'collections': dict(Counter(q['collection'] for q in study_bank)), 'statuses': dict(Counter(q['status'] for q in study_bank)),
               'sourceMap': {str(source): q['id'] for q in new for source in q['sourceIds']}}
    (APP / 'src/data/questions.json').write_text(json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + '\n')
    (APP / 'src/data/catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
    (OUTPUT / 'MERGE_AUDIT.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
    (OUTPUT / 'STUDY_DUPLICATE_AUDIT.json').write_text(json.dumps(study_duplicates, ensure_ascii=False, indent=2) + '\n')
    analysis_audit = {
        'total': len(bank), 'complete': sum(bool(q.get('analysis')) for q in bank),
        'optionAnalyses': sum(len(q['analysis']['options']) for q in bank),
        'statuses': dict(Counter(q['status'] for q in bank)),
        'studyTotal': len(study_bank), 'archivedIds': [q['id'] for q in bank if 'duplicateOf' in q],
        'changes': [dict(id=q['id'], collection=q['collection'], sourceIds=q['sourceIds'],
                         before=original_keys[q['id']], after={'answer': q['answer'], 'status': q['status']},
                         notes=q['notes'], sources=q['sources'])
                    for q in bank if original_keys[q['id']] != {'answer': q['answer'], 'status': q['status']}],
        'unresolvedIds': [q['id'] for q in bank if q['status'] == 'review'],
    }
    (OUTPUT / 'ANSWER_ANALYSIS_AUDIT.json').write_text(json.dumps(analysis_audit, ensure_ascii=False, indent=2) + '\n')
    write_exports(study_bank)
    print(json.dumps({k:v for k,v in catalog.items() if k!='sourceMap'}, ensure_ascii=False))
    print(f"Removed {audit['removedDuplicates']} duplicated MLA entries; archived {len(study_duplicates)} MLS variants; exported {len(study_bank)} study questions.")


if __name__ == '__main__':
    main()

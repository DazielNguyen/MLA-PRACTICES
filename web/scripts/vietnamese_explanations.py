"""Apply reviewed Vietnamese text while preserving question wording and grading."""
import copy
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent / 'translations'
SOURCE_FIELDS = ('id', 'text', 'choices', 'answer', 'status', 'analysis', 'hint', 'notes')
TRANSLATED_FIELDS = {'analysis', 'explanation', 'notes', 'hint', 'explanationLanguage'}


def source_hash(question):
    payload = {key: question.get(key) for key in SOURCE_FIELDS}
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def localize(bank):
    hashes = json.loads((HERE / 'source-sha256.json').read_text())
    notes = json.loads((HERE / 'notes-vi.json').read_text())
    original = json.loads((HERE / 'original-vi.json').read_text())
    imported = {}
    for file in sorted((HERE / 'vi').glob('*.json')):
        chunk = json.loads(file.read_text())
        assert not imported.keys() & chunk.keys(), f'Duplicate translation in {file.name}'
        imported.update(chunk)
    assert set(imported) == {str(q['id']) for q in bank if q.get('origin') != 'original'}
    assert set(hashes) == {str(q['id']) for q in bank}, 'Translation coverage must match the published MLA bank'
    output = copy.deepcopy(bank)
    for before, q in zip(bank, output):
        assert q['collection'] == 'mla'
        assert source_hash(q) == hashes[str(q['id'])], f"English source changed for #{q['id']}; review its Vietnamese translation first"
        if q.get('origin') == 'original':
            concept = original['concepts'][q['analysis']['keyConcept']]
            options = {}
            for letter, text in q['analysis']['options'].items():
                match = re.fullmatch(r'(.+) This (matches the requirement for|option does not address the specified need for) (.+)\.', text)
                assert match, (q['id'], letter)
                fact, relation, requirement = match.groups()
                link = 'đáp ứng yêu cầu' if relation.startswith('matches') else 'không đáp ứng yêu cầu cụ thể'
                options[letter] = f"{original['facts'][fact]} Phương án này {link}: {original['requirements'][requirement]}."
            if q.get('hint') == q['analysis']['keyConcept']:
                q['hint'] = concept
        else:
            translated = imported[str(q['id'])]
            assert len(translated) == len(q['choices']) + 1, f"Option count mismatch #{q['id']}"
            assert all(isinstance(text, str) and len(text.strip()) > 20 for text in translated)
            concept, *reasons = translated
            options = dict(zip(q['choices'], reasons))
        q['analysis'] = {'keyConcept': concept, 'options': options}
        q['notes'] = [notes[note] for note in q['notes']]
        q['explanationLanguage'] = 'vi'
        answer = 'Chưa chốt đáp án; không tính điểm.' if q['status'] == 'review' else 'Đáp án đúng: ' + ' + '.join(q['answer']) + '.'
        q['explanation'] = '\n\n'.join([answer, 'Ý chính: ' + concept, *[f'{letter}. {reason}' for letter, reason in options.items()]])
        assert {k: v for k, v in before.items() if k not in TRANSLATED_FIELDS} == {k: v for k, v in q.items() if k not in TRANSLATED_FIELDS}
    return output


def export_vietnamese(bank, directory):
    directory.mkdir(parents=True, exist_ok=True)
    md = ['# MLA-C01 — Giải thích tiếng Việt', '', f'{len(bank)} câu. Giữ nguyên câu hỏi và lựa chọn tiếng Anh; giải thích và ghi chú bằng tiếng Việt.',
          'Câu cần xác minh không tính điểm. Bộ tự biên soạn được ghi nhãn riêng.', '']
    cards = []
    for q in bank:
        answer = 'Chưa chốt đáp án; không tính điểm' if q['status'] == 'review' else 'Đáp án: ' + ' + '.join(q['answer'])
        label = f"#{q['id']} · {q['sourceName']}"
        md += ['## ' + label, '', q['text'], '', *[f'{k}. {v}' for k, v in q['choices'].items()], '', '**' + answer + '**', '', '### Ý chính', '', q['analysis']['keyConcept'], '']
        for image in q['images']:
            md += [f"![{image['alt']}](../public{image['url']})", '']
        for letter, reason in q['analysis']['options'].items():
            heading = 'Phân tích' if q['status'] == 'review' else 'Vì sao đúng' if letter in q['answer'] else 'Vì sao sai'
            md += [f'### {letter} — {heading}', '', reason, '']
        md += ['### Ghi chú và nguồn', '', *['- ' + note for note in q['notes']], *[f"- [{s['title']}]({s['url']})" for s in q['sources']], '']
        front = label + ': ' + q['text'] + ' ' + ' '.join(f'{k}. {v}' for k, v in q['choices'].items())
        if q['images']:
            front += ' [Câu có hình: xem bản Markdown hoặc website.]'
        back = answer + '. Ý chính: ' + q['analysis']['keyConcept'] + ' ' + ' '.join(f'{k}: {v}' for k, v in q['analysis']['options'].items()) + ' Ghi chú: ' + ' '.join(q['notes'])
        cards.append(re.sub(r'\s+', ' ', front).strip() + '\t' + re.sub(r'\s+', ' ', back).strip())
    (directory / 'MLA_VI.md').write_text('\n'.join(md) + '\n')
    (directory / 'QUIZLET_MLA_VI.md').write_text('\n'.join(cards) + '\n')

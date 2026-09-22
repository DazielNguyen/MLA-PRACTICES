"""Export the published original questions for personal Markdown and Quizlet study."""
import hashlib
import json
from pathlib import Path
import re
from collections import Counter

APP = Path(__file__).resolve().parents[1]
HERE = APP / 'local-study'
def normalized(text):
    return re.sub(r'[^a-z0-9]', '', text.lower())

def main():
    base_path = APP / 'src/data/questions.json'
    base_bytes = base_path.read_bytes()
    HERE.mkdir(parents=True, exist_ok=True)
    base = [q for q in json.loads(base_bytes) if q.get('origin') != 'original']
    bank = json.loads((APP / 'scripts/original-questions.json').read_text())
    assert len(bank) == 352
    assert not ({q['id'] for q in base} & {q['id'] for q in bank})
    assert len({normalized(q['text']) for q in bank}) == len(bank), 'Exact duplicate in personal pack.'
    exact = {normalized(q['text']) for q in base} & {normalized(q['text']) for q in bank}
    assert not exact, 'Exact duplicate against the existing bank.'
    for q in bank:
        assert len(set(q['choices'].values())) == 4
        assert set(q['analysis']['options']) == set(q['choices'])
        assert len(q['text']) > 30 and all(len(s.strip()) > 30 for s in q['analysis']['options'].values())
    combined = base + bank
    (HERE / 'questions.json').write_text(json.dumps(combined,ensure_ascii=False,separators=(',', ':'))+'\n')
    (HERE / 'original-352.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n')
    report = dict(originalCount=len(bank), combinedCount=len(combined), baseSha256=hashlib.sha256(base_bytes).hexdigest(),
                  topics=len({q['analysis']['keyConcept'] for q in bank}), domains=dict(Counter(q['domain'] for q in bank)),
                  answerLetters=dict(Counter(q['answer'][0] for q in bank)), exactDuplicates=0,
                  semanticDuplicateReview='Related scenarios intentionally repeat concepts; no claim of 352 distinct concepts.',
                  questionType='352 single-answer questions for quick study; not a replica of the official exam format.')
    (HERE / 'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    md = ['# Original MLA-C01 practice — 352 questions', '',
          'Original study scenarios, not official exam questions. Explanations use AWS documentation.',
          'This pack contains related scenarios across 44 topics. All questions have one correct answer.', '']
    cards = []
    for q in bank:
        correct = q['answer'][0]
        md += [f"## Q{q['id']} · {q['domain']}", '', q['text'], '', *[f'{k}. {v}' for k,v in q['choices'].items()], '',
               f"**Correct answer {correct}. {q['choices'][correct]}**", '',
               '### Explanation and distractor analysis', '', '#### Key Concept', '', q['analysis']['keyConcept'], '',
               '#### Why this is correct', '', q['analysis']['options'][correct], '', '#### Why other options are incorrect', '',
               *[f"- **{k}. {q['choices'][k]}** — {v}" for k,v in q['analysis']['options'].items() if k != correct], '',
               '#### References', '', *[f"- [{s['title']}]({s['url']})" for s in q['sources']], '']
        front = f"Q{q['id']}: {q['text']} " + ' '.join(f'{k}. {v}' for k,v in q['choices'].items())
        back = f"Correct answer {correct}. {q['choices'][correct]}. Key Concept: {q['analysis']['keyConcept']} "
        back += ' '.join(f"{k}: {v}" for k,v in q['analysis']['options'].items())
        back += ' Sources: ' + ' '.join(s['url'] for s in q['sources'])
        cards.append(re.sub(r'\s+', ' ', front)+'\t'+re.sub(r'\s+', ' ', back))
    (HERE / 'MLA_ORIGINAL_352.md').write_text('\n'.join(md)+'\n')
    (HERE / 'QUIZLET_ORIGINAL_352.md').write_text('\n'.join(cards)+'\n')
    assert base_path.read_bytes() == base_bytes
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__ == '__main__':
    main()

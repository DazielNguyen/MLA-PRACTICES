"""Copy the reviewed question bank and its unmodified image assets into the app."""
from pathlib import Path
import json, shutil

APP = Path(__file__).resolve().parents[1]
ROOT = APP.parent
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
    })
assert [q['id'] for q in questions] == list(range(1,333))
assert all(len(q['answer']) == q['required'] for q in questions if q['status'] != 'review')
target = APP / 'src/data/questions.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(questions, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Imported {len(questions)} questions and {sum(len(q["images"]) for q in questions)} images.')

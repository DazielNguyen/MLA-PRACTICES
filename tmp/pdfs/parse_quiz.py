from pathlib import Path
import re, json, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / 'tmp/pdfs'
text = (TMP / 'ml-specialty-layout.txt').read_text()
markers = list(re.finditer(r'^\s*Question #(\d+)\s+Topic 1\s*$', text, re.M))

def clean(s):
    s = re.sub(r'^.*AWS Certified Machine Learning - Specialty Exam - Free Exam Q&As, Page 1 \| ExamTopics.*$', '', s, flags=re.M)
    s = re.sub(r'^https://www\.examtopics\.com/exams/amazon/aws-certified-machine-learning-specialty/custom-view/.*$', '', s, flags=re.M)
    s = s.replace('\u202b', '').replace('\u202c', '')
    s = s.replace('ג€', '"').replace('ֳ—', '×').replace('¡׀configure', 'Configure').replace('¡׀onfigure', 'Configure')
    s = s.replace('׀¢ ’׀', '[unit unreadable in source] ').replace('(AШ)', '(AI)')
    s = s.replace('✑', '•').replace('\f', ' ')
    s = re.sub(r'(?<=\w)-\s*\n\s*(?=[a-z])', '-', s)
    return re.sub(r'\s+', ' ', s).strip()

records = []
for i, marker in enumerate(markers):
    block = text[marker.end():markers[i+1].start() if i+1 < len(markers) else len(text)]
    answer = re.search(r'Correct Answer:\s*([A-F]+)', block)
    assert answer, marker[1]
    front = block[:answer.start()]
    options = list(re.finditer(r'^\s*([A-F])\.\s+', front, re.M))
    assert [m[1] for m in options] == list('ABCDEF'[:len(options)])
    stem = clean(front[:options[0].start()])
    choices = {m[1]: clean(front[m.end():options[j+1].start() if j+1<len(options) else len(front)]) for j,m in enumerate(options)}
    votes_match = re.search(r'Community vote distribution(.*?)(?:\uf147|\uf007)', block[answer.end():], re.S)
    votes = [{'answer':a, 'percent':int(v)} for a,v in re.findall(r'([A-F]+)\s*\((\d+)%\)', votes_match[1])] if votes_match else []
    expected_match = re.search(r'\b(?:Choose|Select)\s+(two|three|four|2|3|4)\b', stem, re.I)
    expected = {'two':2,'three':3,'four':4,'2':2,'3':3,'4':4}[expected_match[1].lower()] if expected_match else 1
    notes = []
    if len(answer[1]) != expected:
        notes.append(f'PDF answer has {len(answer[1])} choice(s), but the question requires {expected}.')
    if '[unit unreadable' in stem: notes.append('The data-size unit is corrupted in the original PDF; no unit has been guessed.')
    records.append({'id':int(marker[1]),'page':text[:marker.start(1)].count('\f')+1,'question':stem,'choices':choices,'pdf_answer':answer[1], 'expected_answers':expected,'votes':votes,'source_notes':notes,'images':[]})

current = None
choice = None
in_front = False
for page in ET.parse(TMP/'source.xml').getroot().findall('page'):
    els = []
    for el in page:
        if el.tag not in ('text','image'): continue
        top=int(el.get('top'))
        if el.tag=='text':
            txt=''.join(el.itertext())
            if 'Correct Answer:' in txt: els.append((top-8, -1, 'end', None))
            m=re.fullmatch(r'Question #(\d+)',txt)
            if m: els.append((top, 0, 'start', int(m[1])))
            m=re.match(r'^([A-F])\.\s',txt)
            if m: els.append((top, 1, 'choice', m[1]))
        elif int(el.get('width'))>20:
            els.append((top, 2, 'image', el.get('src')))
    for _,_,typ,value in sorted(els):
        if typ=='start': current=value;choice=None;in_front=True
        elif typ=='end': in_front=False
        elif typ=='choice' and in_front: choice=value
        elif typ=='image' and in_front and current:
            records[current-1]['images'].append({'source':value,'slot':choice or 'question','page':int(page.get('number'))})

# The PDF splits the option label and image into separate XML fragments.
for im, slot in zip(records[177]['images'], ['question', 'A', 'C']):
    im['slot'] = slot
records[312]['source_notes'].append('Option B contains a malformed metric name in the original PDF (page 600); retained without guessing the intended metric.')

assert [q['id'] for q in records] == list(range(1,333))
assert all(q['question'] and all(q['choices'].values()) and set(q['pdf_answer']) <= set(q['choices']) for q in records)
(TMP/'questions.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print('Parsed',len(records),'questions;',sum(len(q['images']) for q in records),'images.')
print('Image slots:', [(q['id'],[(im['slot'],im['source']) for im in q['images']]) for q in records if q['images']])

from pathlib import Path
from collections import Counter
import json, re, shutil, hashlib

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / 'tmp/pdfs'
OUT = ROOT / 'output/quizlet'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'images').mkdir(exist_ok=True)
questions = json.loads((TMP / 'questions.json').read_text())
descriptions = json.loads((TMP / 'image_descriptions.json').read_text())
research = json.loads((TMP / 'research-final.json').read_text())
answers = {}
for filename in ['answers.tsv', 'answers_remaining.tsv']:
    for row in (TMP / filename).read_text().splitlines():
        ident, answer, status, explanation, sources = row.split('\t')
        ident = int(ident)
        assert ident not in answers
        answers[ident] = dict(answer=answer, status=status, explanation=explanation, sources=sources.split(','))
assert sorted(answers) == list(range(1, 333))

# Final decisions after opening the primary sources and inspecting PDF page 600.
answers[157]['explanation'] = 'Augmentation, cân bằng lớp và Custom Labels là ba hướng phù hợp trong các lựa chọn; cần đánh giá lại trên validation set.'
answers[157]['sources'].append('image_hyper')
answers[208].update(answer='C', status='review', explanation='C phù hợp khi nền tảng cũ hỗ trợ tích hợp SIPREC/Contact Lens. A cũng khả thi nếu Transcribe được hiểu là Call Analytics. Đề chưa chỉ rõ khả năng tích hợp và phiên bản dịch vụ để chốt duy nhất.')
answers[268].update(answer='B', status='review', explanation='B có cơ sở cho metadata author/sensitivity và tra cứu trong Studio. D cần thêm bước đưa metadata sang nguồn dữ liệu QuickSight. Yêu cầu tạo báo cáo chưa đủ chi tiết để kết luận một phương án hoàn chỉnh.')
answers[313].update(answer='', status='review', explanation='B có metric bị hỏng ngay trong PDF và ghi csv_weight thay vì csv_weights. C tối đa hóa F1 nhưng tuning mọi tham số không tối ưu ngân sách. Cần sửa đề trước khi chốt; không tự thay metric thành f1 hoặc recall.')
answers[215]['sources'].append('transcribe_languages')
answers[246]['sources'].append('feature_getrecord')
for ident in [101, 331]: answers[ident]['sources'].append('batch_spot')
for ident in [127, 167, 239, 265, 300]: answers[ident]['sources'].append('groundtruth_workforce')
for ident in [128, 239]:
    answers[ident]['status'] = 'historical'
    answers[ident]['explanation'] += ' A2I hiện không nhận khách hàng mới.'
answers[154]['status'] = 'historical'
answers[154]['explanation'] += ' Comprehend topic modeling hiện không mở cho khách hàng mới.'
for ident in [119, 160, 216, 228]: answers[ident]['sources'].append('forecast_status')
answers[118]['sources'].append('forecast_status')
answers[196]['sources'].append('shutdown')
answers[296]['sources'].append('fraud_status')
for ident in [22, 61, 62, 73, 108, 240, 273]:
    if 'kda' not in answers[ident]['sources']: answers[ident]['sources'].append('kda')

descriptions['32']['question'] = descriptions['32']['question'].replace('NoSQL, Opera, Database', 'NoSQL, Operations, Database').replace('data-platform.html', 'data_platform.html')

def source(key):
    canonical = research['alias'].get(key, key)
    d = research['docs'][canonical]
    raw = str(d['raw'])
    assert d['url'] and 'Internal Error' not in raw and 'Redirecting…' not in raw, key
    title = raw.splitlines()[0].split(' (https://')[0]
    return {'key': key, 'title': title, 'url': d['url']}

def sources_for(a):
    result, seen = [], set()
    for key in a['sources']:
        s = source(key)
        if s['url'] not in seen: result.append(s); seen.add(s['url'])
    return result

def flat(s):
    return re.sub(r'\s+', ' ', s).strip()

LABELS = {'checked': 'ĐÃ ĐỐI CHIẾU', 'historical': 'BỐI CẢNH DỊCH VỤ CŨ', 'review': 'CẦN XÁC MINH / SỬA ĐỀ'}
IMPORT = 'ML_SPECIALTY_332_QUIZLET_IMPORT.md'
BOOK = 'ML_SPECIALTY_332_CAU_HOI_VA_GIAI_THICH.md'
READY = 'ML_SPECIALTY_QUIZLET_KHONG_CO_CAU_MO_HO.md'
cards, ready, sections, records = [], [], [], []
stats = Counter(a['status'] for a in answers.values())

for q in questions:
    ident = q['id']; a = answers[ident]; desc = descriptions.get(str(ident), {})
    refs = sources_for(a)
    if a['status'] != 'review':
        assert len(a['answer']) == q['expected_answers'], ident
    assert set(a['answer']) <= set(q['choices']), ident
    tag = '' if a['status'] == 'checked' else f" [{LABELS[a['status']]}]"
    front = f"Q{ident:03d}{tag}. {q['question']}"
    if desc.get('question'): front += ' [Dữ kiện hình: ' + desc['question'] + ']'
    choices = {}
    for letter, value in q['choices'].items():
        choices[letter] = value + (' ' + desc[letter] if letter in desc else '')
        front += f' | {letter}. {choices[letter]}'
    if a['status'] == 'review':
        back = 'CẦN XÁC MINH / SỬA ĐỀ — chưa chốt đáp án để học thuộc. '
        if a['answer']: back += f"Phương án tham khảo có điều kiện: {', '.join(a['answer'])}. "
    else:
        back = 'Đáp án: ' + ', '.join(a['answer']) + '. '
        back += ' | '.join(f'{letter}. {choices[letter]}' for letter in a['answer']) + ' | '
        if a['status'] == 'historical': back += 'BỐI CẢNH DỊCH VỤ CŨ. '
    back += a['explanation'] + f" | PDF trang {q['page']}."
    back += ' | Nguồn đối chiếu: ' + ' ; '.join(s['url'] for s in refs)
    card = flat(front) + '\t' + flat(back)
    cards.append(card)
    if a['status'] != 'review': ready.append(card)

    sec = [f"## Câu {ident:03d}", '', f"Trang PDF: [{q['page']}](../../Machine%20Learning%20-%20Specialty%20Exam.pdf#page={q['page']}) · {LABELS[a['status']]}", '', q['question'], '']
    def add_images(slot):
        for number, im in enumerate(q['images'], 1):
            if im['slot'] != slot: continue
            original = ROOT / im['source']
            filename = f"q{ident:03d}_{number}{original.suffix}"
            shutil.copy2(original, OUT / 'images' / filename)
            sec.extend([f'![Hình gốc câu {ident}, {slot}](images/{filename})', ''])
    add_images('question')
    if desc.get('question'): sec.extend(['**Dữ kiện hình dạng chữ:** ' + desc['question'], ''])
    for letter, value in q['choices'].items():
        sec.extend([f'**{letter}.** {value}', ''])
        add_images(letter)
        if letter in desc: sec.extend([desc[letter], ''])
    if a['status'] == 'review':
        sec.extend(['**Chưa chốt đáp án.**' + (f" Phương án tham khảo có điều kiện: **{', '.join(a['answer'])}**." if a['answer'] else ''), ''])
    else:
        sec.extend([f"**Đáp án sau đối chiếu: {', '.join(a['answer'])}.**", ''])
    sec.extend([a['explanation'], '', f"Đáp án in trong PDF: `{q['pdf_answer']}` (giữ để đối chiếu nguồn, không dùng làm căn cứ chấm).", ''])
    if q['source_notes']:
        sec.extend(['Ghi chú bản gốc: ' + ' '.join(q['source_notes']), ''])
    sec.extend(['Nguồn đối chiếu: ' + '; '.join(f"[{s['title']}]({s['url']})" for s in refs) + '.', ''])
    sections.append('\n'.join(sec))
    records.append({**q, **a, 'sources': refs, 'image_descriptions': desc})

book_intro = f'''# Machine Learning – Specialty: 332 câu hỏi và giải thích

Chuyển từ **Machine Learning - Specialty Exam.pdf**, 621 trang, đủ câu 1–332. Giữ tiếng Anh của câu hỏi/lựa chọn; giải thích bằng tiếng Việt. Nội dung thuộc bộ **Machine Learning – Specialty** trong PDF.

Đối chiếu ngày **21/09/2026**: **{stats['checked']} câu đã đối chiếu**, **{stats['historical']} câu theo bối cảnh dịch vụ cũ**, **{stats['review']} câu cần xác minh hoặc sửa đề**. Đáp án là kết luận biên soạn dựa trên tài liệu được dẫn, không phải đáp án do AWS công bố cho bộ câu hỏi này. Các kiến thức thống kê/ML có thêm tài liệu gốc của thư viện hoặc bài nghiên cứu.

Đáp án PDF và bình chọn cộng đồng không được dùng làm bằng chứng độc lập. Câu thiếu dữ kiện, tham số sai hoặc có nhiều cách hiểu được ghi rõ, không ép chốt đáp án. Hình gốc được giữ cùng mô tả chữ; số đọc từ biểu đồ được ghi là xấp xỉ.

Để nhập Quizlet, dùng [{IMPORT}]({IMPORT}); để tránh học các câu mơ hồ, dùng [{READY}]({READY}). Xem [hướng dẫn và danh sách câu cần chú ý](HUONG_DAN_QUIZLET.md).

'''
(OUT / IMPORT).write_text('\n'.join(cards) + '\n')
(OUT / READY).write_text('\n'.join(ready) + '\n')
(OUT / BOOK).write_text(book_intro + '\n---\n\n'.join(sections))
(TMP / 'reviewed_questions.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')

changed = [q['id'] for q in questions if answers[q['id']]['status'] != 'review' and answers[q['id']]['answer'] != q['pdf_answer']]
review_ids = [q['id'] for q in questions if answers[q['id']]['status'] == 'review']
historical_ids = [q['id'] for q in questions if answers[q['id']]['status'] == 'historical']
readme = f'''# Nhập bộ câu hỏi Machine Learning – Specialty vào Quizlet

Đã chuyển đủ **332 câu** từ PDF, gồm **22 hình trong 19 câu**. Câu hỏi và lựa chọn giữ tiếng Anh; đáp án và giải thích ngắn dùng tiếng Việt.

## Chọn file

| File | Nội dung |
| --- | --- |
| [{IMPORT}]({IMPORT}) | Đủ 332 thẻ, có nhãn cảnh báo ở các câu chưa chốt |
| [{READY}]({READY}) | {len(ready)} thẻ đã có kết luận, gồm cả câu dịch vụ cũ có ghi chú |
| [{BOOK}]({BOOK}) | Bản đọc đầy đủ: đề, lựa chọn, hình gốc, giải thích, đáp án PDF và nguồn |

## Cách nhập

1. Mở file `{IMPORT}` ở **chế độ văn bản/source trong IDE**, chọn tất cả và sao chép. Không sao chép từ Markdown Preview.
2. Trên website Quizlet, tạo một bộ flashcard và chọn **Import**.
3. Dán nội dung. Chọn **Tab** giữa thuật ngữ và định nghĩa, **New line** giữa các thẻ.
4. Kiểm tra phần xem trước có đúng **332 thẻ** (hoặc **{len(ready)} thẻ** nếu dùng file không có câu mơ hồ), rồi hoàn tất nhập.

Mỗi dòng là một thẻ: `Câu hỏi + A/B/C/D…` → `Đáp án + giải thích + nguồn`. Dấu `|` chỉ phân cách các lựa chọn trong cùng thẻ. File nhập không có tiêu đề, bảng Markdown hay hàng trống. Nguồn: [hướng dẫn nhập nội dung của Quizlet]({source('quizlet')['url']}).

Quizlet nhập chữ từ file này; hình không được tải lên tự động. Dữ kiện hình đã được chép thành chữ trong thẻ. Có thể xem hình gốc trong bản đọc và thư mục `images/`. Giữ cả thư mục này khi di chuyển bản đọc.

## Kết quả đối chiếu

- {stats['checked']} câu có đáp án sau đối chiếu.
- {stats['historical']} câu có đáp án theo bối cảnh dịch vụ cũ.
- {stats['review']} câu cần xác minh/sửa đề, chưa dùng làm đáp án chắc chắn.
- {len(changed)} câu đã chốt có đáp án khác đáp án in trong PDF.
- Đã bổ sung đúng số lựa chọn ở câu **154, 291, 293, 300**, nơi đáp án PDF thiếu lựa chọn.

Việc đối chiếu dựa trên tài liệu AWS cho tính năng dịch vụ và tài liệu gốc cho kiến thức ML. Kết luận theo tình huống là suy luận của người biên soạn; các nguồn không phải answer key của bộ đề. Ngày rà soát: **21/09/2026**.

PDF mang tên **Machine Learning – Specialty**. Giữ đúng phạm vi nguồn khi sử dụng cùng tài liệu ôn **MLA-C01**; bộ này chưa được biên soạn lại theo cấu trúc MLA-C01.

## Câu cần xác minh hoặc sửa đề

Các câu này được giữ trong bộ 332 thẻ, nhưng mặt đáp án bắt đầu bằng “CẦN XÁC MINH / SỬA ĐỀ”. File {len(ready)} thẻ đã loại nhóm này.

| Câu | Lý do |
| --- | --- |
'''
for ident in review_ids:
    readme += f"| [{ident:03d}]({BOOK}#câu-{ident:03d}) | {answers[ident]['explanation'].replace('|', '/')} |\n"
readme += '\n## Bối cảnh dịch vụ cũ\n\n'
readme += 'Các câu: ' + ', '.join(f'{i:03d}' for i in historical_ids) + '.\n\n'
readme += f'''- Kinesis Data Analytics for SQL đã ngừng hoạt động; các câu dùng SQL application cũ chỉ giữ để hiểu bối cảnh đề. [AWS]({source('kda')['url']}).
- Forecast, A2I, Comprehend topic modeling và Fraud Detector có hạn chế tiếp nhận khách hàng mới. Xem nguồn ngay tại câu liên quan.
- DeepLens và dòng Snowball Edge GPU được liệt kê trong nhóm dịch vụ đã dừng. [AWS]({source('shutdown')['url']}).
- Elastic Inference không tiếp nhận khách hàng mới từ 15/04/2023. [AWS]({source('elastic_inference')['url']}).
- Glue development endpoints thuộc quy trình cũ, chỉ hỗ trợ phiên bản Glue trước 2.0. [AWS]({source('glue_dev')['url']}).

## Kiểm tra bản chuyển đổi

Đủ số thứ tự 001–332, giữ số lựa chọn từng câu, kiểm tra số đáp án của câu chọn nhiều và giữ đủ 22 hình. Mỗi dòng nhập có đúng một ký tự Tab. Không đưa bình luận cộng đồng, header/footer trang hoặc đáp án vào mặt câu hỏi.

Các lỗi font có thể xác định chắc chắn được chuẩn hóa. Riêng đơn vị dung lượng bị hỏng trong câu 166 và 179 được ghi `[unit unreadable in source]`; không đoán đơn vị. Câu 178 giữ nguyên MinValue/MaxValue bị đảo trong hình và ghi cách sửa ở phần giải thích. Câu 313 giữ tên metric bị lỗi như PDF.

Đã kiểm tra cấu trúc file để nhập; chưa đăng nhập, nhập thử hoặc xuất bản bộ thẻ trên tài khoản Quizlet.
'''
(OUT / 'HUONG_DAN_QUIZLET.md').write_text(readme)

# Format/content integrity checks on the actual files written.
for filename, expected in [(IMPORT, 332), (READY, len(ready))]:
    lines = (OUT / filename).read_text().splitlines()
    assert len(lines) == expected
    assert all(line.count('\t') == 1 for line in lines)
    assert all(len(line.split('\t')[0]) and len(line.split('\t')[1]) for line in lines)
    assert not any('Correct Answer:' in line.split('\t')[0] for line in lines)
ids = [int(re.match(r'Q(\d{3})', line)[1]) for line in cards]
assert ids == list(range(1, 333))
assert len(list((OUT / 'images').glob('*'))) == 22
assert set(descriptions) == {str(q['id']) for q in questions if q['images']}
for q, card in zip(questions, cards):
    front = card.split('\t')[0]
    assert flat(q['question']) in front
    assert all(flat(value) in front for value in q['choices'].values())
assert '¡׀onfigure' not in (OUT / IMPORT).read_text()
assert len(re.findall(r'^## Câu \d{3}$', (OUT / BOOK).read_text(), flags=re.M)) == 332
sources = {s['url'] for r in records for s in r['sources']}
summary = dict(questions=332, images=22, source_pages=621, status_counts=dict(stats), ready_cards=len(ready), changed_answers=len(changed), unique_references=len(sources), longest_front=max(len(c.split('\t')[0]) for c in cards), pdf_sha256=hashlib.sha256((ROOT/'Machine Learning - Specialty Exam.pdf').read_bytes()).hexdigest())
(TMP / 'validation-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False, indent=2))
for p in sorted(OUT.glob('*.md')): print(p.name, p.stat().st_size, 'bytes')

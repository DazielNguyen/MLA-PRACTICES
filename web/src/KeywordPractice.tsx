import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Lightbulb, RotateCcw, Search, Sparkles } from 'lucide-react';
import rawItems from './data/keywords.json';
import { keywordCoverage, keywordDomains, keywordExercise, keywordParts, keywordStatusLabels, shuffleKeywords } from './keyword-domain';
import type { KeywordDeck, KeywordItem, KeywordProgress, KeywordStatus } from './keyword-domain';
import { notifyChange } from './sync/local';
import type { ProgressRepository } from './sync/local';
import './keyword-practice.css';

const items = rawItems as KeywordItem[];
const byId = new Map(items.map(item => [item.id, item]));
function savedDeck(repo: ProgressRepository) {
  const rows = repo.rows().filter(row => row.kind === 'keywordDeck').sort((a, b) => b.stamp - a.stamp);
  return (rows.find(row => row.key === `keywordDeck:${repo.writer}`) || rows[0])?.value as KeywordDeck | null || null;
}
function ItemDetails({item}: {item: KeywordItem}) {
  return <div className="kw-details" lang="vi">
    <div className="kw-keywords"><Lightbulb size={18}/><div><strong>Từ khóa nhận diện</strong><p>{item.keywords}</p></div></div>
    {item.sections.map(section => <section key={section.title}><h3>{section.title}</h3><p>{section.text}</p></section>)}
    <details className="kw-source"><summary>Nguồn và phạm vi nội dung <ChevronDown size={15}/></summary><p>{item.source.scope} · Đối chiếu trong tài liệu: {item.source.date}</p><p>{item.source.file} · Dòng {item.source.row}</p>{item.part === 3 && <p>Chuỗi tiếng Anh được chuyển từ các bước trong tài liệu để luyện ghi nhớ. Xem điều kiện và biến thể trước khi áp dụng.</p>}<ul>{item.source.urls.map((url, i) => <li key={url}><a href={url} target="_blank" rel="noreferrer">Nguồn tham khảo {i + 1} · {new URL(url).hostname}</a></li>)}</ul></details>
  </div>;
}
function ItemLabels({item}: {item: KeywordItem}) {return <div className="kw-labels"><span>Domain {item.domain}</span><span>Part {item.part} · {keywordParts[item.part - 1]}</span><span>Task {item.task}</span><span>Mục {item.order}</span></div>;}

export default function KeywordPractice({repo, revision}: {repo: ProgressRepository; revision: object}) {
  const [domain, setDomain] = useState(0), [part, setPart] = useState(0), [status, setStatus] = useState('all');
  const [query, setQuery] = useState(''), [limit, setLimit] = useState(20), [mode, setMode] = useState<KeywordDeck['mode']>('match');
  const [page, setPage] = useState(0), [expanded, setExpanded] = useState('');
  const [deck, setDeck] = useState<KeywordDeck | null>(() => savedDeck(repo));
  const [studying, setStudying] = useState(false), [hint, setHint] = useState(false);
  const deckRef = useRef(deck); deckRef.current = deck;
  useEffect(() => {if (!studying) setDeck(savedDeck(repo));}, [repo, revision, studying]);
  const progress = useMemo(() => new Map(repo.rows().filter(row => row.kind === 'keyword').map(row => {const value = row.value as KeywordProgress; return [value.id, value];})), [repo, revision]);
  const coverage = keywordCoverage(items, progress);
  const filtered = useMemo(() => {
    const needle = query.trim().normalize('NFC').toLocaleLowerCase();
    return items.filter(item => (!domain || item.domain === domain) && (!part || item.part === part) && (status === 'all' || (progress.get(item.id)?.status || 'unseen') === status) && (!needle || [item.title, item.prompt, item.keywords, item.task, item.topic].join(' ').normalize('NFC').toLocaleLowerCase().includes(needle)));
  }, [domain, part, status, query, progress]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20)), currentPage = Math.min(page, pageCount - 1);
  const item = deck && byId.get(deck.ids[deck.index]);
  const exercise = useMemo(() => item && deck ? keywordExercise(item, items, deck.startedAt) : null, [item, deck?.startedAt]);
  const save = (next: KeywordDeck | null, record?: KeywordProgress) => {
    if (record) repo.put('keyword', `keyword:${record.id}`, record);
    repo.put('keywordDeck', `keywordDeck:${repo.writer}`, next);
    deckRef.current = next; setDeck(next); notifyChange(repo.learner.id);
  };
  const start = (selected = filtered) => {
    if (!selected.length) return;
    // Work on a fixed list: marks and remote sync never remove the card being studied.
    const pool = shuffleKeywords(selected);
    const ids = pool.slice(0, limit || pool.length).map(q => q.id);
    save({ids, index: 0, mode, selected: null, revealed: false, correct: 0, answered: 0, startedAt: Date.now()});
    setStudying(true); setHint(false); window.scrollTo({top: 0});
  };
  const mark = (target: KeywordItem, nextStatus: KeywordStatus) => {
    repo.put('keyword', `keyword:${target.id}`, {id: target.id, status: nextStatus, seenAt: Date.now(), result: progress.get(target.id)?.result ?? null});
    notifyChange(repo.learner.id);
  };
  const next = () => {
    const current = deckRef.current;
    if (!current || !current.revealed || current.index >= current.ids.length) return;
    save({...current, index: current.index + 1, selected: null, revealed: false}); setHint(false);
  };
  const reveal = (selected: string | null = null) => {
    const current = deckRef.current;
    if (!current || !item || !exercise || current.ids[current.index] !== item.id) return;
    if (current.revealed) {if (selected !== null && selected === current.selected) next(); return;}
    const correct = selected === null ? null : selected === exercise.answer;
    const previous = progress.get(item.id);
    const nextStatus = correct === false ? 'review' : previous?.status || 'learning';
    save({...current, selected, revealed: true, answered: current.answered + Number(correct !== null), correct: current.correct + Number(correct === true)}, {id: item.id, status: nextStatus, seenAt: Date.now(), result: correct});
  };
  useEffect(() => {
    if (!studying || !item) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement).closest('input,textarea,select,a,summary,[contenteditable="true"]')) return;
      if (/^[1-4]$/.test(event.key) && deck?.mode === 'match' && exercise?.choices[Number(event.key) - 1]) {event.preventDefault(); reveal(exercise.choices[Number(event.key) - 1]);}
      else if (event.key === 'Enter' || event.key === ' ') {
        // Space/Enter on a control keeps that control's native behavior.
        if ((event.target as HTMLElement).closest('button')) return;
        event.preventDefault(); if (deckRef.current?.revealed) next(); else reveal();
      }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  });
  const changeFilter = (fn: () => void) => {fn(); setPage(0); setExpanded('');};

  if (studying && deck) return <div className="page kw-page kw-study">
    <div className="kw-study-top"><button className="text-button" onClick={() => setStudying(false)}><ArrowLeft size={16}/>Lưu và về danh mục</button><span>{repo.learner.name} · {Math.min(deck.index + 1, deck.ids.length)}/{deck.ids.length} mục</span></div>
    <div className="kw-meter" role="progressbar" aria-label="Tiến độ phiên Keywork" aria-valuemin={0} aria-valuemax={deck.ids.length} aria-valuenow={deck.index}><span style={{width: `${deck.index / deck.ids.length * 100}%`}}/></div>
    {item && exercise ? <article className="kw-study-card" key={`${deck.startedAt}:${deck.index}`}>
      <ItemLabels item={item}/>
      <p className="eyebrow">{deck.mode === 'cards' ? 'THẺ GHI NHỚ' : item.part === 3 ? 'ĐIỀN BƯỚC CÒN THIẾU' : 'GHÉP TỪ KHÓA VỚI TÌNH HUỐNG'}</p>
      <h1 className="kw-prompt" lang="en">{deck.mode === 'cards' && item.part === 3 ? 'Recall this workflow from its keywords.' : exercise.prompt}</h1>
      {deck.mode === 'cards' && item.part === 3 && <p className="kw-front-keywords">{item.keywords}</p>}
      {deck.mode === 'match' && <div className="kw-choices">{exercise.choices.map((choice, i) => <button className={`kw-choice ${deck.revealed ? choice === exercise.answer ? 'correct' : choice === deck.selected ? 'incorrect' : 'muted' : ''}`} key={choice} onClick={event => {reveal(choice); event.currentTarget.blur();}} aria-label={`${i + 1}. ${choice}`}><kbd>{i + 1}</kbd><span>{choice}</span>{deck.revealed && choice === exercise.answer && <CheckCircle2 size={20}/>}</button>)}</div>}
      {!deck.revealed ? <div className="kw-actions"><button className="button primary" onClick={event => {reveal(); event.currentTarget.blur();}}>{deck.mode === 'cards' ? 'Lật thẻ' : 'Xem đáp án'}<ArrowRight size={16}/></button><button className="text-button" onClick={() => setHint(!hint)}><Lightbulb size={16}/>{hint ? 'Ẩn gợi ý' : 'Gợi ý từ khóa'}</button></div> : <>
        <div className={`kw-feedback ${deck.selected !== null && deck.selected !== exercise.answer ? 'retry' : ''}`} role="status"><strong>{deck.selected === null ? 'Đáp án và ghi nhớ' : deck.selected === exercise.answer ? 'Chính xác' : 'Cần ôn lại'}</strong><p>{exercise.answer}</p></div>
        <div className="kw-actions"><button className="button primary" onClick={event => {next(); event.currentTarget.blur();}}>Mục tiếp theo<ArrowRight size={17}/></button><button className="button" aria-pressed={progress.get(item.id)?.status === 'mastered'} onClick={() => mark(item, progress.get(item.id)?.status === 'mastered' ? 'learning' : 'mastered')}><Check size={16}/>{progress.get(item.id)?.status === 'mastered' ? 'Đã nắm' : 'Đánh dấu đã nắm'}</button><button className="text-button" onClick={() => mark(item, 'review')}><RotateCcw size={15}/>Cần ôn lại</button></div>
        <p className="kw-shortcuts">Phím 1–4 chọn đáp án · Enter hoặc Space sang mục tiếp · Bấm lại đáp án đã chọn để đi tiếp</p>
        <h2 className="kw-answer-title">{item.title}</h2><ItemDetails item={item}/>
      </>}
      {hint && !deck.revealed && <div className="kw-keywords"><p>{item.keywords}</p></div>}
      {!deck.revealed && <p className="kw-shortcuts">{deck.mode === 'cards' ? 'Enter hoặc Space để lật thẻ.' : 'Phím 1–4 để chọn. Đáp án hiện ngay sau khi chọn.'} Đúng một lần chưa tự chuyển thành “Đã nắm”.</p>}
    </article> : <section className="panel kw-finish"><CheckCircle2 size={42}/><h1>Đã hoàn thành {deck.ids.length} mục</h1><p>{deck.answered ? `${deck.correct}/${deck.answered} lượt chọn đúng. ` : ''}Những mục đã xem và tự đánh giá đã được lưu trong hồ sơ {repo.learner.name}.</p><p>Đã nắm toàn bộ tài liệu: {coverage.mastered}/{coverage.total} mục.</p><button className="button primary" onClick={() => setStudying(false)}>Chọn phần học tiếp<ArrowRight size={17}/></button><button className="button" onClick={() => start(deck.ids.map(id => byId.get(id)!).filter(q => progress.get(q.id)?.status !== 'mastered'))} disabled={!deck.ids.some(id => progress.get(id)?.status !== 'mastered')}>Ôn mục chưa nắm</button></section>}
  </div>;

  return <div className="page kw-page">
    <div className="page-heading"><div><div className="eyebrow">4 DOMAIN · 16 PART · {items.length.toLocaleString('vi-VN')} MỤC KIẾN THỨC</div><h1>Keywork Practice</h1><p>Nhận diện từ khóa tiếng Anh. Hiểu và phân biệt bằng tiếng Việt.</p></div><span className="kw-profile"><BookOpen size={18}/>{repo.learner.name}</span></div>
    {deck && deck.index < deck.ids.length && <button className="resume-banner" onClick={() => {setStudying(true); setHint(false);}}><div className="resume-icon"><RotateCcw size={20}/></div><div><strong>Tiếp tục Keywork Practice</strong><p>{deck.index}/{deck.ids.length} mục · {deck.mode === 'cards' ? 'Flashcard' : 'Ghép từ và điền bước'}</p></div><ArrowRight size={20}/></button>}
    <section className="kw-overview" aria-label="Tiến độ kiến thức"><div><span className="eyebrow">ĐÃ NẮM</span><strong>{coverage.mastered}<small> / {coverage.total}</small></strong><p>Tự đánh giá theo từng mục. Có thể đổi lại bất cứ lúc nào.</p></div><div className="kw-overview-right"><div className="kw-meter"><span style={{width: `${coverage.mastered / coverage.total * 100}%`}}/></div><div className="kw-counts">{(['unseen', 'learning', 'review', 'mastered'] as const).map(s => <button aria-pressed={status === s} key={s} onClick={() => changeFilter(() => setStatus(status === s ? 'all' : s))}><i className={s}/>{keywordStatusLabels[s]}<b>{coverage[s]}</b></button>)}</div></div></section>
    <div className="section-heading"><h2>Chọn Domain</h2><button className="text-button" aria-pressed={domain === 0} onClick={() => changeFilter(() => setDomain(0))}>Tất cả Domain</button></div>
    <section className="kw-domains">{keywordDomains.map((label, i) => {const c = keywordCoverage(items.filter(q => q.domain === i + 1), progress); return <button className={`kw-domain ${domain === i + 1 ? 'selected' : ''}`} key={label} onClick={() => changeFilter(() => setDomain(domain === i + 1 ? 0 : i + 1))} aria-pressed={domain === i + 1}><span>DOMAIN {i + 1}</span><h3>{label}</h3><p><strong>{c.mastered}</strong> / {c.total} đã nắm</p><div className="kw-meter"><span style={{width: `${c.mastered / c.total * 100}%`}}/></div><small>{c.review} cần ôn · {c.unseen} chưa học</small></button>;})}</section>
    <div className="section-heading"><h2>{domain ? `Domain ${domain} · ` : ''}Chọn Part</h2><button className="text-button" aria-pressed={part === 0} onClick={() => changeFilter(() => setPart(0))}>Tất cả Part</button></div>
    <section className="kw-parts">{keywordParts.map((label, i) => {const c = keywordCoverage(items.filter(q => (!domain || q.domain === domain) && q.part === i + 1), progress); return <button className={part === i + 1 ? 'selected' : ''} key={label} aria-pressed={part === i + 1} onClick={() => changeFilter(() => setPart(part === i + 1 ? 0 : i + 1))}><span>PART {i + 1}</span><strong>{label}</strong><small>{c.mastered}/{c.total} đã nắm · {c.review} cần ôn</small></button>;})}</section>
    <section className="panel kw-launch" aria-label="Tùy chọn phiên Keywork"><div><h2><Sparkles size={21}/>Bắt đầu một lượt học</h2><p>{filtered.length} mục phù hợp với bộ lọc hiện tại. Nội dung đã nắm vẫn có thể ôn lại.</p></div><div className="kw-controls"><label>Cách học<select aria-label="Cách học" value={mode} onChange={e => setMode(e.target.value as KeywordDeck['mode'])}><option value="match">Ghép từ / Điền bước</option><option value="cards">Flashcard</option></select></label><label>Số mục<select aria-label="Số mục" value={limit} onChange={e => setLimit(Number(e.target.value))}><option value={10}>10 mục</option><option value={20}>20 mục</option><option value={50}>50 mục</option><option value={0}>Tất cả mục đã lọc</option></select></label><label>Trạng thái<select aria-label="Trạng thái" value={status} onChange={e => changeFilter(() => setStatus(e.target.value))}><option value="all">Tất cả trạng thái</option>{Object.entries(keywordStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="button primary" disabled={!filtered.length} onClick={() => start()}>Bắt đầu học<ArrowRight size={17}/></button></div></section>
    <section className="kw-catalog"><div className="section-heading"><h2>Danh mục kiến thức <small>({filtered.length})</small></h2><label className="kw-search"><Search size={17}/><input aria-label="Tìm kiến thức Keywork" placeholder="Dịch vụ, keyword, Task…" value={query} onChange={e => changeFilter(() => setQuery(e.target.value))}/></label></div><p className="kw-catalog-note">Mở một mục để đọc đủ nội dung. Các Part dùng chung chủ đề vẫn được theo dõi riêng theo đúng tài liệu.</p>
      {filtered.slice(currentPage * 20, (currentPage + 1) * 20).map(q => <article className="kw-catalog-item" key={q.id}><button className="kw-catalog-toggle" aria-expanded={expanded === q.id} onClick={() => setExpanded(expanded === q.id ? '' : q.id)}><div><ItemLabels item={q}/><h3>{q.title}</h3><p>{q.topic}</p></div><span className={`kw-status ${progress.get(q.id)?.status || 'unseen'}`}>{keywordStatusLabels[progress.get(q.id)?.status || 'unseen']}</span><ChevronDown size={19}/></button>{expanded === q.id && <div className="kw-catalog-body"><p className="kw-reference-prompt" lang="en">{q.prompt}</p>{q.part !== 3 && <p><strong>Đáp án / Từ khóa:</strong> {q.answer}</p>}<div className="kw-actions"><button className="button primary" onClick={() => start([q])}>Học mục này<ArrowRight size={15}/></button><label>Đánh giá<select aria-label={`Trạng thái ${q.title}`} value={progress.get(q.id)?.status || 'unseen'} onChange={e => {if(e.target.value !== 'unseen') mark(q, e.target.value as KeywordStatus);}}><option value="unseen" disabled>Chưa học</option><option value="learning">Đang học</option><option value="review">Cần ôn</option><option value="mastered">Đã nắm</option></select></label></div><ItemDetails item={q}/></div>}</article>)}
      {!filtered.length && <div className="kw-empty"><h3>Không có mục phù hợp</h3><p>Đổi Domain, Part, trạng thái hoặc từ khóa tìm kiếm để học tiếp.</p><button className="button" onClick={() => changeFilter(() => {setQuery(''); setStatus('all'); setDomain(0); setPart(0);})}>Xóa bộ lọc</button></div>}
      {filtered.length > 20 && <div className="kw-pagination"><button className="button" disabled={!currentPage} onClick={() => {setPage(currentPage - 1); setExpanded('');}}>Trang trước</button><span>Trang {currentPage + 1}/{pageCount}</span><button className="button" disabled={currentPage + 1 >= pageCount} onClick={() => {setPage(currentPage + 1); setExpanded('');}}>Trang sau</button></div>}
    </section><p className="kw-catalog-note">Bao phủ {items.length.toLocaleString('vi-VN')} mục từ 16 file bạn cung cấp. Các bài ghép dùng để luyện kiến thức trong tài liệu; xem nguồn và phạm vi ở từng mục.</p>
  </div>;
}

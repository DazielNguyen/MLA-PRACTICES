import { useEffect, useRef, useState } from 'react';
import { ArrowUp, BookOpen, KeyRound, LockKeyhole, MessageCircle, Plus, Square, X } from 'lucide-react';
import Markdown from 'react-markdown';
import type { AssistantTopic } from './assistant-context';
import { keys, read, tabGet, tabSet, write } from './sync/local';

type Message = { role: 'user' | 'assistant'; content: string; complete: boolean; topic?: AssistantTopic; legacy?: boolean };
type Config = { configured: boolean; requiresAccessCode: boolean; model: string };
const ACCESS_KEY = 'ml-ai-access:v1';
const SEARCH_KEY = 'ml-ai-search:v1';
const storageKey = (learnerId: string) => `ml-ai-chat:v2:${learnerId}`;
function loadMessages(key: string): Message[] {
  try {
    const rows: unknown = JSON.parse(read(key) || '[]');
    if (!Array.isArray(rows)) return [];
    return rows.filter((row): row is Message => row && ['user', 'assistant'].includes(row.role) && typeof row.content === 'string' && row.content.length <= 16000 && typeof row.complete === 'boolean').map(row => ({...row, topic: row.topic && ((row.topic.kind === 'question' && Number.isSafeInteger(row.topic.id)) || (row.topic.kind === 'keyword' && typeof row.topic.id === 'string')) && typeof row.topic.label === 'string' ? row.topic : undefined})).slice(-40);
  } catch { return []; }
}
function loadConversation(learnerId: string, current?: AssistantTopic) {
  const key = storageKey(learnerId);
  if (read(key) !== null) return loadMessages(key);
  // Legacy chats have no timestamps. Keep each group intact and mark its origin,
  // putting the currently open item's group last. Original keys remain untouched.
  const prefix = `ml-ai-chat:v1:${learnerId}:`;
  const currentKey = `${prefix}${current?.kind || 'general'}:${current?.id || ''}`;
  return keys(prefix).sort((a,b)=>a === currentKey ? 1 : b === currentKey ? -1 : a.localeCompare(b)).flatMap(oldKey => {
    const [kind,id] = oldKey.slice(prefix.length).split(':');
    const topic: AssistantTopic | undefined = kind === 'question' && /^\d+$/.test(id) ? {kind,id:Number(id),label:`Câu #${id}`} : kind === 'keyword' ? {kind,id,label:`Keywork · ${id}`} : undefined;
    return loadMessages(oldKey).map(message=>({...message,topic,legacy:true}));
  }).slice(-40);
}
const safeLink = (url: string) => { try { return new URL(url).protocol === 'https:' ? url : ''; } catch { return ''; } };

export default function StudyAssistant({ learnerId, topic, embedded, open, close, clearTopic }: { learnerId: string; topic?: AssistantTopic; embedded: boolean; open: boolean; close: () => void; clearTopic: () => void }) {
  const key = storageKey(learnerId);
  const [messages, setMessages] = useState(() => loadConversation(learnerId, topic)), [draft, setDraft] = useState('');
  const [config, setConfig] = useState<Config | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const [access, setAccess] = useState(() => tabGet(ACCESS_KEY) || ''), [editAccess, setEditAccess] = useState(!tabGet(ACCESS_KEY));
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLTextAreaElement>(null), thread = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null), pending = useRef(false), alive = useRef(true);
  const savedMessages = useRef(messages); savedMessages.current = messages;
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { const timer = setTimeout(() => write(key, JSON.stringify(messages.slice(-40))), 250); return () => clearTimeout(timer); }, [messages, key]);
  useEffect(() => {
    const flush = () => write(key, JSON.stringify(savedMessages.current.slice(-40)));
    window.addEventListener('pagehide', flush);
    return () => { flush(); window.removeEventListener('pagehide', flush); };
  }, [key]);
  useEffect(() => {
    if (embedded) return;
    const node = dialog.current;
    if (open) { if (!node?.open) node?.showModal(); }
    else { node?.close(); controller.current?.abort(); }
  }, [open, embedded]);
  const checkConfig = async (signal?: AbortSignal) => {
    setError('');
    try {
      const response = await fetch('/api/chat', { signal });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Chưa kết nối được trợ lý. Hãy thử lại sau.');
      const data = await response.json();
      if (typeof data.configured !== 'boolean') throw new Error('Chưa kết nối được trợ lý.');
      if (alive.current) setConfig(data);
    } catch (e) { if (alive.current && !signal?.aborted) setError((e as Error).message); }
  };
  useEffect(() => { if (!open) return; const abort = new AbortController(); void checkConfig(abort.signal); return () => abort.abort(); }, [open]);
  useEffect(() => {
    const node = thread.current;
    if (node && node.scrollHeight - node.scrollTop - node.clientHeight < 180) node.scrollTop = node.scrollHeight;
  }, [messages, status]);
  const updateReply = (index: number, content: string, complete = false) => {
    if (alive.current) setMessages(previous => previous.map((m, i) => i === index ? { ...m, content, complete } : m));
  };
  const send = async (text = draft, retry = false) => {
    if (pending.current || !text.trim() || !config?.configured || !access.trim()) return;
    // Only completed user/assistant pairs become context. Interrupted turns remain visible.
    const pairs: { role: 'user' | 'assistant'; content: string; context?: unknown }[] = [];
    for (let i = 0; i < messages.length - 1; i++) if (messages[i].role === 'user' && messages[i + 1].role === 'assistant' && messages[i + 1].complete) {
      const previousTopic=messages[i].topic;
      pairs.push({ role: 'user', content: messages[i].content, context: previousTopic ? {kind:previousTopic.kind,id:previousTopic.id,study:previousTopic.study} : null }, { role: 'assistant', content: messages[i + 1].content.slice(0,12000) }); i++;
    }
    let history = pairs.slice(-10);
    while (history.reduce((n, m) => n + m.content.length, text.length) > 32000) history = history.slice(2);
    const retrying = retry && messages.at(-1)?.role === 'assistant' && !messages.at(-1)?.complete;
    const requestTopic = retrying ? messages.at(-2)?.topic : topic;
    const base = (retrying ? messages.slice(0, -2) : messages).slice(-38);
    const payload = () => ({messages:[...history,{role:'user',content:text.trim()}],context:requestTopic ? {kind:requestTopic.kind,id:requestTopic.id,study:requestTopic.study} : null,webSearch});
    while (history.length && new TextEncoder().encode(JSON.stringify(payload())).byteLength > 60000) history = history.slice(2);
    const next: Message[] = [...base, { role: 'user', content: text.trim(), complete: true, topic:requestTopic }, { role: 'assistant', content: '', complete: false, topic:requestTopic }];
    const index = next.length - 1;
    pending.current = true; setBusy(true); setMessages(next); setDraft(''); setError(''); setStatus('Đang suy nghĩ…');
    input.current?.focus({preventScroll:true});
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 65000);
    let received = '', finished = false;
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access.trim()}` }, signal: abort.signal,
        body: JSON.stringify(payload()) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) { tabSet(ACCESS_KEY, ''); setEditAccess(true); }
        throw new Error(data.error || 'Chưa nhận được câu trả lời. Hãy thử lại.');
      }
      if (!response.body || !response.headers.get('content-type')?.includes('application/x-ndjson')) throw new Error('Kết nối trợ lý chưa sẵn sàng.');
      const reader = response.body.getReader(), decoder = new TextDecoder();
      let buffer = '';
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'delta') { received += event.text; updateReply(index, received); setStatus('Đang trả lời…'); }
        else if (event.type === 'status') setStatus(event.text);
        else if (event.type === 'done') { received = event.text; finished = true; updateReply(index, received, true); }
        else if (event.type === 'error') throw new Error(event.error);
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n'); buffer = lines.pop() || '';
          for (const line of lines) consume(line);
        }
        consume(buffer + decoder.decode());
      } finally { await reader.cancel(); reader.releaseLock(); }
      if (!finished) throw new Error('Kết nối bị ngắt trước khi trả lời xong. Bạn có thể thử lại.');
    } catch (e) {
      if (alive.current) setError(abort.signal.aborted ? 'Đã dừng trả lời. Bạn có thể hỏi tiếp hoặc thử lại.' : (e as Error).message);
    } finally {
      clearTimeout(timeout); pending.current = false; controller.current = null;
      if (alive.current) { setBusy(false); setStatus(''); }
    }
  };
  const [webSearch, setWebSearch] = useState(() => tabGet(SEARCH_KEY) === 'true');
  const selected = topic?.study?.selected;
  const selection = Array.isArray(selected) ? selected.join(' + ') : selected;
  const suggestions = topic ? [selection ? 'Vì sao lựa chọn của tôi đúng hoặc sai?' : 'Giải thích câu này theo từng keyword.', 'Câu này cần lưu ý keyword và bẫy nào?', 'Cho tôi mẹo nhớ và một ví dụ dễ hiểu.'] : ['So sánh các kiểu SageMaker inference.', 'Ôn những ý chính của Domain 1.', 'Giải thích data drift và concept drift.'];
  const lastQuestion = messages.at(-2)?.role === 'user' ? messages.at(-2)?.content : undefined;
  const content = <>
    <header className="assistant-header"><span className="assistant-avatar"><MessageCircle size={22}/></span><div><h2 id="assistant-title">Trợ lý MLA</h2><p>{embedded?'Cùng học · Tự theo câu hiện tại':'Hỏi ngay, hiểu từng ý.'}</p></div><button className="icon-button" title="Cuộc trò chuyện mới" aria-label="Cuộc trò chuyện mới" disabled={busy} onClick={() => { setMessages([]); setError(''); }}><Plus size={19}/></button>{!embedded && <button className="icon-button" aria-label="Đóng trợ lý AI" onClick={close}><X size={20}/></button>}</header>
    {topic && <div className="assistant-topic"><BookOpen size={15}/><span>{topic.label}<small>Tự theo nội dung đang mở{selection ? ` · Bạn chọn: ${selection}` : ' · Chưa chọn đáp án'}</small></span><button className="icon-button" aria-label="Chuyển sang hỏi chung" onClick={clearTopic}><X size={14}/></button></div>}
    <div className="assistant-thread" ref={thread}>
      <div className="assistant-intro"><strong>Cùng gỡ chỗ chưa rõ.</strong><p>{topic ? 'Tôi đã nhận câu đang mở và lựa chọn của bạn. Cứ hỏi “vì sao sai?” hoặc “cần lưu ý gì?”, không cần chép lại đề.' : 'Tôi giải thích bằng tiếng Việt, giữ tên dịch vụ và keyword tiếng Anh. Mở một câu hỏi hoặc mục Keywork để tôi tự theo nội dung bạn đang học.'} Chọn “Tra tài liệu AWS” khi cần đối chiếu nguồn.</p></div>
      {!config && !error && <p className="assistant-notice" role="status">Đang kiểm tra kết nối…</p>}
      {config && !config.configured && <div className="assistant-notice" role="status">Trợ lý chưa được kích hoạt. Chủ website cần hoàn tất cấu hình kết nối.<button className="text-button" onClick={() => void checkConfig()}>Kiểm tra lại</button></div>}
      {config?.configured && editAccess && <form className="assistant-unlock" onSubmit={e => { e.preventDefault(); tabSet(ACCESS_KEY, access.trim()); setEditAccess(false); input.current?.focus(); }}><label><KeyRound size={15}/>Mã truy cập bot<input type="password" aria-label="Mã truy cập bot" value={access} onChange={e => setAccess(e.target.value)} autoComplete="off" maxLength={200} placeholder="Nhập mã riêng của bạn"/></label><button className="button secondary" disabled={access.trim().length < 16}>Dùng mã này</button><small>Mã này khác API key OpenAI. Chỉ nhớ trong tab đang mở.</small></form>}
      {!messages.length && <div className="assistant-suggestions">{suggestions.map(text => <button key={text} disabled={!config?.configured || editAccess || busy} onClick={() => void send(text)}>{text}<ArrowUp size={14}/></button>)}</div>}
      {messages.map((m, i) => <article className={`assistant-message ${m.role}`} key={i}><span className="assistant-author">{m.role === 'user' ? 'Bạn' : 'Trợ lý MLA'}</span>{m.role==='user' && <small className="assistant-message-topic">{m.legacy?'Hội thoại cũ · ':''}{m.topic?.label || 'Hỏi chung'}</small>}<div className="assistant-markdown"><Markdown skipHtml urlTransform={safeLink} components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>, img: () => null }}>{m.content.replace(/\uE200[^\uE201]*\uE201/g, '') || (busy && i === messages.length - 1 ? 'Đang suy nghĩ…' : 'Chưa có câu trả lời.')}</Markdown></div>{m.role === 'assistant' && !m.complete && !busy && <small className="assistant-incomplete">Chưa hoàn tất</small>}</article>)}
      {error && <div className="assistant-error" role="alert"><p>{error}</p>{!busy && lastQuestion && !editAccess && config?.configured && <button className="text-button" onClick={() => void send(lastQuestion, true)}>Thử lại câu vừa hỏi</button>}{!config && <button className="text-button" onClick={() => void checkConfig()}>Kết nối lại</button>}</div>}
    </div>
    <form className="assistant-composer" onSubmit={e => { e.preventDefault(); void send(); }}>
      <div className="assistant-options"><label><input type="checkbox" checked={webSearch} disabled={busy} onChange={e => {setWebSearch(e.target.checked);tabSet(SEARCH_KEY,String(e.target.checked));}}/>Tra tài liệu AWS</label><button type="button" className="text-button" onClick={() => { controller.current?.abort(); tabSet(ACCESS_KEY, ''); setAccess(''); setEditAccess(true); }}><LockKeyhole size={12}/>Khóa bot</button></div>
      <div className="assistant-input"><textarea ref={input} aria-label="Câu hỏi cho trợ lý" rows={2} maxLength={4000} value={draft} onChange={e => setDraft(e.target.value)} placeholder={topic ? 'Bạn chưa rõ điểm nào trong câu này?' : 'Hỏi về AWS hoặc kiến thức MLA-C01…'} disabled={!config?.configured || editAccess} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}/>{busy ? <button type="button" className="assistant-send" aria-label="Dừng trả lời" onClick={() => controller.current?.abort()}><Square size={16}/></button> : <button className="assistant-send" aria-label="Gửi câu hỏi" disabled={!draft.trim() || !config?.configured || editAccess}><ArrowUp size={20}/></button>}</div>
      <p className="assistant-footnote" role="status">{status ? `${status}${messages.at(-1)?.topic ? ` · ${messages.at(-1)!.topic!.label}` : ''}` : 'Enter để gửi · Shift + Enter xuống dòng. AI có thể nhầm; đối chiếu nguồn khi cần.'}</p>
      <p className="assistant-storage-note">Hội thoại lưu trên trình duyệt này, riêng theo người học. Tin nhắn, câu đang mở và lựa chọn hiện tại được gửi tới OpenAI khi bạn bấm gửi.</p>
    </form>
  </>;
  return embedded ? <section className="assistant-dialog assistant-embedded" aria-labelledby="assistant-title">{content}</section> : <dialog ref={dialog} className="assistant-dialog" aria-labelledby="assistant-title" onCancel={e=>{e.preventDefault();close();}}>{content}</dialog>;
}

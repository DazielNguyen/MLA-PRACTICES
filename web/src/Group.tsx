import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, RefreshCw, Users } from 'lucide-react';
import type { Question, Session } from './domain';
import { emptyState, formatTime, score, validateState, studyState } from './domain';
import { cloudConfigured, sharedHistory, sharedProfiles } from './sync/cloud';
import type { SharedLearner } from './sync/cloud';
import { getProfiles, getWriter, ProgressRepository } from './sync/local';
import { Empty } from './components';
import { Results } from './SessionView';
export default function Group({ bank }: { bank: Question[] }) {
  const [people, setPeople] = useState<SharedLearner[]>([]), [selected, setSelected] = useState<SharedLearner | null>(null), [sessions, setSessions] = useState<Session[]>([]), [result, setResult] = useState<Session | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const request = useRef(0);
  const loadPeople = async () => {
    setBusy(true); setError('');
    try {
      if (cloudConfigured) setPeople(await sharedProfiles());
      else setPeople(getProfiles().filter(p => p.shared).map(p => ({ id: p.id, name: p.name, sessions: new ProgressRepository(p, bank, getWriter()).state().history.length, latest: null })));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  useEffect(() => { void loadPeople(); }, []);
  const view = async (person: SharedLearner) => {
    const id = ++request.current; setSelected(person); setSessions([]); setResult(null); setBusy(true); setError('');
    try {
      const profile = getProfiles().find(p => p.id === person.id && p.shared);
      const history = cloudConfigured ? await sharedHistory(person.id) : profile ? new ProgressRepository(profile, bank, getWriter()).state().history : [];
      const validated = studyState(validateState({ ...emptyState(), history }, bank), bank).history;
      if (request.current === id) setSessions(validated);
    } catch (e) { if (request.current === id) setError((e as Error).message); } finally { if (request.current === id) setBusy(false); }
  };
  if (result) return <><div className="shared-view-banner"><button className="text-button" onClick={() => setResult(null)}><ArrowLeft size={15}/>Lịch sử của {selected?.name}</button><span>Chỉ xem · Không thay đổi tiến trình của bạn</span></div><Results session={result} bank={bank} go={() => setResult(null)}/></>;
  return <div className="page group-page"><div className="page-heading"><div className="eyebrow">LEARN TOGETHER</div><h1>Cùng học, cùng tiến bộ.</h1><p>Chọn người học để xem các phiên họ chia sẻ. Mỗi người vẫn có tiến trình riêng.</p></div>{!cloudConfigured && <div className="inline-message"><Users size={17}/>Đang hiển thị hồ sơ trên máy này. Kết nối Supabase để xem nhóm trên nhiều thiết bị.</div>}<div className="group-layout"><aside className="panel group-people"><div className="section-heading"><h2>Người học</h2><button className="icon-button" aria-label="Làm mới danh sách người học" disabled={busy} onClick={() => { void loadPeople(); }}><RefreshCw size={16}/></button></div>{people.map(p => <button className={`group-person ${selected?.id === p.id ? 'active' : ''}`} key={p.id} onClick={() => { void view(p); }}><span className="learner-avatar">{p.name.slice(0,1).toUpperCase()}</span><span><strong>{p.name}</strong><small>#{p.id.slice(0,8)}</small></span><ArrowRight size={14}/></button>)}{!people.length && !busy && <p className="subtle">Chưa có hồ sơ chia sẻ lịch sử. Bật chia sẻ trong trang Người học để xuất hiện ở đây.</p>}</aside><section className="group-history">{error && <p className="field-error" role="alert">{error}</p>}{busy && <p className="subtle" role="status">Đang tải lịch sử…</p>}{selected ? <><div className="section-heading"><h2>Lịch sử của {selected.name}</h2><span>Chỉ xem</span></div>{sessions.length ? <div className="panel">{sessions.map(s => { const result = score(s, bank); return <button className="recent-row group-session" key={s.id} onClick={() => setResult(s)}><span className="recent-icon"><BookOpen size={18}/></span><span><strong>{s.mode === 'exam' ? 'Thi thử' : 'Luyện tập'} · {s.questionIds.length} câu</strong><small>{new Date(s.finishedAt!).toLocaleString('vi-VN')} · {formatTime(s.finishedAt! - s.startedAt)}</small></span><b>{result.total ? `${result.percent}%` : '—'}</b><ArrowRight size={16}/></button>; })}</div> : !busy && <div className="panel"><Empty title="Chưa có bài đã hoàn thành">Bài đang làm không xuất hiện trong lịch sử chia sẻ.</Empty></div>}</> : <div className="panel"><Empty title="Chọn một người học">Lịch sử và kết quả đã chia sẻ sẽ xuất hiện tại đây.</Empty></div>}</section></div></div>;
}

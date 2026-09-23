import { studyQuestions } from './domain';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Copy, KeyRound, Laptop, RefreshCw, UserRound, Users } from 'lucide-react';
import type { Question } from './domain';
import { STORAGE_KEY } from './domain';
import { CHANGE_EVENT, ROW_PREFIX, createLearner, getWriter, ProgressRepository, read } from './sync/local';
import type { Learner } from './sync/local';
import { changeSharing, cloudConfigured, restoreProfile } from './sync/cloud';
import { learnerOverview, matchingLearners } from './learner-selection';

export function Welcome({ profiles, select, bank }: { profiles: Learner[]; select: (id: string) => void; bank: Question[] }) {
  const [name, setName] = useState(''), [code, setCode] = useState(() => location.hash.startsWith('#/join/') ? location.hash.slice(7) : '');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [carry, setCarry] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let frame = 0;
    const changed = (event: Event) => {
      if (event instanceof StorageEvent && event.key && !event.key.startsWith(ROW_PREFIX)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRevision(value => value + 1));
    };
    window.addEventListener(CHANGE_EVENT, changed); window.addEventListener('storage', changed);
    return () => { cancelAnimationFrame(frame); window.removeEventListener(CHANGE_EVENT, changed); window.removeEventListener('storage', changed); };
  }, []);
  const repositories = useMemo(() => profiles.map(profile => new ProgressRepository(profile, bank, getWriter())), [profiles, bank]);
  const saved = useMemo(() => repositories.map(repo => ({
    profile: repo.learner, ...learnerOverview(repo.rows(), bank),
  })).sort((a, b) => (b.lastActivity || b.profile.createdAt) - (a.lastActivity || a.profile.createdAt)), [repositories, bank, revision]);
  const matches = matchingLearners(profiles, name);
  const hasLegacy = Boolean(read(STORAGE_KEY) && !read('ml-legacy-owner:v2'));
  const enter = (id: string) => { history.replaceState(null, '', '#/'); select(id); };
  const create = () => {
    if (matches.length > 1) { setError('Có nhiều hồ sơ trùng tên. Chọn hồ sơ trong danh sách phía trên.'); return; }
    if (matches.length === 1) { enter(matches[0].id); return; }
    try {
      const learner = createLearner(name);
      if (carry && hasLegacy) new ProgressRepository(learner, bank, getWriter()).migrateLegacy();
      enter(learner.id);
    } catch (e) { setError((e as Error).message); }
  };
  const restore = async () => {
    setBusy(true); setError('');
    try { const learner = await restoreProfile(code); enter(learner.id); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  return <main className={`welcome-page ${profiles.length ? 'has-saved-learners' : ''}`}>
    <div className="welcome-brand"><span className="brand-symbol">m<span>l</span></span>ML Practice</div>
    <div className="welcome-grid">
      <section className="welcome-copy"><span className="eyebrow">CÙNG HỌC, THEO NHỊP RIÊNG</span><h1>Mỗi người một hành trình.<br/>Cùng nhau tiến bộ.</h1><p>Chọn tên để học tiếp. Bài làm, thẻ đã thuộc và lịch sử được lưu riêng cho từng người, kể cả khi đóng tab.</p><div className="welcome-features"><span><UserRound size={18}/>Chọn tên là học tiếp</span><span><Laptop size={18}/>Mỗi tab một bài làm</span><span><Users size={18}/>Xem lịch sử được chia sẻ</span></div><div className="welcome-cloud"><span className="live-dot"/>{cloudConfigured ? 'Đã cấu hình đồng bộ Supabase' : 'Đang lưu trên trình duyệt · Chưa cấu hình Supabase'}</div></section>
      <section className="panel welcome-card">
        <div className="mode-icon green"><UserRound size={26}/></div><h2>Hôm nay ai đang học?</h2><p>Không cần email hoặc mật khẩu.</p>
        {saved.length > 0 && <section className="saved-learners" aria-label="Người học đã lưu">
          <span className="field-label">Chọn tên để học tiếp</span>
          <p className="saved-learners-hint">Hồ sơ trên trình duyệt này · Tiến trình được lưu khi đóng tab.</p>
          {saved.map(({ profile, studied, known, unfinished, completed, lastActivity }) => <button key={profile.id} className={matches.some(match => match.id === profile.id) ? 'name-match' : ''} disabled={busy} onClick={() => enter(profile.id)}>
            <span className="learner-avatar">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="saved-learner-info"><strong>{profile.name}</strong><span className="saved-learner-progress">{studied} câu đã học · {known} thẻ đã thuộc</span><span className="saved-learner-sessions">{unfinished > 0 && <b>{unfinished} bài đang làm · </b>}{completed} bài hoàn thành</span><small>#{profile.id.slice(0, 8)} · {lastActivity ? new Date(lastActivity).toLocaleDateString('vi-VN') : 'Chưa bắt đầu'}</small></span>
            <ArrowRight size={17}/>
          </button>)}
        </section>}
        <form onSubmit={e => { e.preventDefault(); create(); }}>
          <label className="field-label" htmlFor="learner-name">Tên người học</label>
          <input id="learner-name" placeholder={profiles.length ? 'Nhập tên đã lưu hoặc tên mới' : 'Ví dụ: Duy'} maxLength={40} required value={name} onChange={e => { setName(e.target.value); setError(''); }} autoComplete="nickname" aria-describedby="learner-name-hint"/>
          <small id="learner-name-hint" aria-live="polite">{matches.length > 1 ? 'Có nhiều hồ sơ trùng tên. Chọn đúng hồ sơ ở phía trên.' : matches.length === 1 ? `Đã tìm thấy ${matches[0].name}. Tiến trình cũ sẽ được giữ nguyên.` : 'Tên đã lưu sẽ mở hồ sơ cũ. Tên mới sẽ tạo hồ sơ riêng.'}</small>
          {hasLegacy && matches.length === 0 && <label className="check-label"><input type="checkbox" checked={carry} onChange={e => setCarry(e.target.checked)}/>Chuyển tiến trình cũ trên máy vào hồ sơ này</label>}
          <button className="button primary" disabled={!name.trim() || busy || matches.length > 1}>{matches.length === 1 ? `Tiếp tục với ${matches[0].name}` : matches.length > 1 ? 'Chọn hồ sơ phía trên' : 'Tạo hồ sơ và bắt đầu'} <ArrowRight size={16}/></button>
        </form>
        <details className="restore-profile" open={Boolean(location.hash.startsWith('#/join/'))}><summary><KeyRound size={15}/>Tiếp tục từ thiết bị khác</summary><p>Dán mã hoặc link tiếp tục riêng để mở hồ sơ chưa được lưu trên trình duyệt này.</p><form onSubmit={e => { e.preventDefault(); void restore(); }}><textarea aria-label="Mã tiếp tục học" placeholder="Dán mã hoặc link tiếp tục" value={code} onChange={e => setCode(e.target.value)} rows={3}/><button className="button secondary" disabled={!cloudConfigured || !code.trim() || busy}>{busy ? 'Đang mở hồ sơ…' : 'Mở hồ sơ bằng mã'}</button></form>{!cloudConfigured && <small>Tính năng này dùng được sau khi cấu hình Supabase.</small>}</details>
        {error && <p className="field-error" role="alert">{error}</p>}
      </section>
    </div><footer>{studyQuestions(bank).length} câu hỏi · Flashcard · Luyện tập · Thi thử</footer>
  </main>;
}

export function LearnerSettings({ learner, switchLearner, cloudStatus, cloudError, lastSynced, sync }: { learner: Learner; switchLearner: () => void; cloudStatus: string; cloudError: string; lastSynced: number | null; sync: () => Promise<void> }) {
  const [showCode, setShowCode] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const link = `${location.origin}${location.pathname}#/join/${learner.code}`;
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setMessage('Đã sao chép. Giữ riêng mã này để tiếp tục học trên thiết bị khác.'); } catch { setMessage('Chưa sao chép được. Bạn có thể chọn và sao chép trực tiếp mã hiển thị.'); } };
  const share = async (value: boolean) => {
    setBusy(true); setMessage('');
    try { await changeSharing(learner, value); setMessage(value ? 'Đã chia sẻ lịch sử hoàn thành. Người khác chỉ có thể xem.' : 'Đã tắt chia sẻ lịch sử.'); }
    catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  };
  return <div className="page learner-page"><div className="page-heading"><div className="eyebrow">YOUR LEARNING PROFILE</div><h1>Xin chào, {learner.name}.</h1><p>Tiến trình riêng của bạn, dù học ở tab nào.</p></div><section className="panel learner-info"><span className="learner-avatar large">{learner.name.slice(0,1).toUpperCase()}</span><div><h2>{learner.name}</h2><p>Hồ sơ #{learner.id.slice(0,8)}</p></div><button className="button secondary" onClick={switchLearner}><Users size={16}/>Đổi người học</button></section><div className="learner-settings-grid"><section className="panel"><span className="mode-icon green"><RefreshCw size={22}/></span><h2>Lưu và đồng bộ</h2><p>{!cloudConfigured ? 'Hiện lưu trên trình duyệt. Thêm cấu hình Supabase để đồng bộ giữa các thiết bị.' : cloudStatus === 'synced' ? 'Các thay đổi đã được gửi lên Supabase.' : cloudStatus === 'error' ? 'Chưa kết nối được. Thay đổi vẫn được giữ trên máy và sẽ thử gửi lại.' : 'Đang chờ đồng bộ tiến trình lên Supabase.'}</p>{lastSynced && <small>Lần gần nhất: {new Date(lastSynced).toLocaleTimeString('vi-VN')}</small>}{cloudError && <p className="field-error">{cloudError}</p>}{cloudConfigured && <button className="button secondary" disabled={cloudStatus === 'syncing'} onClick={() => { void sync(); }}><RefreshCw size={15}/>Đồng bộ ngay</button>}</section><section className="panel"><span className="mode-icon purple"><Users size={22}/></span><h2>Lịch sử cho nhóm học</h2><p>Khi bật, người vào website có thể xem tên và các bài đã hoàn thành. Bài đang làm và quyền sửa vẫn thuộc hồ sơ này.</p><label className="check-label"><input type="checkbox" checked={learner.shared} disabled={busy} onChange={e => { void share(e.target.checked); }}/>Chia sẻ lịch sử học tập</label></section></div><section className="panel recovery-panel"><KeyRound size={25}/><div><h2>Tiếp tục trên thiết bị khác</h2><p>Mã riêng mở quyền học và lưu bài vào hồ sơ này. Không gửi mã cho nhóm; hãy dùng trang Học chung để chia sẻ lịch sử.</p>{!cloudConfigured ? <p className="subtle">Cần cấu hình Supabase trước. Hiện bạn có thể chuyển dữ liệu bằng bản sao JSON.</p> : !learner.cloudReady ? <p className="subtle">Mã sẽ sẵn sàng sau lần đồng bộ đầu tiên.</p> : <><button className="button secondary" onClick={() => setShowCode(v => !v)}>{showCode ? 'Ẩn mã tiếp tục' : 'Xem mã tiếp tục'}</button>{showCode && <div className="recovery-code"><input readOnly aria-label="Mã hồ sơ riêng" value={learner.code} onFocus={e => e.target.select()}/><div><button className="button secondary" onClick={() => { void copy(learner.code); }}><Copy size={15}/>Sao chép mã</button><button className="button primary" onClick={() => { void copy(link); }}><Copy size={15}/>Sao chép link</button></div></div>}</>}</div></section>{message && <div className="inline-message" role="status"><Check size={16}/>{message}</div>}</div>;
}

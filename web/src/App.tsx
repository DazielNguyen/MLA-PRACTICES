import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronRight, Clock3, Download, GraduationCap, LayoutDashboard, Layers3, Library, Menu, TrendingUp, Upload, UserRound, Users, X } from 'lucide-react';
import rawBank from '@study-bank';
import type { Question, Session, Settings, State } from './domain';
import { createSession, defaultSettings, importedBankRange, eligibleQuestions, finishSession, studyQuestions, studyState, isStudySession } from './domain';
import { useLearners, useProgress } from './store';
import { Welcome, LearnerSettings } from './Learners';
import Group from './Group';
import type { Learner } from './sync/local';
import type { Backup } from './sync/records';
import { validateBackup } from './sync/records';
import { cloudConfigured } from './sync/cloud';
import { Dialog, Empty } from './components';
import Home from './Home';
import Setup from './Setup';
import SessionView, { Results } from './SessionView';
import Flashcards from './Flashcards';
import LibraryPage from './Library';
import ProgressPage from './Progress';

const bank = rawBank as Question[];
const KeywordPractice = lazy(() => import('./KeywordPractice'));
const studyBank = studyQuestions(bank);
const navigation = [
  { path:'/', label:'Tổng quan', icon:LayoutDashboard },
  { path:'/keywork', label:'Keywork Practice', icon:GraduationCap },
  { path:'/flashcards', label:'Flashcard', icon:Layers3 },
  { path:'/practice', label:'Luyện câu hỏi', icon:BookOpen },
  { path:'/exam', label:'Thi thử', icon:Clock3 },
  { path:'/library', label:'Ngân hàng câu hỏi', icon:Library },
  { path:'/progress', label:'Tiến trình của tôi', icon:TrendingUp },
  { path:'/group', label:'Học chung', icon:Users },
  { path:'/learner', label:'Người học', icon:UserRound },
];
function download(state:Backup) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`ml-practice-${new Date().toISOString().slice(0,10)}.json`;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function App() {
  const { profiles, learner, select } = useLearners();
  if (!learner || location.hash.startsWith('#/join/')) return <Welcome profiles={profiles} select={select} bank={bank}/>;
  return <StudyApp key={learner.id} learner={learner} switchLearner={()=>select('')}/>;
}
function StudyApp({learner,switchLearner}:{learner:Learner;switchLearner:()=>void}) {
  const { state: storedState, update, storageError, repo, cloudStatus, cloudError, lastSynced, sync }=useProgress(bank,learner);
  const state=useMemo(()=>studyState(storedState,bank),[storedState]);
  const saveLabel = storageError ? 'Chưa lưu được trên máy' : cloudStatus==='local' ? 'Lưu trên trình duyệt' : cloudStatus==='synced' ? 'Đã đồng bộ' : cloudStatus==='error' ? 'Chờ kết nối lại' : 'Đang đồng bộ…';
  const [route,setRoute]=useState(location.hash.slice(1)||'/');
  const [menu,setMenu]=useState(false), [message,setMessage]=useState('');
  const [pending,setPending]=useState<Session|null>(null), [imported,setImported]=useState<Backup|State|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  const go=(path:string)=>{location.hash=path;setMenu(false);};
  useEffect(()=>{const changed=()=>{setRoute(location.hash.slice(1)||'/');window.scrollTo({top:0});};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
  useEffect(()=>{
    const active=state.active;
    if(!active?.deadline)return;
    let timer:ReturnType<typeof setTimeout>;
    const expire=()=>{
      clearTimeout(timer);
      const remaining=active.deadline!-Date.now();
      if(remaining>0){timer=setTimeout(expire,remaining);return;}
      let submitted=false;
      update(s=>{if(s.active?.id!==active.id)return s;submitted=true;return finishSession(s,bank,Date.now(),'timeout');});
      if(submitted)go(`/results/${active.id}`);
    };
    expire();window.addEventListener('focus',expire);document.addEventListener('visibilitychange',expire);
    return()=>{clearTimeout(timer);window.removeEventListener('focus',expire);document.removeEventListener('visibilitychange',expire);};
  },[state.active?.id,state.active?.deadline,update]);
  useEffect(()=>{if(!message)return;const id=window.setTimeout(()=>setMessage(''),7000);return()=>clearTimeout(id);},[message]);
  const start=(settings:Settings,mode:Session['mode'])=>{
    try {const session=createSession(eligibleQuestions(bank,settings,state,mode),settings,mode);if(state.active)setPending(session);else{update(s=>({...s,active:session}));go('/session');}}
    catch(e){setMessage((e as Error).message);}
  };
  const finish=()=>{const id=state.active?.id;if(!id)return;update(s=>finishSession(s,bank));go(`/results/${id}`);};
  const importFile=async(file?:File)=>{
    if(!file)return;
    try {if(file.size>20000000)throw new Error('File quá lớn. Hãy chọn bản sao JSON được xuất từ ứng dụng.');setImported(validateBackup(JSON.parse(await file.text()),bank));}
    catch(e){setMessage(e instanceof SyntaxError?'Không đọc được JSON. Tiến trình hiện tại vẫn được giữ nguyên.':(e as Error).message);}
  };
  const overlays=<>
    <input ref={fileInput} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Chọn file tiến trình" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}}/>
    {message&&<div role="status" className="toast">{message}<button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setMessage('')}><X size={16}/></button></div>}
    {storageError&&<div role="alert" className="storage-error">{storageError}<button onClick={()=>download(repo.backup())}>Xuất bản sao</button></div>}
    {pending&&<Dialog title="Bạn có một phiên đang làm" confirmLabel="Lưu bài cũ và bắt đầu" onClose={()=>setPending(null)} onConfirm={()=>{const session={...pending,startedAt:Date.now(),deadline:pending.mode==='exam'?Date.now()+pending.settings.minutes*60000:null};update(s=>({...finishSession(s,bank),active:session}));setPending(null);go('/session');}}><p>Phiên hiện tại sẽ được nộp và lưu vào lịch sử trước khi bắt đầu phiên mới. Câu chưa trả lời sẽ tính là chưa đúng.</p><p>Chọn “Quay lại” để giữ nguyên phiên đang làm.</p></Dialog>}
    {imported&&<Dialog title="Gộp bản sao vào hồ sơ này?" confirmLabel="Khôi phục bản sao" onClose={()=>setImported(null)} onConfirm={()=>{download(repo.backup());repo.importBackup(imported);setImported(null);go('/progress');setMessage('Đã gộp bản sao vào hồ sơ này. Bản sao trước khi gộp đã được tải xuống.');}}><p>Bản sao sẽ được gộp vào hồ sơ <strong>{learner.name}</strong>. Những bài đã lưu vẫn được giữ nguyên.</p><p>Ứng dụng tải bản sao hiện tại xuống trước khi gộp. Bài chưa hoàn thành có thể mở lại từ trang Tiến trình; thời hạn thi giữ nguyên.</p></Dialog>}
  </>;
  if(route==='/session'&&state.active)return <>{overlays}<SessionView key={state.active.id} session={state.active} state={state} bank={bank} update={update} go={go} finish={finish} learnerName={learner.name} saveLabel={saveLabel}/></>;
  const result=route.startsWith('/results/')?state.history.find(s=>s.id===route.slice(9)):null;
  const title=navigation.find(n=>n.path===route)?.label||(result?'Kết quả phiên học':'Phiên học');
  return <div className="app-shell">
    <a href="#main" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>Đến nội dung chính</a>
    {menu&&<button className="sidebar-scrim" aria-label="Đóng điều hướng" onClick={()=>setMenu(false)}/>}
    <aside className={`sidebar ${menu?'open':''}`}><a className="brand" href="#/" aria-label="ML Practice — Tổng quan" onClick={()=>setMenu(false)}><span className="brand-symbol">m<span>l</span></span><span>ML Practice<small>YOUR LEARNING SPACE</small></span></a><div className="nav-caption">KHÔNG GIAN CỦA BẠN</div><nav aria-label="Điều hướng chính">{navigation.map(({path,label,icon:Icon},i)=><a href={`#${path}`} onClick={()=>setMenu(false)} className={`nav-link ${route===path?'active':''} ${i===4?'nav-divider':''}`} aria-label={label} title={label} aria-current={route===path?'page':undefined} key={path}><Icon size={19}/><span>{label}</span>{route===path&&<span className="nav-active-dot"/>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="bank-card"><GraduationCap size={22}/><span>BỘ TÀI LIỆU ĐANG HỌC</span><strong>Machine Learning Engineer<br/>MLA-C01</strong><div>{studyBank.length} câu hỏi <span>Associate</span></div></div><p><span className="live-dot"/>Học theo nhịp của bạn</p><span className="sidebar-version">ML Practice · v2.0</span></div></aside>
    <div className="app-main"><header className="topbar"><div><button className="icon-button menu-button" aria-label="Mở điều hướng" onClick={()=>setMenu(true)}><Menu size={21}/></button><span className="breadcrumb">Không gian học tập</span><ChevronRight size={14}/><strong>{title}</strong></div><div><span className={`save-indicator ${storageError?'failed':''}`}><Check size={13}/>{saveLabel}</span><button className="current-learner" onClick={()=>go('/learner')} aria-label={`Đang học: ${learner.name}`}><span className="profile-icon">{learner.name.slice(0,1).toUpperCase()}</span><span>{learner.name}</span></button></div></header>
    <main id="main" tabIndex={-1}>
      {cloudError&&<div className="cloud-warning" role="status"><span>Chưa đồng bộ được. Bài làm vẫn được giữ trên máy.</span><button className="text-button" onClick={()=>go('/learner')}>Xem kết nối</button></div>}
      {route==='/'?<Home state={state} bank={bank} go={go} unfinished={repo.unfinished().find(s=>isStudySession(s,bank)) || null} resume={id=>{repo.resume(id);go('/session');}} quick={()=>start({...defaultSettings,count:10,quick:true,range:importedBankRange},'practice')}/>:
       route==='/keywork'?<Suspense fallback={<div className="page" role="status">Đang mở Keywork Practice…</div>}><KeywordPractice repo={repo} revision={storedState}/></Suspense>:
       route==='/flashcards'?<Flashcards bank={bank} state={state} update={update}/>:
       route==='/practice'||route==='/exam'?<Setup key={route} mode={route==='/exam'?'exam':'practice'} bank={bank} state={state} start={start}/>:
       route==='/library'?<LibraryPage bank={bank} state={state} update={update}/>:
       route==='/learner'?<LearnerSettings learner={learner} switchLearner={switchLearner} cloudStatus={cloudStatus} cloudError={cloudError} lastSynced={lastSynced} sync={sync}/>:
       route==='/group'?<Group bank={bank}/>:
       route==='/progress'?<ProgressPage bank={bank} state={state} learnerName={learner.name} cloud={cloudConfigured} unfinished={repo.unfinished().filter(s=>isStudySession(s,bank))} resume={id=>{repo.resume(id);go('/session');}} go={go} exportProgress={()=>download(repo.backup())} importProgress={()=>fileInput.current?.click()}/>:
       result?<Results key={result.id} session={result} bank={bank} state={state} go={go}/>:
       <div className="page"><Empty title={route==='/session'?'Phiên này không còn trong bộ MLA-C01 hoặc đã đóng':'Chưa có phiên học ở đây'}>Web chỉ phục vụ MLA-C01. Phiên từ bộ đề cũ vẫn được giữ trong bản sao tiến trình.</Empty><button className="button primary" onClick={()=>go('/progress')}>Xem tiến trình <ArrowUpRight size={16}/></button></div>}
    </main><footer className="app-footer"><span>Small steps. Deep learning.</span><div><button onClick={()=>download(repo.backup())}><Download size={13}/>Xuất tiến trình</button><button onClick={()=>fileInput.current?.click()}><Upload size={13}/>Nhập bản sao</button></div></footer></div>{overlays}
  </div>;
}

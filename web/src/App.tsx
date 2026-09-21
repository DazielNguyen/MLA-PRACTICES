import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, Check, ChevronRight, Clock3, Download, GraduationCap, LayoutDashboard, Layers3, Library, Menu, TrendingUp, Upload, X } from 'lucide-react';
import rawBank from './data/questions.json';
import type { Question, Session, Settings, State } from './domain';
import { createSession, defaultSettings, eligibleQuestions, finishSession, validateState } from './domain';
import { useProgress } from './store';
import { Dialog, Empty } from './components';
import Home from './Home';
import Setup from './Setup';
import SessionView, { Results } from './SessionView';
import Flashcards from './Flashcards';
import LibraryPage from './Library';
import ProgressPage from './Progress';

const bank = rawBank as Question[];
const navigation = [
  { path:'/', label:'Tổng quan', icon:LayoutDashboard },
  { path:'/flashcards', label:'Flashcard', icon:Layers3 },
  { path:'/practice', label:'Luyện câu hỏi', icon:BookOpen },
  { path:'/exam', label:'Thi thử', icon:Clock3 },
  { path:'/library', label:'Ngân hàng câu hỏi', icon:Library },
  { path:'/progress', label:'Tiến trình của tôi', icon:TrendingUp },
];
function download(state:State) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`ml-practice-${new Date().toISOString().slice(0,10)}.json`;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function App() {
  const { state, update, storageError }=useProgress(bank);
  const [route,setRoute]=useState(location.hash.slice(1)||'/');
  const [now,setNow]=useState(Date.now()), [menu,setMenu]=useState(false), [message,setMessage]=useState('');
  const [pending,setPending]=useState<Session|null>(null), [imported,setImported]=useState<State|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  const go=(path:string)=>{location.hash=path;setMenu(false);};
  useEffect(()=>{const changed=()=>{setRoute(location.hash.slice(1)||'/');window.scrollTo({top:0});};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
  useEffect(()=>{if(!state.active)return;setNow(Date.now());const tick=()=>setNow(Date.now());const id=window.setInterval(tick,1000);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(id);window.removeEventListener('focus',tick);document.removeEventListener('visibilitychange',tick);};},[state.active?.id]);
  useEffect(()=>{const a=state.active;if(a?.deadline && now>=a.deadline){update(s=>s.active?.id===a.id?finishSession(s,bank,now,'timeout'):s);go(`/results/${a.id}`);}},[now,state.active,update]);
  useEffect(()=>{if(!message)return;const id=window.setTimeout(()=>setMessage(''),7000);return()=>clearTimeout(id);},[message]);
  const start=(settings:Settings,mode:Session['mode'])=>{
    try {const session=createSession(eligibleQuestions(bank,settings,state,mode),settings,mode);if(state.active)setPending(session);else{update(s=>({...s,active:session}));go('/session');}}
    catch(e){setMessage((e as Error).message);}
  };
  const finish=()=>{const id=state.active?.id;if(!id)return;update(s=>finishSession(s,bank));go(`/results/${id}`);};
  const importFile=async(file?:File)=>{
    if(!file)return;
    try {if(file.size>5000000)throw new Error('File quá lớn. Hãy chọn bản sao JSON được xuất từ ứng dụng.');setImported(validateState(JSON.parse(await file.text()),bank));}
    catch(e){setMessage(e instanceof SyntaxError?'Không đọc được JSON. Tiến trình hiện tại vẫn được giữ nguyên.':(e as Error).message);}
  };
  const overlays=<>
    <input ref={fileInput} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Chọn file tiến trình" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}}/>
    {message&&<div role="status" className="toast">{message}<button className="icon-button" aria-label="Đóng thông báo" onClick={()=>setMessage('')}><X size={16}/></button></div>}
    {storageError&&<div role="alert" className="storage-error">{storageError}<button onClick={()=>download(state)}>Xuất bản sao</button></div>}
    {pending&&<Dialog title="Bạn có một phiên đang làm" confirmLabel="Lưu bài cũ và bắt đầu" onClose={()=>setPending(null)} onConfirm={()=>{const session={...pending,startedAt:Date.now(),deadline:pending.mode==='exam'?Date.now()+pending.settings.minutes*60000:null};update(s=>({...finishSession(s,bank),active:session}));setPending(null);go('/session');}}><p>Phiên hiện tại sẽ được nộp và lưu vào lịch sử trước khi bắt đầu phiên mới. Câu chưa trả lời sẽ tính là chưa đúng.</p><p>Chọn “Quay lại” để giữ nguyên phiên đang làm.</p></Dialog>}
    {imported&&<Dialog title="Khôi phục tiến trình?" confirmLabel="Khôi phục bản sao" onClose={()=>setImported(null)} onConfirm={()=>{download(state);update(()=>imported);setImported(null);go('/progress');setMessage('Đã khôi phục tiến trình. Bản sao của tiến trình cũ đã được tải xuống.');}}><p>Bản sao có <strong>{imported.history.length} phiên đã hoàn thành</strong> và <strong>{imported.known.length} thẻ đã thuộc</strong>.</p><p>Tiến trình hiện tại sẽ được tải xuống trước khi thay bằng bản sao này. Đồng hồ của bài thi trong bản sao giữ nguyên thời hạn.</p></Dialog>}
  </>;
  if(route==='/session'&&state.active)return <>{overlays}<SessionView key={state.active.id} session={state.active} state={state} bank={bank} now={now} update={update} go={go} finish={finish}/></>;
  const result=route.startsWith('/results/')?state.history.find(s=>s.id===route.slice(9)):null;
  const title=navigation.find(n=>n.path===route)?.label||(result?'Kết quả phiên học':'Phiên học');
  return <div className="app-shell">
    <a href="#main" className="skip-link" onClick={e=>{e.preventDefault();document.getElementById('main')?.focus();}}>Đến nội dung chính</a>
    {menu&&<button className="sidebar-scrim" aria-label="Đóng điều hướng" onClick={()=>setMenu(false)}/>}
    <aside className={`sidebar ${menu?'open':''}`}><a className="brand" href="#/" aria-label="ML Practice — Tổng quan" onClick={()=>setMenu(false)}><span className="brand-symbol">m<span>l</span></span><span>ML Practice<small>YOUR LEARNING SPACE</small></span></a><div className="nav-caption">KHÔNG GIAN CỦA BẠN</div><nav aria-label="Điều hướng chính">{navigation.map(({path,label,icon:Icon},i)=><a href={`#${path}`} onClick={()=>setMenu(false)} className={`nav-link ${route===path?'active':''} ${i===4?'nav-divider':''}`} aria-label={label} title={label} aria-current={route===path?'page':undefined} key={path}><Icon size={19}/><span>{label}</span>{route===path&&<span className="nav-active-dot"/>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="bank-card"><GraduationCap size={22}/><span>BỘ TÀI LIỆU ĐANG HỌC</span><strong>Machine Learning<br/>Specialty</strong><div>332 câu hỏi <span>MLS</span></div></div><p><span className="live-dot"/>Học theo nhịp của bạn</p><span className="sidebar-version">ML Practice · v1.0</span></div></aside>
    <div className="app-main"><header className="topbar"><div><button className="icon-button menu-button" aria-label="Mở điều hướng" onClick={()=>setMenu(true)}><Menu size={21}/></button><span className="breadcrumb">Không gian học tập</span><ChevronRight size={14}/><strong>{title}</strong></div><div><span className={`save-indicator ${storageError?'failed':''}`}><Check size={13}/>{storageError?'Chưa lưu được':'Lưu trên trình duyệt'}</span><span className="profile-icon">ML</span></div></header>
    <main id="main" tabIndex={-1}>
      {route==='/'?<Home state={state} bank={bank} go={go} quick={()=>start({...defaultSettings,count:10},'practice')}/>:
       route==='/flashcards'?<Flashcards bank={bank} state={state} update={update}/>:
       route==='/practice'||route==='/exam'?<Setup key={route} mode={route==='/exam'?'exam':'practice'} bank={bank} state={state} start={start}/>:
       route==='/library'?<LibraryPage bank={bank} state={state} update={update}/>:
       route==='/progress'?<ProgressPage bank={bank} state={state} go={go} exportProgress={()=>download(state)} importProgress={()=>fileInput.current?.click()}/>:
       result?<Results key={result.id} session={result} bank={bank} go={go}/>:
       <div className="page"><Empty title="Chưa có phiên học ở đây">Bắt đầu một phiên mới hoặc xem các phiên đã lưu trong lịch sử.</Empty><button className="button primary" onClick={()=>go('/')}>Về tổng quan <ArrowUpRight size={16}/></button></div>}
    </main><footer className="app-footer"><span>Small steps. Deep learning.</span><div><button onClick={()=>download(state)}><Download size={13}/>Xuất tiến trình</button><button onClick={()=>fileInput.current?.click()}><Upload size={13}/>Nhập bản sao</button></div></footer></div>{overlays}
  </div>;
}

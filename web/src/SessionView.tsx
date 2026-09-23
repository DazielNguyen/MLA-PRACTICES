import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, CircleHelp, EyeOff, Flag, Grid2X2, Send, XCircle, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Question, Session, State } from './domain';
import { formatTime, isCorrect, isQuickSession, revealAnswer, score, selectAnswer, hasQuestionMark, setQuestionMark } from './domain';
import { ChoiceList, Dialog, Explanation, IconToggle, QuestionText, Tag } from './components';
import SessionClock from './SessionClock';

type Props = { session: Session; state: State; bank: Question[]; update: (fn:(s:State)=>State)=>void; go:(path:string)=>void; finish:()=>void; learnerName:string; saveLabel:string };
const TRANSITION_MS = 180;
export default function SessionView({session,state,bank,update,go,finish,learnerName,saveLabel}:Props) {
  const [confirm,setConfirm] = useState(false), [palette,setPalette] = useState(false);
  const [direction,setDirection] = useState('forward');
  const inputLockedUntil = useRef(0);
  const questionHeading = useRef<HTMLSpanElement>(null);
  const q = bank.find(q=>q.id===session.questionIds[session.index])!;
  const answers = session.answers[q.id] || [], revealed = session.revealed.includes(q.id);
  const quick = isQuickSession(session);
  const immediate = session.mode==='practice' && session.settings.feedback==='immediate';
  const answered = Object.values(session.answers).filter(a=>a.length).length;
  const last = session.index===session.questionIds.length-1;
  const correct = isCorrect(q,answers);
  const FeedbackIcon = q.status==='review' ? CircleHelp : correct ? CheckCircle2 : XCircle;
  const locked = () => quick && performance.now()<inputLockedUntil.current;
  const navigateTo = (index:number) => {
    const target=Math.max(0,Math.min(session.questionIds.length-1,index));
    if(locked()||target===session.index)return;
    if(quick){inputLockedUntil.current=performance.now()+TRANSITION_MS;setDirection(target>session.index?'forward':'back');}
    update(s=>s.active?.id===session.id && s.active.questionIds[s.active.index]===q.id ? {...s,active:{...s.active,index:target}} : s);
  };
  const advance = () => {
    if(locked()||quick&&!revealed)return;
    if(last){inputLockedUntil.current=performance.now()+TRANSITION_MS;finish();}
    else navigateTo(session.index+1);
  };
  const choose = (letter:string) => {
    if(locked())return;
    if(quick&&revealed){advance();return;}
    update(s=>s.active?.id===session.id?selectAnswer(s,q,letter):s);
  };
  useEffect(()=>{
    window.scrollTo({top:0,behavior:'instant'});
    if(quick)questionHeading.current?.focus({preventScroll:true});
  },[session.index,quick]);
  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      const target=e.target instanceof Element?e.target:null;
      if(document.querySelector('dialog[open]')||e.altKey||e.ctrlKey||e.metaKey||target?.closest('input,textarea,select,[contenteditable="true"]'))return;
      const letter=/^[1-6]$/.test(e.key)?Object.keys(q.choices)[Number(e.key)-1]:undefined;
      const nextKey=e.key==='Enter'||e.code==='Space';
      if(e.repeat&&(letter||(e.key==='ArrowRight'||e.key==='ArrowLeft')||quick&&nextKey)){e.preventDefault();return;}
      if(letter){e.preventDefault();if(!revealed)choose(letter);return;}
      if(quick&&nextKey){
        if(target?.closest('button,a,summary')&&!target.closest('.choice-button,.quick-next'))return;
        if(revealed){e.preventDefault();advance();}
        return;
      }
      if(e.key==='ArrowRight'){e.preventDefault();if(!quick||revealed)navigateTo(session.index+1);}
      if(e.key==='ArrowLeft'){e.preventDefault();navigateTo(session.index-1);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  return <div className={`session-screen ${quick?'quick-session':''}`}>
    <header className="session-header">
      <button className="session-brand" onClick={()=>go('/')}><span className="brand-symbol small">m<span>l</span></span><span>ML Practice <small>{quick?'QUICK LEARN':session.mode==='exam'?'EXAM SIMULATOR':'PRACTICE SESSION'}</small></span></button>
      <div className="session-header-right"><button className="session-learner" onClick={()=>go('/learner')} aria-label={`Đang học: ${learnerName}`}>{learnerName}<small>{saveLabel}</small></button><SessionClock session={session}/></div>
    </header>
    <div className="session-subbar"><button className="text-button" onClick={()=>go('/')}><ChevronLeft size={16}/> Về tổng quan</button><span>{quick?'Chọn · Hiểu · Tiếp tục':'Machine Learning Engineer · MLA-C01'}</span><span>{answered}/{session.questionIds.length} đã trả lời</span></div>
    {quick&&<div className="quick-progress" role="progressbar" aria-label="Tiến độ học nhanh" aria-valuemin={0} aria-valuemax={session.questionIds.length} aria-valuenow={session.revealed.length}><span style={{width:`${session.revealed.length/session.questionIds.length*100}%`}}/></div>}
    <div className="session-layout">
      <main key={quick?q.id:'question'} className={`panel question-panel ${quick?'quick-question':''}`} data-direction={direction}>
        <div className="question-toolbar"><div><span ref={questionHeading} tabIndex={quick?-1:undefined} className="eyebrow question-heading">CÂU {String(session.index+1).padStart(2,'0')} / {session.questionIds.length}</span><span className="question-id">Ngân hàng #{String(q.id).padStart(3,'0')}</span></div><div className="question-tools"><Tag status={q.status}/><IconToggle active={hasQuestionMark(q,state.bookmarks)} onClick={()=>update(s=>({...s,bookmarks:setQuestionMark(q,s.bookmarks)}))}/><IconToggle kind="flag" active={session.flagged.includes(q.id)} onClick={()=>update(s=>s.active?{...s,active:{...s.active,flagged:s.active.flagged.includes(q.id)?s.active.flagged.filter(id=>id!==q.id):[...s.active.flagged,q.id]}}:s)}/></div></div>
        <div className="selection-rule">{q.required>1?`Chọn ${q.required} đáp án · Đã chọn ${answers.length}/${q.required}`:quick?'Chọn một đáp án · Chấm ngay khi chọn':'Chọn một đáp án chính xác nhất'}{!immediate&&<span><EyeOff size={13}/> Đáp án được ẩn đến khi nộp bài</span>}</div>
        {quick&&<div className="quick-reading-key" aria-label="Chú thích từ khóa"><span className="keyword-constraint">Yêu cầu & phủ định</span><span className="keyword-term">Dịch vụ & khái niệm</span></div>}
        <QuestionText question={q} allowHint={immediate&&!quick} highlight={quick}/>
        {quick&&<div className="quick-keyboard-hint"><kbd>1</kbd>–<kbd>{Object.keys(q.choices).length}</kbd><span>chọn đáp án</span><span className="quick-hint-divider">·</span><kbd>Enter</kbd><span>/</span><kbd>Space</kbd><span>câu tiếp</span></div>}
        <ChoiceList question={q} selected={answers} onSelect={choose} disabled={revealed&&!quick} revealed={revealed} quick={quick}/>
        {immediate&&!quick&&!revealed&&<div className="check-answer-row"><span>Chọn đủ đáp án rồi kiểm tra để xem giải thích.</span><button className="button primary" disabled={answers.length!==q.required} onClick={()=>update(s=>revealAnswer(s,q))}><CheckCircle2 size={17}/> Kiểm tra đáp án</button></div>}
        {revealed&&<div className={quick?'quick-feedback':''}>
          <div role="status" className={`feedback-banner ${q.status==='review'?'neutral':correct?'success':'error'}`}>{quick&&<FeedbackIcon size={18}/>}<strong>{q.status==='review'?'Câu cần xác minh · Không tính điểm':correct?'Chính xác! Thêm một kiến thức đã nắm vững.':'Chưa chính xác. Cùng xem lại cách giải nhé.'}</strong>{quick&&<span>Bấm lại đáp án hoặc Enter / Space để {last?'xem kết quả':'tiếp tục'}.</span>}</div>
          <Explanation question={q} selected={answers} compact={quick}/>
        </div>}
      </main>
      <aside className={`panel question-navigator ${palette?'show-mobile':''}`}>
        {quick&&<div className="quick-mode-label"><Zap size={16}/>HỌC NHANH</div>}
        <div className="section-heading"><h2>Danh sách câu</h2><Grid2X2 size={18}/></div><div className="progress-caption"><span>Tiến độ trả lời</span><strong>{Math.round(answered/session.questionIds.length*100)}%</strong></div><div className="progress-track"><div style={{width:`${answered/session.questionIds.length*100}%`}}/></div>
        <div className="question-grid">{session.questionIds.map((id,i)=><button key={id} onClick={()=>navigateTo(i)} aria-label={`Đến câu ${i+1}${session.flagged.includes(id)?', đã đánh dấu':''}`} aria-current={i===session.index?'step':undefined} className={`${session.answers[id]?.length?'answered':''} ${i===session.index?'current':''} ${session.flagged.includes(id)?'flagged':''}`}>{i+1}{session.flagged.includes(id)&&<Flag size={8} fill="currentColor"/>}</button>)}</div>
        <div className="navigator-legend"><span><i className="answered"/>Đã trả lời</span><span><i/>Chưa trả lời</span><span><Flag size={12}/>Xem lại ({session.flagged.length})</span></div>
        <div className="navigator-tip"><strong>{quick?'Giữ nhịp học của bạn':'Mẹo nhỏ'}</strong><p>{quick?'Chọn để xem kết quả ngay. Đọc ý chính, rồi bấm lại ngay trên đáp án để sang câu tiếp.':'Đánh dấu câu cần suy nghĩ thêm và quay lại trước khi nộp.'}</p><span>{quick?'1–6 Chọn · Enter / Space Tiếp tục':'← → Chuyển câu · 1–6 Chọn đáp án'}</span></div>
      </aside>
    </div>
    <footer className="session-footer">
      <button className="button secondary" onClick={()=>navigateTo(session.index-1)} disabled={session.index===0}><ArrowLeft size={16}/><span>Câu trước</span></button>
      <button className="button secondary mobile-palette" onClick={()=>setPalette(v=>!v)}><Grid2X2 size={16}/>{palette?'Ẩn':'Các câu'}</button>
      <span className="session-footer-label">{quick?(revealed?'Enter / Space để tiếp tục':'Chọn đáp án để xem giải thích'):`Câu ${session.index+1} trên ${session.questionIds.length}`}</span>
      <div>{quick?<><button className="text-button quick-finish" onClick={finish}>Kết thúc</button><button className="button primary quick-next" disabled={!revealed} onClick={advance}>{last?'Xem kết quả':'Câu tiếp'}<ArrowRight size={16}/></button></>:<><button className="button secondary" onClick={()=>setConfirm(true)}><Send size={16}/>Nộp bài</button>{!last&&<button className="button primary" onClick={()=>navigateTo(session.index+1)}>Câu tiếp<ArrowRight size={16}/></button>}</>}</div>
    </footer>
    {confirm&&<Dialog title="Sẵn sàng nộp bài?" confirmLabel="Nộp và xem kết quả" onClose={()=>setConfirm(false)} onConfirm={finish}><p>Bạn đã trả lời <strong>{answered}/{session.questionIds.length}</strong> câu. {session.questionIds.length-answered>0&&`${session.questionIds.length-answered} câu chưa trả lời sẽ được tính là chưa đúng.`}</p>{session.flagged.length>0&&<p>Còn <strong>{session.flagged.length} câu</strong> được đánh dấu xem lại.</p>}<p>Sau khi nộp, bạn có thể xem đáp án và giải thích cho toàn bộ bài.</p></Dialog>}
  </div>;
}

export function Results({session,bank,go}: {session:Session;bank:Question[];go:(path:string)=>void}) {
  const [filter,setFilter]=useState('all');
  const result=score(session,bank), questions=session.questionIds.map(id=>bank.find(q=>q.id===id)!);
  const wrong=questions.filter(q=>q.status!=='review'&&!isCorrect(q,session.answers[q.id])).length;
  const shown=questions.filter(q=>filter==='all'||filter==='wrong'&&q.status!=='review'&&!isCorrect(q,session.answers[q.id])||filter==='flagged'&&session.flagged.includes(q.id));
  return <div className="page results-page"><div className="page-heading"><div className="eyebrow">SESSION COMPLETE</div><h1>Một bước tiến nữa. Làm tốt lắm!</h1><p>{session.finishReason==='timeout'?'Hết thời gian. Bài làm đã được tự động nộp và lưu.':'Bài làm đã được lưu. Dành vài phút xem lại để nhớ lâu hơn.'}</p></div><section className="results-summary panel"><div className="score-ring" style={{background:`conic-gradient(var(--green) ${result.percent}%, #e8efeb 0)`}}><div><strong>{result.total?`${result.percent}%`:'—'}</strong><span>TỶ LỆ ĐÚNG</span></div></div><div className="result-numbers"><div><strong>{result.correct}<small> / {result.total}</small></strong><span>Câu trả lời đúng</span></div><div><strong>{wrong}</strong><span>Sai hoặc bỏ trống</span></div><div><strong>{formatTime(session.finishedAt!-session.startedAt)}</strong><span>Thời gian làm bài</span></div></div><button className="button primary" onClick={()=>go(session.mode==='exam'?'/exam':'/practice')}>Tạo phiên mới<ArrowRight size={17}/></button></section><p className="result-note">Chấm theo khóa đáp án của từng câu; câu “Theo nguồn” chưa được kiểm chứng AWS. Chọn nhiều phải khớp toàn bộ. Đây là tỷ lệ đúng của bài luyện, không quy đổi thành điểm AWS.{result.skipped>0&&` ${result.skipped} câu cần xác minh được loại khỏi mẫu số tính điểm.`}</p><div className="section-heading"><h2>Xem lại bài làm</h2><div className="filter-tabs">{[['all',`Tất cả (${questions.length})`],['wrong',`Cần ôn lại (${wrong})`],['flagged',`Đánh dấu (${session.flagged.length})`]].map(([value,label])=><button className={filter===value?'active':''} key={value} onClick={()=>setFilter(value)}>{label}</button>)}</div></div><div className="review-list">{shown.length?shown.map(q=><details className="panel review-card" key={q.id}><summary><span className={`review-status ${q.status==='review'?'neutral':isCorrect(q,session.answers[q.id])?'success':'error'}`}>{q.status==='review'?'?':isCorrect(q,session.answers[q.id])?'✓':'×'}</span><span><small>Câu {questions.indexOf(q)+1} · Ngân hàng #{q.id}</small><strong>{q.text}</strong></span><ArrowRight size={16}/></summary><div className="review-body"><QuestionText question={q} allowHint={session.mode==='practice' && session.settings.feedback==='immediate'}/><ChoiceList question={q} selected={session.answers[q.id]||[]} disabled revealed/><Explanation question={q} selected={session.answers[q.id]||[]}/></div></details>):<div className="panel empty"><CheckCircle2 size={30}/><h3>Không có câu trong nhóm này</h3><p>Chọn “Tất cả” để xem toàn bộ bài làm.</p></div>}</div></div>;
}

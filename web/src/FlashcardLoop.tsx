import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, RotateCcw, Shuffle, XCircle, Zap } from 'lucide-react';
import type { State } from './domain';
import { hasQuestionMark, matchesOrigin, normalizeFlashDeck, setQuestionMark, shuffle, sourceLabel, studyQuestions } from './domain';
import { advanceFlashLoop, emptyFlashLoop, flashWindow, selectFlashAnswer, retryFlashAnswer } from './flash-loop';
import { ChoiceList, Empty, Explanation, IconToggle, QuestionAnswerStats, QuestionText, Tag } from './components';
import { useAssistantTopic } from './assistant-context';
import type { FlashcardProps } from './Flashcards';

type Deck = NonNullable<State['flash']>;
const TRANSITION_MS=180;
export default function FlashcardLoop({bank,state,update}:FlashcardProps) {
  const [origin,setOrigin]=useState<NonNullable<Deck['origin']>>(state.flash?.origin || 'imported');
  const [filter,setFilter]=useState<NonNullable<Deck['filter']>>(state.flash?.filter || 'new');
  const [includeReview,setIncludeReview]=useState(state.flash?.includeReview ?? true);
  const inputLockedUntil=useRef(0), heading=useRef<HTMLSpanElement>(null), previousQuestion=useRef<number | undefined>(undefined);
  const eligible=(source=origin,group=filter,review=includeReview)=>studyQuestions(bank).filter(q=>matchesOrigin(q,source)&&(review||q.status!=='review')&&(group==='all'||group==='new'&&!hasQuestionMark(q,state.known)||group==='known'&&hasQuestionMark(q,state.known)||group==='bookmarked'&&hasQuestionMark(q,state.bookmarks))).map(q=>q.id);
  const makeDeck=(ids:number[],source=origin,group=filter,review=includeReview):State['flash']=>ids.length?{ids,index:0,origin:source,filter:group,includeReview:review,collection:'mla',mode:'loop',loop:emptyFlashLoop()}:null;
  useEffect(()=>{
    const saved=normalizeFlashDeck(state.flash,bank);
    if (saved?.loop && saved.mode==='loop' && saved===state.flash) return;
    const next=saved?{...saved,mode:'loop' as const,loop:saved.loop || emptyFlashLoop()}:makeDeck(eligible());
    if (next) update(s=>({...s,flash:next}));
  },[state.flash,bank,update,origin,filter,includeReview]);
  const deck=normalizeFlashDeck(state.flash,bank), loop=deck?.loop;
  const q=deck && loop && !loop.done?bank.find(q=>q.id===deck.ids[deck.index]):undefined;
  const windowIds=flashWindow(deck);
  const mastered=deck?.ids.filter(id=>hasQuestionMark(bank.find(q=>q.id===id)!,state.known)).length || 0;
  const completed=deck?(loop?.done?deck.ids.length:deck.index+Number(loop?.result===true)):0;
  useAssistantTopic(q && loop ? {kind:'question',id:q.id,label:`Câu #${q.id} · Flashcard · Vòng 10 câu`,study:{page:'flashcards',selected:loop.selected,revealed:loop.result!==null}}:undefined);
  const rebuild=(source=origin,group=filter,review=includeReview,random=false)=>{
    const ids=eligible(source,group,review);
    update(s=>({...s,flash:makeDeck(random?shuffle(ids):ids,source,group,review)}));
  };
  const locked=()=>performance.now()<inputLockedUntil.current;
  const next=()=>{
    if (!q || loop?.result!==true || locked()) return;
    inputLockedUntil.current=performance.now()+TRANSITION_MS;
    update(s=>advanceFlashLoop(s,q.id));
  };
  const retry=()=>{
    if (!q || locked()) return;
    update(s=>retryFlashAnswer(s,q.id));
    heading.current?.focus({preventScroll:true});
  };
  const choose=(letter:string)=>{
    if (!q || !loop || locked()) return;
    if (loop.result===true) {next();return;}
    update(s=>{
      const result=selectFlashAnswer(s,q,letter);
      if (result!==s && result.flash?.loop?.result!==null) inputLockedUntil.current=performance.now()+TRANSITION_MS;
      return result;
    });
  };
  useEffect(()=>{
    heading.current?.focus({preventScroll:true});
    if(previousQuestion.current!==undefined && q) heading.current?.closest('.flash-loop-question')?.scrollIntoView({block:'start',behavior:'instant'});
    previousQuestion.current=q?.id;
  },[q?.id]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      const target=event.target instanceof Element?event.target:null;
      if (!q || !loop || event.altKey || event.ctrlKey || event.metaKey || event.isComposing || document.querySelector('dialog[open]') || target?.closest('.assistant-dialog,input,textarea,select,[contenteditable="true"]')) return;
      const letter=/^[1-6]$/.test(event.key)?Object.keys(q.choices)[Number(event.key)-1]:undefined;
      const enter=event.key==='Enter'||event.code==='Space';
      if (letter) {event.preventDefault();if(!event.repeat && loop.result!==true)choose(letter);return;}
      if (enter && loop.result!==null) {
        if (target?.closest('button,a,summary') && !target.closest('.choice-button,.flash-loop-action')) return;
        event.preventDefault();if(event.repeat)return;
        if(loop.result)next();else retry();
      }
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  });
  return <div className="page flash-page flash-loop-page">
    <div className="page-heading"><div className="eyebrow">FLASHCARD · VÒNG HỌC 10 CÂU</div><h1>10 câu mỗi vòng. Nhớ đến đâu, tiến đến đó.</h1><p>Chọn sai: thử lại ngay. Chọn đúng: đưa thẻ ra khỏi vòng và thêm câu mới khi tiếp tục.</p></div>
    <div className="flash-controls">
      <label className="origin-filter">Nguồn câu hỏi<select aria-label="Nguồn câu hỏi" value={origin} onChange={e=>{const value=e.target.value as typeof origin;setOrigin(value);rebuild(value);}}><option value="imported">Bộ đề đã nhập · 242 câu</option><option value="original">Tự biên soạn · 352 câu</option><option value="all">Tất cả nguồn</option></select></label>
      <div className="filter-tabs">{([['new','Chưa thuộc'],['all','Tất cả'],['known','Đã thuộc'],['bookmarked','Đã lưu']] as const).map(([value,label])=><button key={value} aria-pressed={filter===value} className={filter===value?'active':''} onClick={()=>{setFilter(value);rebuild(origin,value);}}>{label}</button>)}</div>
      <div>{bank.some(q=>q.status==='review') && <label className="check-label compact"><input type="checkbox" checked={includeReview} onChange={e=>{setIncludeReview(e.target.checked);rebuild(origin,filter,e.target.checked);}}/>Câu cần xác minh</label>}<button className="button secondary small" onClick={()=>rebuild(origin,filter,includeReview,true)}><Shuffle size={15}/>Trộn thẻ</button></div>
    </div>
    {!deck?<Empty title="Không còn thẻ trong nhóm này">Chọn “Tất cả” để ôn lại, hoặc đổi nguồn câu hỏi.</Empty>:loop?.done?<div className="panel deck-complete"><span className="mode-icon green"><Check size={30}/></span><h2>Đã hoàn thành bộ thẻ!</h2><p>Bạn đã hoàn thành phần còn lại của bộ {deck.ids.length} câu. Các thẻ đã thuộc và lượt trả lời đều được lưu.</p><button className="button primary" onClick={()=>rebuild()}>Học một vòng mới<RotateCcw size={16}/></button></div>:q&&loop&&<>
      <section className="panel flash-loop-window" aria-label="Vòng học hiện tại">
        <div><strong><Zap size={16}/>{windowIds.length} câu trong vòng</strong><span>Tiến độ {completed} / {deck.ids.length} câu</span></div>
        <ol>{windowIds.map((id,i)=><li key={id} aria-current={i===0?'step':undefined} className={i===0?(loop.result===false?'incorrect':loop.result===true?'correct':'current'):''}><span>{i===0?'Đang học':`Tiếp ${i}`}</span><strong>#{id}</strong></li>)}</ol>
        <p>{deck.index+windowIds.length<deck.ids.length?'Mỗi câu đúng nhường chỗ cho một câu mới. Câu sai ở lại để bạn thử lại.':'Đang ôn những câu cuối của bộ này. Câu sai vẫn ở lại đến khi trả lời đúng.'}</p>
      </section>
      <div className="flash-meta"><span>{sourceLabel(q)}</span><strong>{deck.index+1}<span> / {deck.ids.length}</span></strong></div>
      <div className="flashcard panel quick-question flash-loop-question" key={q.id}>
        <div className="flashcard-top"><span ref={heading} tabIndex={-1} className="eyebrow">CÂU #{q.id} · {loop.result===true?'ĐÃ THUỘC':loop.result===false?'THỬ LẠI':'CHỌN ĐÁP ÁN'}</span><div><Tag status={q.status}/><IconToggle active={hasQuestionMark(q,state.bookmarks)} onClick={()=>update(s=>({...s,bookmarks:setQuestionMark(q,s.bookmarks)}))}/></div></div>
        <QuestionAnswerStats question={q} state={state} live/>
        <QuestionText question={q} highlight/>
        <div className="selection-rule">Chọn {q.required} đáp án{q.required>1&&` · Đã chọn ${loop.selected.length}/${q.required}`}</div>
        <div className="quick-keyboard-hint"><kbd>1</kbd>–<kbd>{Object.keys(q.choices).length}</kbd> chọn đáp án <span>·</span><kbd>Enter</kbd>/<kbd>Space</kbd> {loop.result===false?'thử lại':'tiếp tục'}</div>
        <ChoiceList question={q} selected={loop.selected} onSelect={choose} revealed={loop.result!==null} quick revealedAction={loop.result===false?'Chọn đáp án để thử lại':'Bấm lại để qua câu tiếp'}/>
        {loop.result!==null&&<div className="quick-feedback" key={loop.lastAttempt?.id}>
          <div className={`feedback-banner ${loop.result?'success':'error'}`} role="status">{loop.result?<CheckCircle2 size={18}/>:<XCircle size={18}/>}<strong>{loop.result?'Đúng rồi! Thẻ này đã được đánh dấu đã thuộc.':'Chưa đúng. Thẻ này ở lại trong vòng — hãy chọn lại.'}</strong></div>
          <button className="button primary flash-loop-action" onClick={loop.result?next:retry}>{loop.result?(deck.index===deck.ids.length-1?'Hoàn thành bộ thẻ':'Câu tiếp · Thêm thẻ mới'):'Thử lại câu này'}{loop.result?<ArrowRight size={17}/>:<RotateCcw size={17}/>}</button>
          <Explanation question={q} selected={loop.selected} compact/>
        </div>}
      </div>
      <div className="flash-progress"><div className="progress-track"><div style={{width:`${completed/deck.ids.length*100}%`}}/></div><span>{mastered} / {deck.ids.length} thẻ đã thuộc · Tiến trình tự động lưu</span></div>
    </>}
  </div>;
}

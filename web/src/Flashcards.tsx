import { useState } from 'react';
import { Layers3, Zap } from 'lucide-react';
import type { Question, State } from './domain';
import ClassicFlashcards from './ClassicFlashcards';
import FlashcardLoop from './FlashcardLoop';
import './flash-loop.css';

export type FlashcardProps = {bank:Question[];state:State;update:(fn:(s:State)=>State)=>void};
export default function Flashcards(props:FlashcardProps) {
  const [mode,setMode]=useState(props.state.flash?.mode || 'loop');
  const change=(next:'loop'|'classic')=>{
    if (next===mode) return;
    setMode(next);
    props.update(s=>s.flash?{...s,flash:{...s.flash,mode:next,loop:undefined}}:s);
  };
  return <>
    <div className="page flash-mode-switch"><div className="segmented" aria-label="Cách học flashcard">
      <button aria-pressed={mode==='loop'} className={mode==='loop'?'active':''} onClick={()=>change('loop')}><Zap size={16}/>Vòng học 10 câu</button>
      <button aria-pressed={mode==='classic'} className={mode==='classic'?'active':''} onClick={()=>change('classic')}><Layers3 size={16}/>Lật thẻ tự đánh giá</button>
    </div></div>
    {mode==='loop'?<FlashcardLoop {...props}/>:<ClassicFlashcards {...props}/>}
  </>;
}

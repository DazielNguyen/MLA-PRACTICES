import { isCorrect, setQuestionMark, toggleChoice } from './domain.ts';
import type { FlashLoop, Question, State } from './domain.ts';

export const FLASH_WINDOW_SIZE = 10;
export const emptyFlashLoop = (): FlashLoop => ({selected:[],result:null,done:false,lastAttempt:null});
export const flashWindow = (flash: State['flash']) => flash && !flash.loop?.done ? flash.ids.slice(flash.index,flash.index+FLASH_WINDOW_SIZE) : [];

export function selectFlashAnswer(state: State, question: Question, letter: string, now=Date.now()): State {
  const flash=state.flash, loop=flash?.loop;
  if (!flash || flash.mode!=='loop' || !loop || loop.done || loop.result===true || flash.ids[flash.index]!==question.id || !Object.hasOwn(question.choices,letter)) return state;
  const selected=toggleChoice(loop.result===false?[]:loop.selected,letter,question.required);
  if (selected===loop.selected) return state;
  const complete=selected.length===question.required;
  const result=complete?isCorrect(question,selected):null;
  return {...state,
    known:complete?setQuestionMark(question,state.known,result===true):state.known,
    flash:{...flash,loop:{...loop,selected,result,lastAttempt:complete?{id:crypto.randomUUID(),questionId:question.id,correct:result!,lastSeen:now}:loop.lastAttempt}},
  };
}

export function retryFlashAnswer(state: State, questionId: number): State {
  const flash=state.flash, loop=flash?.loop;
  if (!flash || flash.mode!=='loop' || !loop || loop.result!==false || flash.ids[flash.index]!==questionId) return state;
  return {...state,flash:{...flash,loop:{...loop,selected:[],result:null}}};
}

export function advanceFlashLoop(state: State, questionId: number): State {
  const flash=state.flash, loop=flash?.loop;
  if (!flash || flash.mode!=='loop' || !loop || loop.done || loop.result!==true || flash.ids[flash.index]!==questionId) return state;
  const done=flash.index===flash.ids.length-1;
  return {...state,flash:{...flash,index:done?flash.index:flash.index+1,loop:{...loop,selected:[],result:null,done}}};
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyState, validateState } from './domain.ts';
import type { Question, State } from './domain.ts';
import { advanceFlashLoop, emptyFlashLoop, flashWindow, retryFlashAnswer, selectFlashAnswer } from './flash-loop.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const get=(id:number)=>bank.find(q=>q.id===id)!;
const make=(ids=bank.slice(0,12).map(q=>q.id)):State=>({...emptyState(),flash:{ids,index:0,collection:'mla',mode:'loop',loop:emptyFlashLoop()}});
test('a rolling window retains wrong cards and replaces correct cards without growing past ten',()=>{
  let state=make();const ids=state.flash!.ids, q=get(ids[0]);
  assert.deepEqual(flashWindow(state.flash),ids.slice(0,10));
  state=selectFlashAnswer(state,q,'A',1000);
  assert.equal(state.flash!.loop!.result,false);assert.equal(advanceFlashLoop(state,q.id),state);
  const wrongAttempt=state.flash!.loop!.lastAttempt!.id;
  state=selectFlashAnswer(state,q,'C',2000);
  assert.equal(state.flash!.loop!.result,true);assert.notEqual(state.flash!.loop!.lastAttempt!.id,wrongAttempt);
  assert.deepEqual(state.known,[333]);
  assert.equal(selectFlashAnswer(state,q,'A'),state);
  state=advanceFlashLoop(state,q.id);
  assert.deepEqual(flashWindow(state.flash),ids.slice(1,11));assert.equal(state.flash!.loop!.result,null);
  assert.equal(advanceFlashLoop(state,q.id),state);
});
test('multi-select grades only complete answers and a retry starts a fresh selection',()=>{
  const q=get(350);let state=make([350]);
  state=selectFlashAnswer(state,q,'C',1000);assert.equal(state.flash!.loop!.lastAttempt,null);
  state=selectFlashAnswer(state,q,'D',2000);assert.equal(state.flash!.loop!.result,false);
  const previous=state.flash!.loop!.lastAttempt;
  state=retryFlashAnswer(state,q.id);assert.deepEqual(state.flash!.loop!.selected,[]);assert.equal(state.flash!.loop!.lastAttempt,previous);
  state=selectFlashAnswer(state,q,'A',3000);state=selectFlashAnswer(state,q,'A',3100);assert.deepEqual(state.flash!.loop!.selected,[]);
  state=selectFlashAnswer(state,q,'B',3200);state=selectFlashAnswer(state,q,'A',3300);
  assert.equal(state.flash!.loop!.result,true);assert.deepEqual(state.known,[350]);
  state=advanceFlashLoop(state,q.id);assert.equal(state.flash!.loop!.done,true);assert.deepEqual(flashWindow(state.flash),[]);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
});
test('short decks drain completely and completed cards are never inserted again',()=>{
  let state=make([333,334,337]);
  for(const id of [333,334,337]){
    const q=get(id);
    for(const answer of q.answer)state=selectFlashAnswer(state,q,answer);
    assert.equal(state.flash!.loop!.result,true);
    state=advanceFlashLoop(state,id);
    assert.ok(!flashWindow(state.flash).includes(id));
  }
  assert.equal(state.flash!.index,2);assert.equal(state.flash!.loop!.done,true);assert.deepEqual(state.known,[333,334,337]);
});
test('loop backups preserve feedback and reject malformed attempts, selections and completion',()=>{
  const state=selectFlashAnswer(make(),get(333),'A',1000);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
  for(const change of [{selected:['Z']},{selected:['A','A']},{done:true},{lastAttempt:null},{lastAttempt:{id:'bad:',questionId:333,correct:false,lastSeen:1000}},{lastAttempt:{id:'test',questionId:334,correct:false,lastSeen:1000}}]){
    const invalid=structuredClone(state);Object.assign(invalid.flash!.loop!,change);
    assert.throws(()=>validateState(invalid,bank));
  }
  assert.equal(selectFlashAnswer(state,get(334),'A'),state);
  assert.equal(selectFlashAnswer(state,get(333),'Z'),state);
});

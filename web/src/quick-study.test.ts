import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question, Session } from './domain.ts';
import { createSession, defaultSettings, emptyState, finishSession, isQuickSession, selectAnswer, validateState } from './domain.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const get=(id:number)=>bank.find(q=>q.id===id)!;
const make=(id=2,mode:Session['mode']='practice')=>({...emptyState(),active:createSession([get(id)],{...defaultSettings,count:1,quick:true},mode,1000)});

test('quick study grades correct and wrong choices immediately, only once',()=>{
  for(const answer of ['A','B']){
    const state=selectAnswer(make(),get(2),answer,2000);
    assert.deepEqual(state.active!.revealed,[2]);
    assert.equal(state.progress[2].correct,answer==='B'?1:0);
    assert.equal(selectAnswer(state,get(2),'C',2100),state);
    assert.equal(finishSession(state,bank,3000).progress[2].attempts,1);
  }
});
test('quick multi-select allows partial edits and grades only the complete selection',()=>{
  let state=selectAnswer(make(21),get(21),'A',2000);
  assert.deepEqual(state.active!.revealed,[]);assert.equal(state.progress[21],undefined);
  state=selectAnswer(state,get(21),'A',2100);assert.deepEqual(state.active!.answers[21],[]);
  state=selectAnswer(state,get(21),'D',2200);state=selectAnswer(state,get(21),'A',2300);
  assert.equal(state.progress[21].correct,1);assert.equal(state.progress[21].attempts,1);
  assert.deepEqual(state.active!.revealed,[21]);
});
test('quick flag never reveals an exam or hidden practice answer',()=>{
  for(const mode of ['exam','practice'] as const){
    const state=make(2,mode);state.active.settings.feedback='end';
    assert.equal(isQuickSession(state.active),false);
    const next=selectAnswer(state,get(2),'B',2000);
    assert.deepEqual(next.active!.revealed,[]);assert.equal(next.progress[2],undefined);
  }
  const manual=make();delete manual.active.settings.quick;
  assert.deepEqual(selectAnswer(manual,get(2),'B',2000).active!.revealed,[]);
});
test('stale, invalid and expired input cannot alter the current question',()=>{
  const state=make();
  assert.equal(selectAnswer(state,get(3),'A',2000),state);
  assert.equal(selectAnswer(state,get(2),'Z',2000),state);
  const exam=make(2,'exam');
  assert.equal(selectAnswer(exam,get(2),'B',exam.active.deadline!),exam);
});
test('unresolved quick questions reveal their analysis without grading',()=>{
  const state=selectAnswer(make(1),get(1),'C',2000);
  assert.deepEqual(state.active!.revealed,[1]);assert.equal(state.progress[1],undefined);
});
test('quick mode survives backups while older sessions remain manual',()=>{
  const state=selectAnswer(make(),get(2),'B',2000);
  assert.equal(isQuickSession(validateState(state,bank).active!),true);
  const legacy=make();delete legacy.active.settings.quick;
  assert.equal(isQuickSession(validateState(legacy,bank).active!),false);
  const invalid=structuredClone(state) as any;invalid.active.settings.quick='true';
  assert.throws(()=>validateState(invalid,bank));
});

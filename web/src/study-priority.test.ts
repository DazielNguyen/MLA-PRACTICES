import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question, Settings } from './domain.ts';
import { createSession, defaultSettings, eligibleQuestions, emptyState, prioritizeQuestions, validateState } from './domain.ts';
import { validateRow } from './sync/records.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const qs=bank.slice(0,7);
const fixture=()=>{
  const state=emptyState();
  [[10,1],[5,4],[2,1],[7,0],[9,9],[4,2]].forEach(([attempts,correct],i)=>state.progress[qs[i].id]={attempts,correct,latest:true,lastSeen:1000});
  state.known=[qs[6].id];return state;
};
const settings=(patch:Partial<Settings>={}):Settings=>({...defaultSettings,count:2,scope:'low-accuracy',order:'priority',...patch});
const ids=(patch:Partial<Settings>={})=>eligibleQuestions(qs,settings(patch),fixture()).map(q=>q.id);

test('priority filters use lifetime ratios and exact inclusive percentage boundaries',()=>{
  assert.deepEqual(ids(),[qs[3],qs[0],qs[5],qs[2],qs[1]].map(q=>q.id));
  assert.deepEqual(ids({accuracyMax:50}),[qs[3],qs[0],qs[5],qs[2]].map(q=>q.id));
  assert.deepEqual(ids({accuracyMax:0}),[qs[3].id]);
  assert.deepEqual(ids({scope:'high-error',errorMin:20}),ids());
  assert.deepEqual(ids({scope:'high-error',errorMin:0}),ids());
  assert.deepEqual(ids({scope:'high-error',errorMin:100}),[qs[3].id]);
  assert.ok(!ids({accuracyMax:100}).includes(qs[6].id));
  assert.deepEqual(ids({scope:'never-correct'}),[qs[3].id]);
  assert.deepEqual(ids({scope:'most-wrong'}),[qs[0],qs[3],qs[5],qs[2],qs[1]].map(q=>q.id));
  assert.deepEqual(ids({minAttempts:5}),[qs[3],qs[0],qs[1]].map(q=>q.id));
});
test('ranking is stable, preserves source data and respects random/sequential modes and exam pools',()=>{
  const state=fixture(),before=structuredClone(state),poolBefore=structuredClone(qs);
  const pool=eligibleQuestions(qs,settings(),state);
  const session=createSession(pool,settings(),'practice',2000);
  assert.deepEqual(session.questionIds,[qs[3].id,qs[0].id]);
  assert.equal(eligibleQuestions(qs,settings({accuracyMax:0}),state,'exam').length,qs.length);
  assert.equal(createSession(qs,settings(),'exam',2000).settings.order,'random');
  assert.deepEqual(ids({order:'sequential'}),qs.slice(0,6).filter((_,i)=>i!==4).map(q=>q.id));
  assert.equal(prioritizeQuestions(qs,settings(),state).at(-1)!.id,qs[6].id);
  assert.deepEqual(state,before);assert.deepEqual(qs,poolBefore);
});
test('new filters persist in backups and synced session rows while invalid thresholds are rejected',()=>{
  const state=fixture();state.active=createSession(eligibleQuestions(qs,settings(),state),settings({accuracyMax:80,errorMin:50,minAttempts:2}),'practice',2000);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
  const row={kind:'session',key:`session:${state.active.id}`,value:state.active,stamp:2000,writer:'test'};
  assert.deepEqual(validateRow(row,bank),row);
  for(const patch of [{accuracyMax:101},{accuracyMax:-1},{errorMin:50.5},{errorMin:'50'},{minAttempts:0},{minAttempts:10001},{minAttempts:null}]) {
    const bad=structuredClone(state);Object.assign(bad.active!.settings,patch);assert.throws(()=>validateState(bad,bank));
  }
  assert.equal(eligibleQuestions(qs,settings({minAttempts:0}),state).length,0);
  const legacy=emptyState();legacy.active=createSession(qs,{...defaultSettings,count:1},'practice',1000);
  assert.deepEqual(validateState(legacy,bank),legacy);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createSession, defaultSettings, eligibleQuestions, emptyState, finishSession, formatTime, isCorrect, remainingMs, revealAnswer, score, shuffle, toggleChoice, validateState } from './domain.ts';
import type { Question, State } from './domain.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const single=bank.find(q=>q.status==='checked'&&q.required===1)!;
const multi=bank.find(q=>q.status==='checked'&&q.required>1)!;
const review=bank.find(q=>q.status==='review')!;
const settings={...defaultSettings,count:2,order:'sequential' as const};
const make=():State=>({...emptyState(),active:createSession([single,multi],settings,'practice',1000)});
test('332 unique questions retain complete choices, source URLs and images',()=>{
  assert.equal(bank.length,332);assert.equal(new Set(bank.map(q=>q.id)).size,332);
  assert.equal(bank.filter(q=>q.status==='review').length,28);
  for(const q of bank){assert.ok(q.text.length>30);assert.ok(Object.keys(q.choices).length>=4);assert.ok(q.sources.length);for(const source of q.sources)assert.match(source.url,/^https:\/\//);if(q.status!=='review'){assert.equal(q.required,q.answer.length);assert.ok(q.answer.every(a=>Object.hasOwn(q.choices,a)));}for(const im of q.images){assert.ok(existsSync(new URL(`../public${im.url}`,import.meta.url)));assert.ok(im.slot==='question'||Object.hasOwn(q.choices,im.slot));}}
});
test('multiple answers require the exact set, independent of order',()=>{
  assert.equal(isCorrect(multi,[...multi.answer].reverse()),true);
  assert.equal(isCorrect(multi,multi.answer.slice(1)),false);
  assert.equal(isCorrect(multi,[...multi.answer,'Z']),false);
  assert.equal(isCorrect(review,review.answer),false);
});
test('single choice replaces; multi choice caps and can be deselected',()=>{
  assert.deepEqual(toggleChoice(['A'],'B',1),['B']);assert.deepEqual(toggleChoice(['A','B'],'C',2),['A','B']);
  assert.deepEqual(toggleChoice(['A','B'],'A',2),['B']);assert.deepEqual(toggleChoice(['B'],'A',2),['A','B']);
});
test('exam never contains unresolved answers, even with includeReview enabled',()=>{
  const pool=eligibleQuestions(bank,{...defaultSettings,includeReview:true},emptyState(),'exam');
  assert.equal(pool.length,304);assert.ok(pool.every(q=>q.status!=='review'));
  assert.equal(eligibleQuestions(bank,{...defaultSettings,includeHistorical:false},emptyState(),'exam').length,278);
});
test('question filters combine scope, range and status',()=>{
  const state=emptyState();state.bookmarks=[2,70];
  assert.deepEqual(eligibleQuestions(bank,{...defaultSettings,scope:'bookmarked',range:'1-66'},state).map(q=>q.id),[2]);
  assert.equal(eligibleQuestions(bank,{...defaultSettings,scope:'wrong'},state).length,0);
});
test('sampling keeps the source and has no duplicates',()=>{
  const original=[1,2,3,4];const sample=shuffle(original,()=>.5);assert.deepEqual(original,[1,2,3,4]);assert.equal(new Set(sample).size,4);
  const session=createSession(bank, {...settings,count:65,order:'random'},'practice');assert.equal(session.questionIds.length,65);assert.equal(new Set(session.questionIds).size,65);
  assert.throws(()=>createSession(bank,{...settings,count:333},'exam'));assert.throws(()=>createSession(bank,{...settings,minutes:0},'exam'));
});
test('timer uses an absolute deadline, including after serialization',()=>{
  const session=createSession([single,multi],{...settings,minutes:1},'exam',1000);
  assert.equal(remainingMs(session,31000),30000);assert.equal(remainingMs(JSON.parse(JSON.stringify(session)),61000),0);
  assert.equal(remainingMs(session,99999),0);assert.equal(formatTime(3661000),'1:01:01');assert.equal(formatTime(-1),'00:00');
});
test('immediate checking locks and records each answer once',()=>{
  let state=make();state.active!.answers[single.id]=single.answer;
  state=revealAnswer(state,single,2000);state=revealAnswer(state,single,3000);
  assert.equal(state.progress[single.id].attempts,1);assert.deepEqual(state.active!.revealed,[single.id]);
  state=finishSession(state,bank,4000);assert.equal(state.progress[single.id].attempts,1);assert.equal(state.history.length,1);
});
test('partial multi answers cannot reveal and count as wrong when submitted',()=>{
  let state=make();state.active!.answers[multi.id]=multi.answer.slice(1);
  state=revealAnswer(state,multi);assert.deepEqual(state.active!.revealed,[]);
  state=finishSession(state,bank,4000);assert.equal(state.progress[multi.id].latest,false);assert.equal(score(state.history[0],bank).correct,0);
});
test('exam and hidden practice cannot reveal answers early',()=>{
  const state=make();state.active!.answers[single.id]=single.answer;state.active!.settings.feedback='end';assert.deepEqual(revealAnswer(state,single),state);
  state.active!.mode='exam';state.active!.settings.feedback='immediate';assert.deepEqual(revealAnswer(state,single),state);
});
test('timeout grades once and preserves flags and deadline',()=>{
  let state=emptyState();state.active=createSession([single,multi],{...settings,minutes:1},'exam',1000);state.active.answers[single.id]=single.answer;state.active.flagged=[multi.id];
  state=finishSession(state,bank,90000,'timeout');state=finishSession(state,bank,100000,'timeout');
  assert.equal(state.active,null);assert.equal(state.history.length,1);assert.equal(state.history[0].finishedAt,61000);assert.equal(state.history[0].finishReason,'timeout');assert.deepEqual(state.history[0].flagged,[multi.id]);assert.equal(state.progress[single.id].attempts,1);assert.deepEqual(score(state.history[0],bank),{correct:1,total:2,answered:1,skipped:0,percent:50});
});
test('review questions neither alter score denominator nor progress',()=>{
  let state=emptyState();state.active=createSession([single,review],settings,'practice',1000);state.active.answers[single.id]=single.answer;state.active.answers[review.id]=review.answer;
  state=finishSession(state,bank,3000);assert.equal(state.progress[review.id],undefined);assert.equal(score(state.history[0],bank).total,1);assert.equal(score(state.history[0],bank).percent,100);assert.equal(score(state.history[0],bank).skipped,1);
});
test('backup restores selections, flags, card position and results',()=>{
  const state=make();state.active!.answers[multi.id]=multi.answer;state.active!.flagged=[single.id];state.flash={ids:[single.id,multi.id],index:1};state.bookmarks=[multi.id];state.known=[single.id];
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
  assert.deepEqual(validateState(finishSession(state,bank,5000),bank).history[0].answers[multi.id],multi.answer);
});
test('invalid backups are rejected before replacing progress',()=>{
  const invalid=[{version:2}, {...emptyState(),bookmarks:[999]}, {...emptyState(),known:[2,2]}, {...emptyState(),flash:{ids:[],index:0}}, {...emptyState(),progress:{2:{attempts:1,correct:2,latest:true,lastSeen:1000}}}];
  for(const value of invalid)assert.throws(()=>validateState(value,bank));
  const state=make();state.active!.answers[single.id]=['Z'];assert.throws(()=>validateState(state,bank));
});

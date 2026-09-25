import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { focusedQuestions, questionFormats } from './question-formats.ts';
import { createSession, defaultSettings, emptyState, revealAnswer, validateState } from './domain.ts';
import type { Question } from './domain.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const sample=(text:string,choices={A:'Option A',B:'Option B'}):Question=>({...bank[0],text,choices,images:[]});

test('format detection follows task instructions, including text-only matches and sequences',()=>{
  assert.deepEqual(questionFormats(sample('Can you match the term to its correct description?')),['matching']);
  assert.deepEqual(questionFormats(sample('Select the correct tool from the list to handle each task.')),['matching']);
  assert.deepEqual(questionFormats(sample('Which steps should be selected and ordered correctly?')),['ordering']);
  assert.deepEqual(questionFormats(sample('Choose a sequence.',{A:'1,2,3',B:'3,1,2'})),['ordering']);
  assert.deepEqual(questionFormats(sample('Choose a mapping.',{A:'1-A, 2-B',B:'1-B, 2-A'})),['matching']);
  for(const text of ['Drop columns from a file.','Scale to match demand.','Rank customers in order of value.','Use Sequence-to-Sequence for text.']) assert.deepEqual(questionFormats(sample(text)),[]);
});
test('every published image and converted matching/ordering item is in the focused bank once',()=>{
  const focused=focusedQuestions(bank);
  assert.equal(focused.length,21);assert.equal(new Set(focused.map(q=>q.id)).size,21);
  assert.equal(focusedQuestions(bank,'image').length,16);
  assert.equal(focusedQuestions(bank,'matching').length,11);
  assert.equal(focusedQuestions(bank,'ordering').length,10);
  assert.equal(focused.filter(q=>q.origin==='udemy').length,5);
  assert.ok(bank.filter(q=>q.images.length).every(q=>focused.includes(q)));
  assert.ok(bank.filter(q=>q.notes.some(n=>n.includes('Câu gốc dạng ghép hoặc sắp xếp'))).every(q=>focused.includes(q)));
  for(const q of focused) for(const image of q.images) assert.ok(existsSync(new URL('../public'+image.url,import.meta.url)));
  assert.equal(focusedQuestions(focused.map(q=>({...q,origin:'original'}))).length,0);
});
test('focused sessions score against the same question identity and restore normally',()=>{
  const pool=focusedQuestions(bank);
  const before=structuredClone(pool);
  let state=emptyState();state.active=createSession(pool,{...defaultSettings,count:10,quick:true},'practice',1000);
  const q=pool.find(q=>q.id===state.active!.questionIds[0])!;
  state.active.answers[q.id]=q.answer;
  state=revealAnswer(state,q,2000);
  assert.equal(state.progress[q.id].correct,1);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
  assert.ok(state.active!.questionIds.every(id=>pool.some(q=>q.id===id)));
  assert.deepEqual(pool,before);
});

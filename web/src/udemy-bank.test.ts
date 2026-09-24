import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question } from './domain.ts';
import { createSession, defaultSettings, eligibleQuestions, emptyState, finishSession, matchesOrigin, questionProgress, relatedQuestionIds, revealAnswer, sourceLabel, validateState } from './domain.ts';
import { validateBackup } from './sync/records.ts';
import { prepareChat } from '../server/chat.ts';
const read=(path:string)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const bank:Question[]=read('./data/questions.json');
const added=bank.filter(q=>q.origin==='udemy');
const source=read('../../MLA-C01-195-cau-hoi.json').questions;
const corrections=read('../scripts/udemy/corrections.json');

test('Udemy keeps every source record, key and stable ID alongside both existing packs',()=>{
  assert.equal(added.length,195);
  assert.equal(bank.filter(q=>!q.origin).length,242);
  assert.equal(bank.filter(q=>q.origin==='original').length,352);
  assert.equal(eligibleQuestions(bank,{...defaultSettings,range:'701-895'},emptyState(),'exam').length,195);
  assert.equal(bank.filter(q=>matchesOrigin(q,'imported')).length,242);
  assert.equal(bank.filter(q=>matchesOrigin(q,'udemy')).length,195);
  for(const q of added){
    const raw=source.find((s:any)=>s.number===q.sourceIds[0]);
    assert.equal(q.id,700+raw.number);
    assert.equal(q.text,corrections[raw.number]?.text??raw.question);
    assert.deepEqual(q.choices,Object.fromEntries(raw.choices.map((c:any)=>[c.label,c.text])));
    assert.deepEqual(q.answer,raw.correct_answers.map((c:any)=>c.label));
    assert.equal(q.required,q.answer.length);assert.equal(q.status,'source');
    assert.match(sourceLabel(q),/^Udemy/);assert.equal(q.explanationLanguage,'vi');
  }
});
test('duplicate labels link both records without merging identities, marks or attempts',()=>{
  const duplicates=added.filter(q=>q.duplicateMatches?.length);
  assert.equal(duplicates.length,46);
  assert.equal(duplicates.filter(q=>q.duplicateMatches![0].kind==='exact').length,6);
  for(const q of duplicates){
    assert.equal(q.duplicateOf,undefined);assert.equal(q.relatedIds,undefined);
    assert.deepEqual(relatedQuestionIds(q),[q.id]);
    for(const link of q.duplicateMatches!){
      const old=bank.find(b=>b.id===link.questionId)!;
      assert.ok(!old.origin);assert.ok(old.duplicateMatches!.some(m=>m.questionId===q.id));
      const state=emptyState();state.progress[q.id]={attempts:2,correct:1,latest:true,lastSeen:1000};
      assert.equal(questionProgress(old,state),undefined);
    }
  }
});
test('repaired numbered items retain all words and show explicit sequence numbers',()=>{
  const repaired=added.filter(q=>corrections[q.sourceIds[0]]?.text);
  assert.equal(repaired.length,4);
  for(const q of repaired){
    const raw=source.find((s:any)=>s.number===q.sourceIds[0]);
    assert.match(q.text,/\n1\. /);assert.match(q.text,/\n2\. /);assert.match(q.text,/\n3\. /);
    const words=(s:string)=>s.replace(/\b\d+\. /g,'').replace(/\s/g,'');
    assert.equal(words(q.text),words(raw.question));
  }
});
test('Udemy scoring, flash origin, backup and assistant canonical context survive serialization',()=>{
  const q=added.find(q=>q.duplicateMatches)!;
  let state=emptyState();
  state.active=createSession([q],{...defaultSettings,count:1,range:'701-895'},'practice',1000);
  state.active.answers[q.id]=q.answer;state=revealAnswer(state,q,2000);state=finishSession(state,bank,3000);
  state.flash={ids:added.map(q=>q.id),index:3,origin:'udemy'};
  assert.equal(state.progress[q.id].correct,1);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),bank),state);
  const session=state.history[0];
  const backup={version:2,name:'Udemy learner',exportedAt:3000,rows:[{kind:'session',key:`session:${session.id}`,value:session,stamp:3000,writer:'test'}]};
  assert.deepEqual(validateBackup(backup,bank),backup);
  const ref=JSON.parse(prepareChat({messages:[{role:'user',content:'Giải thích câu đang mở'}],context:{kind:'question',id:q.id},webSearch:false}).reference);
  assert.equal(ref.origin,'udemy');assert.equal(ref.sourceName,q.sourceName);
  assert.deepEqual(ref.duplicateMatches,q.duplicateMatches);assert.deepEqual(ref.answerFromBank,q.answer);
});

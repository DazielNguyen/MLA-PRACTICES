import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question } from './domain.ts';
import { createSession, defaultSettings, emptyState } from './domain.ts';
import { questionStatistics, rankMistakes } from './question-statistics.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
test('colors use all attempts, strict over-80 threshold, and never infer correctness from known marks',()=>{
  const questions=bank.slice(0,6), state=emptyState();
  const counts=[[10,9],[5,4],[2,1],[5,1],[3,0]];
  counts.forEach(([attempts,correct],i)=>state.progress[questions[i].id]={attempts,correct,latest:true,lastSeen:1000});
  state.known=questions.map(q=>q.id);
  const stats=questionStatistics(questions,state);
  assert.deepEqual(stats.map(s=>s.mastery),['strong','building','building','low','never-correct','known-only']);
  assert.deepEqual(stats.map(s=>s.wrong),[1,1,1,4,3,0]);
  assert.equal(stats[5].rate,null);
  assert.equal(rankMistakes(stats)[0].question.id,questions[3].id);
  assert.deepEqual(rankMistakes(stats,true).map(s=>s.question.id),[questions[4].id]);
});
test('rankings aggregate existing aliases, preserve duplicate source independence and ignore retired data',()=>{
  const alias=bank.find(q=>q.relatedIds&&q.relatedIds.length>1);
  const duplicate=bank.find(q=>q.origin==='udemy'&&q.duplicateMatches)!;
  const state=emptyState();state.progress[1001]={attempts:100,correct:0,latest:false,lastSeen:1000};
  state.progress[duplicate.id]={attempts:7,correct:1,latest:true,lastSeen:1000};
  if(alias)for(const id of alias.relatedIds!)state.progress[id]={attempts:2,correct:1,latest:true,lastSeen:1000};
  const stats=questionStatistics(bank,state);
  assert.ok(stats.every(s=>s.question.id!==1001));
  assert.equal(stats.find(s=>s.question.id===duplicate.id)!.wrong,6);
  assert.equal(stats.find(s=>s.question.id===duplicate.duplicateMatches![0].questionId)!.attempts,0);
  if(alias)assert.equal(stats.find(s=>s.question.id===alias.id)!.attempts,alias.relatedIds!.length*2);
  assert.deepEqual(rankMistakes(stats,true),[]);
});


test('uncharged activity distinguishes saved answers, flash marks, skipped exams and untouched questions',()=>{
  const qs=bank.slice(0,5),state=emptyState();
  const finished=createSession(qs.slice(0,1),{...defaultSettings,count:1},'exam',1000);
  state.history=[{...finished,finishedAt:2000,finishReason:'manual'}];
  state.known=[qs[2].id];
  const otherTab=createSession([qs[1]],{...defaultSettings,count:1},'exam',3000);
  otherTab.answers[qs[1].id]=qs[1].answer;
  state.progress[qs[4].id]={attempts:1,correct:1,latest:true,lastSeen:1000};
  const before=structuredClone(state),stats=questionStatistics(qs,state,[otherTab]);
  assert.deepEqual(stats.map(s=>s.mastery),['skipped','pending','known-only','unseen','strong']);
  assert.deepEqual(stats.map(s=>s.attempts),[0,0,0,0,1]);
  assert.deepEqual(stats.map(s=>s.rate),[null,null,null,null,1]);
  assert.deepEqual(rankMistakes(stats),[]);
  assert.deepEqual(state,before);
});

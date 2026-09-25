import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question } from './domain.ts';
import { createSession, defaultSettings, eligibleQuestions, emptyState, isStudySession, normalizeFlashDeck, questionRanges, studyQuestions, studyState, validateState } from './domain.ts';
import { validateBackup } from './sync/records.ts';
import { prepareChat } from '../server/chat.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const archive:Question[]=JSON.parse(readFileSync(new URL('../../output/merged/ORIGINAL_ARCHIVE.json',import.meta.url),'utf8'));
test('original questions are absent from every published pool and the assistant',()=>{
  assert.equal(archive.length,352);assert.equal(bank.length,437);
  assert.ok(bank.every(q=>q.origin!=='original'&&q.id<1001));
  const combined=[...bank,...archive];
  assert.deepEqual(studyQuestions(combined),bank);
  assert.deepEqual(eligibleQuestions(combined,defaultSettings,emptyState()),bank);
  assert.equal(eligibleQuestions(combined,{...defaultSettings,range:'1001-1352'},emptyState()).length,0);
  assert.ok(questionRanges.every(r=>Number(r.value.split('-')[0])<1001));
  assert.throws(()=>createSession(archive,{...defaultSettings,count:1},'practice'));
  assert.throws(()=>prepareChat({messages:[{role:'user',content:'Explain'}],context:{kind:'question',id:1001}}));
});
test('old original sessions, marks, attempts and flashcards remain valid in backups without content',()=>{
  for(const range of ['1001-1352','1001-1096','1097-1184','1185-1264','1265-1352']){
    const id=Number(range.split('-')[0]),q=archive.find(q=>q.id===id)!;
    const old={...createSession([bank[0]],{...defaultSettings,count:1},'practice',1000),questionIds:[id],answers:{[id]:q.answer},revealed:[id],settings:{...defaultSettings,count:1,range}};
    const state={...emptyState(),active:old,known:[id,333],bookmarks:[id],progress:{[id]:{attempts:2,correct:1,latest:true,lastSeen:2000}},flash:{ids:[id],index:0,origin:'original' as const}};
    assert.deepEqual(validateState(state,bank),state);
    const backup={version:2,name:'Retired learner',exportedAt:3000,rows:[{kind:'session',key:`session:${old.id}`,value:old,stamp:3000,writer:'old-tab'}]};
    assert.deepEqual(validateBackup(backup,bank),backup);
    assert.equal(isStudySession(old,bank),false);
    const visible=studyState(state,bank);assert.equal(visible.active,null);assert.deepEqual(visible.known,[333]);assert.deepEqual(visible.progress,{});
    assert.equal(state.progress[id].attempts,2);
  }
});
test('mixed flash decks retain the next available question and reset stale answer feedback',()=>{
  const flash={ids:[333,1001,701],index:1,origin:'all' as const,collection:'mla' as const,mode:'loop' as const,loop:{selected:['A'],result:false,done:false,lastAttempt:null}};
  const normalized=normalizeFlashDeck(flash,bank)!;
  assert.deepEqual(normalized.ids,[333,701]);assert.equal(normalized.index,1);assert.equal(normalized.loop,undefined);
  assert.equal(normalizeFlashDeck({ids:[1001],index:0,origin:'original'},bank),null);
  assert.equal(normalizeFlashDeck({...flash,origin:'original'},bank)!.origin,'imported');
  assert.deepEqual(flash.ids,[333,1001,701]);
});

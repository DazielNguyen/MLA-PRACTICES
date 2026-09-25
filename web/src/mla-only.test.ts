import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createSession, defaultSettings, eligibleQuestions, emptyState, isStudySession, normalizeFlashDeck, studyQuestions, studyState, validateState } from './domain.ts';
import { validateBackup, validateRow } from './sync/records.ts';
import type { Question, Session } from './domain.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const archive:Question[]=JSON.parse(readFileSync(new URL('../../output/merged/MLS_ARCHIVE.json',import.meta.url),'utf8'));
const oldSession=(ids=[271]):Session=>({id:'old-session',mode:'practice',questionIds:ids,index:0,answers:{271:['A']},revealed:[271],flagged:[271],startedAt:1000,deadline:null,finishedAt:2000,finishReason:'manual',settings:{...defaultSettings,collection:'all',range:'all',count:ids.length}});

test('the deployed bank, image assets and catalog contain only MLA questions',()=>{
  assert.equal(bank.length,437);assert.ok(bank.every(q=>q.collection==='mla'&&q.id>332));
  assert.equal(archive.length,332);assert.ok(archive.every(q=>q.collection==='mls'));
  assert.ok(readdirSync(new URL('../public/images/',import.meta.url)).every(file=>file.startsWith('mla-')));
  const catalog=JSON.parse(readFileSync(new URL('./data/catalog.json',import.meta.url),'utf8'));
  assert.equal(catalog.total,437);assert.equal(catalog.records,437);assert.deepEqual(catalog.collections,{mla:437});
  assert.deepEqual(catalog.statuses,{checked:210,source:227});
});
test('every study entry point rejects retired questions even if given an old combined bank',()=>{
  const combined=[...archive,...bank];
  assert.equal(studyQuestions(combined).length,437);
  const exam=eligibleQuestions(combined,{...defaultSettings,collection:'all',includeReview:true,includeHistorical:true},emptyState(),'exam');
  assert.equal(exam.length,437);assert.ok(exam.every(q=>q.collection==='mla'));
  const session=createSession(combined,{...defaultSettings,count:437},'practice');
  assert.ok(session.questionIds.every(id=>id>332));
  assert.throws(()=>createSession(archive,{...defaultSettings,count:1},'practice'));
});
test('archived and mixed v1/v2 sessions validate without shipping their questions or rewriting answers',()=>{
  for(const ids of [[271],[271,333]]){
    const session=oldSession(ids);session.answers[333]=['C'];if(ids.length===1)delete session.answers[333];
    const state={...emptyState(),bookmarks:[269,333],known:[271,334],history:[session],flash:{ids:[70,269,333],index:1}};
    assert.deepEqual(validateState(state,bank),state);
    const row={kind:'session',key:'session:old-session',value:session,stamp:2000,writer:'old-tab'};
    assert.deepEqual(validateRow(row,bank),row);
    const backup={version:2,name:'Duy',exportedAt:2000,rows:[row]};
    assert.deepEqual(validateBackup(backup,bank),backup);
    session.answers[271]=['Z'];assert.throws(()=>validateState(state,bank));
  }
});
test('MLA statistics exclude archived attempts and sessions without modifying saved state',()=>{
  const finished={...createSession([bank[0]],{...defaultSettings,count:1},'practice',1000),finishedAt:2000,finishReason:'manual' as const};
  const active={...oldSession(),finishedAt:null,finishReason:null};
  const state={...emptyState(),active,history:[oldSession(),oldSession([271,333]),finished],known:[271,333],bookmarks:[269,334],progress:{271:{attempts:3,correct:2,latest:true,lastSeen:2000},333:{attempts:1,correct:1,latest:true,lastSeen:2000}}};
  const before=structuredClone(state), visible=studyState(state,bank);
  assert.equal(visible.active,null);assert.deepEqual(visible.history,[finished]);
  assert.deepEqual(visible.known,[333]);assert.deepEqual(visible.bookmarks,[334]);
  assert.deepEqual(Object.keys(visible.progress),['333']);assert.deepEqual(state,before);
  assert.equal(isStudySession(oldSession([271,333]),bank),false);
});
test('old flashcards retain the current MLA card or move to the next retained card',()=>{
  const flash={ids:[70,333,269,334],index:2,collection:'all' as const};
  const normalized=normalizeFlashDeck(flash,bank)!;
  assert.deepEqual(normalized,{ids:[333,334],index:1,collection:'mla'});
  assert.equal(normalizeFlashDeck(normalized,bank),normalized);
  assert.deepEqual(normalizeFlashDeck({...flash,index:1},bank),{ids:[333,334],index:0,collection:'mla'});
  assert.equal(normalizeFlashDeck({ids:[70,269],index:1},bank),null);
  assert.deepEqual(flash.ids,[70,333,269,334]);
});

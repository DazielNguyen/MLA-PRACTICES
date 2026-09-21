import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSession, defaultSettings, eligibleQuestions, emptyState, finishSession, hasQuestionMark, isCorrect, normalizeFlashDeck, questionProgress, score, setQuestionMark, studyQuestions, validateState } from './domain.ts';
import { validateBackup, validateRow } from './sync/records.ts';
import type { Question } from './domain.ts';

const bank:Question[]=JSON.parse(readFileSync(new URL('./data/questions.json',import.meta.url),'utf8'));
const get=(id:number)=>bank.find(q=>q.id===id)!;
const pairs=[[269,70],[271,81],[188,86],[295,109],[202,113],[193,143],[270,197]];

test('new study pools exclude all seven variants but retain distinct questions',()=>{
  assert.equal(studyQuestions(bank).length,567);
  assert.equal(studyQuestions(bank).filter(q=>q.collection==='mls').length,325);
  const pool=eligibleQuestions(bank,{...defaultSettings,includeReview:true},emptyState());
  assert.equal(pool.length,567);
  for(const [alias,canonical] of pairs){
    assert.equal(get(alias).duplicateOf,canonical);
    assert.equal(get(canonical).duplicateOf,undefined);
    assert.deepEqual(get(canonical).relatedIds,[canonical,alias]);
    assert.deepEqual(get(alias).relatedIds,get(canonical).relatedIds);
    assert.ok(get(canonical).sourceIds.includes(alias));
    assert.ok(!pool.some(q=>q.id===alias));
    assert.ok(pool.some(q=>q.id===canonical));
  }
  assert.deepEqual(studyQuestions(bank).filter(q=>[14,25,125,325,173,204].includes(q.id)).map(q=>q.id),[14,25,125,173,204,325]);
  const session=createSession(bank,{...defaultSettings,count:567},'practice');
  assert.ok(session.questionIds.every(id=>get(id).duplicateOf===undefined));
  assert.throws(()=>createSession(bank,{...defaultSettings,count:568},'practice'));
});

test('old attempts and selections keep the original reordered answer key',()=>{
  const state=emptyState();
  state.active={...createSession([get(81)],{...defaultSettings,count:1},'practice',1000),questionIds:[271],answers:{271:['A']},flagged:[271]};
  const raw=JSON.parse(JSON.stringify(state));
  assert.deepEqual(validateState(raw,bank),state);
  assert.equal(isCorrect(get(271),['A']),true);
  assert.equal(isCorrect(get(81),['A']),false);
  const finished=finishSession(state,bank,2000);
  assert.equal(score(finished.history[0],bank).percent,100);
  assert.deepEqual(finished.history[0].questionIds,[271]);
  assert.deepEqual(finished.history[0].answers,{271:['A']});
  assert.equal(finished.progress[271].correct,1);
  assert.equal(finished.progress[81],undefined);
  const row={kind:'session',key:`session:${finished.history[0].id}`,value:finished.history[0],stamp:2000,writer:'old-tab'};
  assert.deepEqual(validateRow(row,bank),row);
  const backup={version:2,name:'Duy',exportedAt:2000,rows:[row]};
  assert.deepEqual(validateBackup(backup,bank),backup);
});

test('saved marks and latest attempt follow the group without rewriting old progress',()=>{
  const state=emptyState();state.bookmarks=[269];state.known=[271];
  state.progress={70:{attempts:2,correct:2,latest:true,lastSeen:1000},269:{attempts:1,correct:0,latest:false,lastSeen:2000}};
  const original=structuredClone(state);
  assert.deepEqual(eligibleQuestions(bank,{...defaultSettings,scope:'bookmarked'},state).map(q=>q.id),[70]);
  assert.deepEqual(eligibleQuestions(bank,{...defaultSettings,scope:'wrong'},state).map(q=>q.id),[70]);
  assert.ok(!eligibleQuestions(bank,{...defaultSettings,scope:'unseen'},state).some(q=>q.id===70));
  assert.deepEqual(questionProgress(get(70),state),{attempts:3,correct:2,latest:false,lastSeen:2000});
  assert.ok(hasQuestionMark(get(81),state.known));
  assert.deepEqual(setQuestionMark(get(81),state.known,false),[]);
  assert.deepEqual(setQuestionMark(get(269),[269,2],true),[2,70]);
  assert.deepEqual(setQuestionMark(get(70),[269,70,2]),[2]);
  assert.deepEqual(state,original);
  state.progress[70].lastSeen=3000;
  assert.equal(eligibleQuestions(bank,{...defaultSettings,scope:'wrong'},state).length,0);
});

test('saved flashcard decks deduplicate and keep the current question group',()=>{
  const flash={ids:[70,269,271,81,2],index:2,collection:'mls' as const};
  const normalized=normalizeFlashDeck(flash,bank)!;
  assert.deepEqual(normalized,{ids:[70,81,2],index:1,collection:'mls'});
  assert.deepEqual(flash.ids,[70,269,271,81,2]);
  assert.equal(normalizeFlashDeck(normalized,bank),normalized);
  assert.equal(normalizeFlashDeck(null,bank),null);
});

test('study exports and catalog contain 567 entries with every old MLS source reference',()=>{
  const catalog=JSON.parse(readFileSync(new URL('./data/catalog.json',import.meta.url),'utf8'));
  assert.equal(catalog.total,567);assert.equal(catalog.records,574);assert.equal(catalog.archivedVariants,7);
  const refs=studyQuestions(bank).filter(q=>q.collection==='mls').flatMap(q=>q.sourceIds).sort((a,b)=>a-b);
  assert.deepEqual(refs,Array.from({length:332},(_,i)=>i+1));
  const markdown=readFileSync(new URL('../../output/merged/ML_COMBINED.md',import.meta.url),'utf8');
  const ids=[...markdown.matchAll(/^## #(\d+) ·/gm)].map(match=>Number(match[1]));
  assert.deepEqual(ids,studyQuestions(bank).map(q=>q.id));
  const cards=readFileSync(new URL('../../output/merged/QUIZLET_COMBINED.md',import.meta.url),'utf8').trim().split('\n');
  assert.equal(cards.length,567);assert.ok(cards.every(line=>line.split('\t').length===2));
});

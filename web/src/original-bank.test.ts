import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Question } from './domain.ts';
import { createSession, defaultSettings, eligibleQuestions, emptyState, finishSession, isCorrect, sourceLabel, questionRanges, revealAnswer, validateState } from './domain.ts';
import { validateBackup } from './sync/records.ts';

const personal: Question[] = JSON.parse(readFileSync(new URL('./data/questions.json', import.meta.url), 'utf8'));
const base = personal.filter(q=>q.origin!=='original');

test('published original pack preserves imported records and exposes all four domain ranges', () => {
  assert.deepEqual(personal.slice(0, base.length), base);
  const added = personal.slice(base.length);
  assert.equal(added.length, 352);
  assert.deepEqual(added.map(q=>q.id), Array.from({length:352}, (_,i)=>1001+i));
  const whole = eligibleQuestions(personal, {...defaultSettings, range:'1001-1352'}, emptyState(), 'exam');
  assert.equal(whole.length, 352);
  const domainRanges = questionRanges.filter(r=>r.label.startsWith('Tự biên soạn · Domain'));
  const groups = domainRanges.map(r=>eligibleQuestions(personal, {...defaultSettings,range:r.value},emptyState(),'exam'));
  assert.deepEqual(groups.map(q=>q.length), [96,88,80,88]);
  assert.deepEqual(groups.flat().map(q=>q.id), whole.map(q=>q.id));
});

test('original IDs preserve answers, flashcards and history through backup validation', () => {
  const q = personal.find(q=>q.id===1001)!;
  const settings = {...defaultSettings, count:1, range:'1001-1352', quick:true};
  let state = emptyState();
  state.active = createSession([q], settings, 'practice', 1000);
  state.active.answers[q.id] = q.answer;
  state = revealAnswer(state, q, 2000);
  assert.equal(isCorrect(q, state.active!.answers[q.id]), true);
  state = finishSession(state, personal, 3000);
  state.bookmarks = [q.id]; state.known = [q.id]; state.flash = {ids:[q.id],index:0,collection:'mla',origin:'original'};
  assert.equal(state.progress[q.id].attempts,1);
  assert.equal(state.progress[q.id].correct,1);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state)),personal),state);
  const session = state.history[0];
  const backup = {version:2,name:'Local test',exportedAt:3000,rows:[{kind:'session',key:`session:${session.id}`,value:session,stamp:3000,writer:'local-test'}]};
  assert.deepEqual(validateBackup(backup,personal),backup);
  assert.throws(()=>validateBackup(backup,base));
});

 test('all original records have a visible source label and complete explanations', () => {
  const originals = personal.filter(q=>q.origin==='original');
  assert.equal(originals.length,352);
  const canonical = JSON.parse(readFileSync(new URL('../scripts/original-questions.json',import.meta.url),'utf8'));
  const invariant = (q:Question) => Object.fromEntries(Object.entries(q).filter(([key])=>!['analysis','explanation','hint','notes','explanationLanguage'].includes(key)));
  assert.deepEqual(originals.map(invariant),canonical.map(invariant));
  const normalize=(text:string)=>text.toLowerCase().replace(/[^a-z0-9]/g,'');
  assert.equal(new Set(personal.map(q=>normalize(q.text))).size,personal.length);
  for(const q of originals){
    assert.match(sourceLabel(q),/Tự biên soạn/);
    assert.equal(q.sourceName,'MLA-C01 · Tự biên soạn');
    assert.equal(q.required,1);
    assert.deepEqual(Object.keys(q.analysis!.options).sort(),Object.keys(q.choices).sort());
    assert.ok(q.sources.every(s=>new URL(s.url).hostname.endsWith('.amazon.com')));
  }
  assert.throws(()=>validateState({...emptyState(),flash:{ids:[1001],index:0,origin:'invalid'}},personal));
});

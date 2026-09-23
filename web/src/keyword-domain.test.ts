import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isKeywordDeck, keywordCoverage, keywordExercise } from './keyword-domain.ts';
import type { KeywordItem } from './keyword-domain.ts';
import { keywordIds } from './data/keyword-ids.ts';
import { validateBackup, validateRow } from './sync/records.ts';
const items = JSON.parse(readFileSync(new URL('./data/keywords.json', import.meta.url), 'utf8')) as KeywordItem[];

test('all 16 source parts retain their own stable IDs, English prompts, detailed explanations and provenance', () => {
  const expected = [[210,76,42,62],[164,62,51,113],[147,69,61,127],[145,69,60,116]];
  assert.equal(items.length, 1574); assert.equal(keywordIds.size, items.length);
  for (let d = 1; d <= 4; d++) for (let p = 1; p <= 4; p++) assert.equal(items.filter(q => q.domain === d && q.part === p).length, expected[d-1][p-1]);
  for (const item of items) {
    assert.ok(keywordIds.has(item.id)); assert.ok(item.sections.length >= 4);
    assert.ok(item.prompt && item.answer && item.source.row >= 6 && item.source.urls.length);
    assert.ok(!/[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/iu.test(item.prompt), `Vietnamese in English prompt: ${item.id}`);
    if (item.part === 3) assert.ok(item.steps.length >= 2);
  }
});
test('every generated exercise has one unique correct choice and survives a reload with the same seed', () => {
  for (const item of items) {
    const exercise = keywordExercise(item, items, 987654);
    assert.ok(exercise.choices.length >= 2 && exercise.choices.length <= 4, item.id);
    assert.equal(exercise.choices.filter(c => c === exercise.answer).length, 1);
    assert.equal(new Set(exercise.choices).size, exercise.choices.length);
    assert.deepEqual(keywordExercise(item, items, 987654), exercise);
    if (item.part === 3) assert.ok(exercise.prompt.includes('________'));
  }
  const s3 = items.find(q => q.part === 2 && q.title === 'Amazon S3')!;
  assert.ok(keywordExercise(s3, items, 1).prompt.startsWith('________ is'));
});
test('knowledge progress is independent of quiz IDs and other Domain/Part occurrences', () => {
  const first = items[0], second = items.find(q => q.domain === 2)!;
  const value = {id:first.id,status:'mastered' as const,seenAt:1,result:true};
  const row = {key:`keyword:${first.id}`,kind:'keyword',value,stamp:2,writer:'tab-a'};
  assert.equal(validateRow(row, []).kind, 'keyword');
  const counts = keywordCoverage([first,second], new Map([[first.id,value]]));
  assert.deepEqual(counts, {unseen:1,learning:0,review:0,mastered:1,total:2});
  assert.equal(validateBackup({version:2,name:'Duy',exportedAt:3,rows:[row]}, []).version, 2);
  assert.throws(() => validateRow({...row,key:`keyword:${second.id}`}, []));
  assert.throws(() => validateRow({...row,value:{...value,id:'unknown'}}, []));
  assert.throws(() => validateRow({...row,value:{...value,status:'whatever'}}, []));
});
test('resumable decks reject unknown IDs, duplicate cards, invalid counts and index overflow', () => {
  const deck = {ids:[items[0].id], index:0, mode:'match', selected:null, revealed:false, correct:0, answered:0, startedAt:1};
  assert.ok(isKeywordDeck(deck)); assert.ok(isKeywordDeck({...deck,index:1})); assert.ok(isKeywordDeck(null));
  for (const patch of [{ids:['unknown']},{ids:[...deck.ids,...deck.ids]},{index:2},{index:-1},{correct:2},{answered:2},{selected:{}},{revealed:0}]) assert.equal(isKeywordDeck({...deck,...patch}),false);
});

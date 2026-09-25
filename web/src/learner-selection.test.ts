import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { learnerOverview, matchingLearners } from './learner-selection.ts';
import { createSession, defaultSettings } from './domain.ts';
import type { Question } from './domain.ts';
import type { StudyRow } from './sync/records.ts';

test('existing names ignore case and extra spaces but preserve accents and duplicate identities', () => {
  const profiles = [{ id: 'a', name: 'Duy Nguyễn' }, { id: 'b', name: 'Duy Nguyen' }, { id: 'c', name: 'Duy Nguyễn' }];
  assert.deepEqual(matchingLearners(profiles, '  DUY   NGUYỄN '.normalize('NFD')).map(p => p.id), ['a', 'c']);
  assert.deepEqual(matchingLearners(profiles, 'duy nguyen').map(p => p.id), ['b']);
  assert.deepEqual(matchingLearners(profiles, 'Duy'), []);
  assert.deepEqual(matchingLearners(profiles, ' '), []);
});

test('welcome summarizes unique MLA questions and unfinished work without changing progress', () => {
  const bank: Question[] = JSON.parse(readFileSync(new URL('./data/questions.json', import.meta.url), 'utf8'));
  const session = createSession([bank.find(q => q.id === 334)!], { ...defaultSettings, count: 1 }, 'practice');
  const rows: StudyRow[] = [
    { key: 'known:1', kind: 'known', value: true, stamp: 1, writer: 'a' },
    { key: 'known:334', kind: 'known', value: true, stamp: 2, writer: 'a' },
    { key: 'known:1001', kind: 'known', value: true, stamp: 3, writer: 'a' },
    { key: `session:${session.id}`, kind: 'session', value: session, stamp: 4, writer: 'a' },
    { key: 'session:finished', kind: 'session', value: { ...session, id: 'finished', finishedAt: 5 }, stamp: 5, writer: 'a' },
    { key: 'attempt:finished:334', kind: 'attempt', value: { sessionId: 'finished', questionId: 334, correct: true, lastSeen: 5 }, stamp: 6, writer: 'a' },
  ];
  const before = JSON.stringify(rows);
  assert.deepEqual(learnerOverview(rows, bank), { studied: 1, known: 1, unfinished: 1, completed: 1, lastActivity: 6 });
  assert.equal(JSON.stringify(rows), before);
});

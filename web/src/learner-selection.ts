import { hasQuestionMark, isStudySession, questionProgress, studyQuestions } from './domain.ts';
import type { Question, Session } from './domain.ts';
import { composeState } from './sync/records.ts';
import type { StudyRow } from './sync/records.ts';

// Match only profiles already available on this browser. Names are not cloud credentials.
export function matchingLearners<T extends { name: string }>(profiles: T[], name: string): T[] {
  const normalize = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi-VN');
  const key = normalize(name);
  return key ? profiles.filter(profile => normalize(profile.name) === key) : [];
}

export function learnerOverview(rows: StudyRow[], bank: Question[]) {
  const state = composeState(rows, null, 'welcome', bank);
  const questions = studyQuestions(bank);
  const sessions = rows.filter(row => row.kind === 'session').map(row => row.value as Session).filter(session => isStudySession(session, bank));
  return {
    studied: questions.filter(q => questionProgress(q, state) || hasQuestionMark(q, state.known)).length,
    known: questions.filter(q => hasQuestionMark(q, state.known)).length,
    unfinished: sessions.filter(session => session.finishedAt === null).length,
    completed: sessions.filter(session => session.finishedAt !== null).length,
    lastActivity: rows.reduce((latest, row) => Math.max(latest, row.stamp), 0),
  };
}

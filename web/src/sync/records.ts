import { emptyState, isCorrect, validateState, validationQuestions } from '../domain.ts';
import type { Progress, Question, Session, State } from '../domain.ts';
import { isKeywordDeck, isKeywordProgress } from '../keyword-domain.ts';

export type RowKind = 'session' | 'attempt' | 'bookmark' | 'known' | 'flash' | 'baseline' | 'keyword' | 'keywordDeck';
export type StudyRow = { key: string; kind: RowKind; value: unknown; stamp: number; writer: string; dirty?: boolean; claim?: boolean };
export type Attempt = { questionId: number; sessionId: string; correct: boolean; lastSeen: number };
export type Baseline = { progress: Record<string, Progress>; covered: string[] };
export type Backup = { version: 2; name: string; exportedAt: number; rows: StudyRow[] };
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const attemptKey = (sessionId: string, questionId: number) => `attempt:${sessionId}:${questionId}`;
export const sessionKey = (id: string) => `session:${id}`;
export const cleanRow = ({ key, kind, value, stamp, writer }: StudyRow): StudyRow => ({ key, kind, value, stamp, writer });
export function newer(a: StudyRow, b: StudyRow) { return a.stamp > b.stamp || a.stamp === b.stamp && a.writer > b.writer; }
export function validateRow(input: unknown, bank: Question[]): StudyRow {
  const fail = (): never => { throw new Error('Dữ liệu tiến trình không hợp lệ.'); };
  if (!object(input) || typeof input.key !== 'string' || input.key.length > 180 || !Number.isSafeInteger(input.stamp) || Number(input.stamp) < 0 || typeof input.writer !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.writer)) return fail();
  const row = input as StudyRow, value = row.value;
  if (row.kind === 'session') {
    if (!object(value) || row.key !== sessionKey(String(value.id))) return fail();
    const state = emptyState();
    if (value.finishedAt === null) state.active = value as Session; else state.history = [value as Session];
    validateState(state, bank);
  } else if (row.kind === 'attempt') {
    if (!object(value) || !validationQuestions(bank).some(q => q.id === value.questionId) || typeof value.sessionId !== 'string' || row.key !== attemptKey(value.sessionId, Number(value.questionId)) || typeof value.correct !== 'boolean' || !Number.isFinite(value.lastSeen)) return fail();
  } else if (row.kind === 'bookmark' || row.kind === 'known') {
    if (typeof value !== 'boolean' || !validationQuestions(bank).some(q => row.key === `${row.kind}:${q.id}`)) return fail();
  } else if (row.kind === 'flash') {
    if (!row.key.startsWith('flash:')) return fail();
    validateState({ ...emptyState(), flash: value }, bank);
  } else if (row.kind === 'keyword') {
    if (!isKeywordProgress(value) || row.key !== `keyword:${value.id}`) return fail();
  } else if (row.kind === 'keywordDeck') {
    if (!/^keywordDeck:[a-zA-Z0-9-]{1,80}$/.test(row.key) || !isKeywordDeck(value)) return fail();
  } else if (row.kind === 'baseline') {
    if (row.key !== 'baseline:legacy' || !object(value) || !Array.isArray(value.covered) || value.covered.some(v => typeof v !== 'string' || !v.startsWith('attempt:'))) return fail();
    validateState({ ...emptyState(), progress: value.progress }, bank);
  } else return fail();
  return cleanRow(row);
}
export function validateBackup(input: unknown, bank: Question[]): Backup | State {
  if (object(input) && input.version === 1) return validateState(input, bank);
  if (!object(input) || input.version !== 2 || typeof input.name !== 'string' || !Number.isFinite(input.exportedAt) || !Array.isArray(input.rows) || input.rows.length > 50000) throw new Error('File tiến trình không hợp lệ hoặc khác phiên bản.');
  const rows = input.rows.map(row => validateRow(row, bank));
  if (new Set(rows.map(r => r.key)).size !== rows.length) throw new Error('File có bản ghi trùng lặp.');
  return { version: 2, name: input.name, exportedAt: Number(input.exportedAt), rows };
}
export function composeState(rows: StudyRow[], activeId: string | null, writer: string, bank: Question[] = []): State {
  const state = emptyState();
  const baseline = rows.find(r => r.kind === 'baseline')?.value as Baseline | undefined;
  state.progress = structuredClone(baseline?.progress || {});
  const covered = new Set(baseline?.covered || []);
  // Older versions saved reviewed answers in sessions without creating attempt rows.
  // Project those missing attempts without rewriting sessions or duplicating synced attempts.
  const reviewQuestions = new Map(bank.filter(q=>q.status==='review').map(q=>[q.id,q]));
  const attemptKeys = new Set(rows.filter(row=>row.kind==='attempt').map(row=>row.key));
  const inferred: StudyRow[] = [];
  for (const row of rows) {
    if (row.kind !== 'session') continue;
    const session = row.value as Session;
    for (const id of session.questionIds) {
      const question = reviewQuestions.get(id), answer = session.answers[id];
      const graded = session.finishedAt !== null || session.mode === 'practice' && session.settings.feedback === 'immediate' && session.revealed.includes(id);
      if (!question || !answer?.length || !graded) continue;
      const key = attemptKey(session.id,id);
      if (!baseline?.progress[id]) covered.delete(key);
      if (attemptKeys.has(key) || covered.has(key)) continue;
      attemptKeys.add(key);
      // There is no original grading time; navigation must not make an old answer look new.
      inferred.push({key,kind:'attempt',stamp:row.stamp,writer:row.writer,value:{questionId:id,sessionId:session.id,correct:isCorrect(question,answer),lastSeen:session.finishedAt ?? session.startedAt}});
    }
  }
  for (const row of [...rows,...inferred].sort((a,b)=>a.stamp-b.stamp || a.writer.localeCompare(b.writer) || a.key.localeCompare(b.key))) {
    state.updatedAt = Math.max(state.updatedAt, row.stamp);
    if (row.kind === 'session') {
      const session = row.value as Session;
      if (session.finishedAt !== null) state.history.push(session);
      else if (session.id === activeId && row.writer === writer) state.active = session;
    }
    if (row.kind === 'bookmark' && row.value === true) state.bookmarks.push(Number(row.key.split(':')[1]));
    if (row.kind === 'known' && row.value === true) state.known.push(Number(row.key.split(':')[1]));
    if (row.kind === 'attempt' && !covered.has(row.key)) {
      const a = row.value as Attempt;
      const previous = state.progress[a.questionId] || { attempts: 0, correct: 0, latest: false, lastSeen: 0 };
      state.progress[a.questionId] = { attempts: previous.attempts + 1, correct: previous.correct + Number(a.correct), latest: a.lastSeen >= previous.lastSeen ? a.correct : previous.latest, lastSeen: Math.max(a.lastSeen, previous.lastSeen) };
    }
  }
  state.bookmarks.sort((a,b)=>a-b);
  state.known.sort((a,b)=>a-b);
  state.history.sort((a, b) => b.finishedAt! - a.finishedAt! || a.id.localeCompare(b.id));
  state.history = state.history.slice(0, 100);
  const flash = rows.find(r => r.key === `flash:${writer}`) || rows.filter(r => r.kind === 'flash').sort((a, b) => b.stamp - a.stamp)[0];
  state.flash = (flash?.value as State['flash']) || null;
  return state;
}
export function mergeBaseline(a: Baseline | undefined, b: Baseline): Baseline {
  const result = structuredClone(a || { progress: {}, covered: [] });
  for (const [key, progress] of Object.entries(b.progress)) {
    const old = result.progress[key];
    result.progress[key] = !old ? progress : { attempts: Math.max(old.attempts, progress.attempts), correct: Math.max(old.correct, progress.correct), latest: old.lastSeen > progress.lastSeen ? old.latest : progress.latest, lastSeen: Math.max(old.lastSeen, progress.lastSeen) };
  }
  result.covered = [...new Set([...result.covered, ...b.covered])];
  return result;
}

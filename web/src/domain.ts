import { retiredQuestionShapes } from './data/retired-question-shapes.ts';

export type Question = {
  id: number; page: number | null; text: string; choices: Record<string, string>;
  collection: 'mls' | 'mla'; sourceIds: number[]; sourceName: string; domain?: string; hint?: string; origin?: 'original';
  answer: string[]; required: number; status: 'checked' | 'historical' | 'review' | 'source';
  explanation: string; sources: { title: string; url: string }[]; notes: string[];
  analysis?: { keyConcept: string; options: Record<string, string> };
  duplicateOf?: number; relatedIds?: number[];
  images: { url: string; slot: string; alt: string }[];
};
export type Settings = {
  count: number; minutes: number; order: 'random' | 'sequential';
  scope: 'all' | 'wrong' | 'bookmarked' | 'unseen'; range: string;
  includeReview: boolean; includeHistorical: boolean; feedback: 'immediate' | 'end';
  collection?: 'all' | 'mls' | 'mla'; includeSource?: boolean; quick?: boolean;
};
export type Session = {
  id: string; mode: 'practice' | 'exam'; questionIds: number[]; index: number;
  answers: Record<string, string[]>; revealed: number[]; flagged: number[];
  startedAt: number; deadline: number | null; finishedAt: number | null;
  finishReason: 'manual' | 'timeout' | null; settings: Settings;
};
export type Progress = { attempts: number; correct: number; latest: boolean; lastSeen: number };
export type State = {
  version: 1; updatedAt: number; bookmarks: number[]; known: number[];
  progress: Record<string, Progress>; active: Session | null; history: Session[];
  flash: { ids: number[]; index: number; origin?: 'all'|'imported'|'original'; filter?: 'all'|'new'|'known'|'bookmarked'; includeReview?: boolean; collection?: 'all'|'mls'|'mla'; includeSource?: boolean } | null;
};
export const STORAGE_KEY = 'ml-practice:v1';
export const defaultSettings: Settings = { count: 20, minutes: 40, order: 'random', scope: 'all', range: 'all', includeReview: false, includeHistorical: false, feedback: 'immediate', collection: 'mla', includeSource: false };
export const importedBankRange = '333-618';
export const questionRanges = [
  { value:importedBankRange, collection:'mla', label:'Bộ đề đã nhập · 242 câu' },
  ...['333-397','398-462','463-527','528-592','593-618'].map((value,i)=>({value,collection:'mla',label:`MLA-C01 · bộ ${i+1}`})),
  { value:'1001-1352', collection:'mla', label:'MLA-C01 · 352 câu tự biên soạn' },
  ...['1001-1096','1097-1184','1185-1264','1265-1352'].map((value,i)=>({value,collection:'mla',label:`Tự biên soạn · Domain ${i+1}`})),
];
export const collectionLabel = (collection: string) => collection === 'mla' ? 'MLA-C01 · Associate' : collection === 'mls' ? 'MLS · Specialty' : 'MLS + MLA-C01';
export const sourceLabel = (q: Question) => `${q.collection === 'mla' ? 'MLA-C01' : 'MLS'} Q${String(q.sourceIds[0]).padStart(3,'0')}${q.origin === 'original' ? ' · Tự biên soạn' : ''}`;
export const matchesOrigin = (q: Question, origin: string) => origin === 'all' || (q.origin === 'original' ? origin === 'original' : origin === 'imported');
export const emptyState = (): State => ({ version: 1, updatedAt: 0, bookmarks: [], known: [], progress: {}, active: null, history: [], flash: null });
export const isCorrect = (q: Question, answer: string[] = []) => q.status !== 'review' && answer.length === q.answer.length && q.answer.every(v => answer.includes(v));
export const isQuickSession = (session: Session) => session.mode === 'practice' && session.settings.feedback === 'immediate' && session.settings.quick === true;
export const studyQuestions = (bank: Question[]) => bank.filter(q => q.collection === 'mla' && q.duplicateOf === undefined);
export function isStudySession(session: Session, bank: Question[]) {
  const ids = new Set(studyQuestions(bank).map(q=>q.id));
  return session.questionIds.length > 0 && session.questionIds.every(id=>ids.has(id));
}
// Project the visible study area without rewriting archived sessions or backup rows.
export function studyState(state: State, bank: Question[]): State {
  const ids = new Set(studyQuestions(bank).map(q=>q.id));
  return {...state, bookmarks:state.bookmarks.filter(id=>ids.has(id)), known:state.known.filter(id=>ids.has(id)),
    progress:Object.fromEntries(Object.entries(state.progress).filter(([id])=>ids.has(Number(id)))),
    active:state.active && isStudySession(state.active,bank) ? state.active : null,
    history:state.history.filter(session=>isStudySession(session,bank))};
}
type QuestionShape = Pick<Question, 'id'|'choices'|'required'|'status'>;
const retiredShapes: QuestionShape[] = retiredQuestionShapes.map(([id,letters,required,review])=>({
  id, choices:Object.fromEntries([...letters].map(letter=>[letter,''])), required, status:review?'review':'checked'
}));
export const validationQuestions = (bank: Question[]): QuestionShape[] => [...retiredShapes,...bank];
export const relatedQuestionIds = (q: Question) => q.relatedIds || [q.id];
export const hasQuestionMark = (q: Question, ids: number[]) => relatedQuestionIds(q).some(id => ids.includes(id));
export function setQuestionMark(q: Question, ids: number[], marked = !hasQuestionMark(q, ids)) {
  const others = ids.filter(id => !relatedQuestionIds(q).includes(id));
  return marked ? [...others, q.duplicateOf ?? q.id] : others;
}
export function questionProgress(q: Question, state: State): Progress | undefined {
  const records = relatedQuestionIds(q).map(id => state.progress[id]).filter((p): p is Progress => Boolean(p));
  if (!records.length) return undefined;
  const latest = records.reduce((a, b) => b.lastSeen > a.lastSeen ? b : a);
  return { attempts: records.reduce((n,p)=>n+p.attempts,0), correct: records.reduce((n,p)=>n+p.correct,0), latest: latest.latest, lastSeen: latest.lastSeen };
}
export function normalizeFlashDeck(flash: State['flash'], bank: Question[]): State['flash'] {
  if (!flash) return null;
  const canonical = new Map(studyQuestions(bank).map(q=>[q.id,q.duplicateOf ?? q.id]));
  const ids = [...new Set(flash.ids.flatMap(id=>canonical.has(id)?[canonical.get(id)!]:[]))];
  if (!ids.length) return null;
  const current = flash.ids.slice(flash.index).find(id=>canonical.has(id));
  const index = current === undefined ? ids.length-1 : ids.indexOf(canonical.get(current)!);
  if (ids.length === flash.ids.length && ids.every((id,i)=>id===flash.ids[i]) && flash.collection === 'mla') return flash;
  return {...flash, ids, index, collection:'mla'};
}
export function toggleChoice(answer: string[], choice: string, required: number) {
  if (answer.includes(choice)) return answer.filter(c => c !== choice);
  if (required === 1) return [choice];
  return answer.length < required ? [...answer, choice].sort() : answer;
}
export function eligibleQuestions(bank: Question[], settings: Settings, state: State, mode: Session['mode'] = 'practice') {
  return bank.filter(q => {
    if (q.collection !== 'mla' || q.duplicateOf !== undefined) return false;
    if (settings.collection && settings.collection !== 'all' && q.collection !== settings.collection) return false;
    if (q.status === 'source' && settings.includeSource === false) return false;
    if (q.status === 'review' && (mode === 'exam' || !settings.includeReview)) return false;
    if (q.status === 'historical' && !settings.includeHistorical) return false;
    if (settings.range !== 'all') { const [min, max] = settings.range.split('-').map(Number); if (q.id < min || q.id > max) return false; }
    if (settings.scope === 'wrong') return questionProgress(q,state)?.latest === false;
    if (settings.scope === 'bookmarked') return hasQuestionMark(q,state.bookmarks);
    if (settings.scope === 'unseen') return !questionProgress(q,state);
    return true;
  });
}
export function shuffle<T>(values: T[], random: () => number = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createSession(pool: Question[], settings: Settings, mode: Session['mode'], now = Date.now()): Session {
  pool = studyQuestions(pool);
  if (!Number.isInteger(settings.count) || settings.count < 1 || settings.count > pool.length) throw new Error('Số câu không hợp lệ.');
  if (mode === 'exam' && (!Number.isFinite(settings.minutes) || settings.minutes < 1 || settings.minutes > 600)) throw new Error('Thời gian thi từ 1 đến 600 phút.');
  const ids = (settings.order === 'random' ? shuffle(pool) : pool).slice(0, settings.count).map(q => q.id);
  return { id: crypto.randomUUID(), mode, questionIds: ids, index: 0, answers: {}, revealed: [], flagged: [], startedAt: now, deadline: mode === 'exam' ? now + settings.minutes * 60000 : null, finishedAt: null, finishReason: null, settings: { ...settings } };
}
export function remainingMs(session: Session, now = Date.now()) { return session.deadline === null ? null : Math.max(0, session.deadline - now); }
export function score(session: Session, bank: Question[]) {
  const eligible = bank.filter(q => session.questionIds.includes(q.id) && q.status !== 'review');
  const correct = eligible.filter(q => isCorrect(q, session.answers[q.id])).length;
  const answered = session.questionIds.filter(id => session.answers[id]?.length).length;
  return { correct, total: eligible.length, answered, skipped: session.questionIds.length - eligible.length, percent: eligible.length ? Math.round(correct / eligible.length * 100) : 0 };
}
export function recordAnswer(state: State, q: Question, answer: string[], now: number): State {
  if (q.status === 'review' || !answer.length) return state;
  const previous = state.progress[q.id] || { attempts: 0, correct: 0, latest: false, lastSeen: 0 };
  const correct = isCorrect(q, answer);
  return { ...state, progress: { ...state.progress, [q.id]: { attempts: previous.attempts + 1, correct: previous.correct + Number(correct), latest: correct, lastSeen: now } } };
}
export function revealAnswer(state: State, q: Question, now = Date.now()): State {
  const session = state.active;
  if (!session || session.mode !== 'practice' || session.settings.feedback !== 'immediate' || session.revealed.includes(q.id) || !session.questionIds.includes(q.id) || session.answers[q.id]?.length !== q.required) return state;
  return { ...recordAnswer(state, q, session.answers[q.id], now), active: { ...session, revealed: [...session.revealed, q.id] } };
}
export function selectAnswer(state: State, q: Question, letter: string, now = Date.now()): State {
  const session = state.active;
  if (!session || session.finishedAt !== null || session.questionIds[session.index] !== q.id || session.revealed.includes(q.id) || !Object.hasOwn(q.choices,letter) || session.deadline !== null && now >= session.deadline) return state;
  const before = session.answers[q.id] || [];
  const answer = toggleChoice(before,letter,q.required);
  if (answer === before) return state;
  const next = {...state, active: {...session, answers: {...session.answers,[q.id]:answer}}};
  return isQuickSession(session) && answer.length === q.required ? revealAnswer(next,q,now) : next;
}
export function finishSession(state: State, bank: Question[], now = Date.now(), reason: 'manual' | 'timeout' = 'manual'): State {
  const active = state.active;
  if (!active || active.finishedAt) return state;
  const finished = { ...active, finishedAt: active.deadline ? Math.min(now, active.deadline) : now, finishReason: reason };
  let next = state;
  for (const q of bank) if (active.questionIds.includes(q.id) && !active.revealed.includes(q.id)) next = recordAnswer(next, q, active.answers[q.id] || [], now);
  return { ...next, active: null, history: [finished, ...state.history.filter(s => s.id !== active.id)].slice(0, 100) };
}
export function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 3600) ? `${Math.floor(seconds / 3600)}:` : ''}${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

// Backups are untrusted inputs. Validate before replacing any local progress.
export function validateState(input: unknown, bank: Question[]): State {
  const fail = (): never => { throw new Error('File tiến trình không hợp lệ hoặc khác phiên bản.'); };
  const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!object(input) || input.version !== 1 || !Number.isFinite(input.updatedAt)) return fail();
  const byId = new Map(validationQuestions(bank).map(q => [q.id, q]));
  const ids = (v: unknown): v is number[] => Array.isArray(v) && v.length <= byId.size && v.every(id => Number.isInteger(id) && byId.has(id)) && new Set(v).size === v.length;
  if (!ids(input.bookmarks) || !ids(input.known) || !object(input.progress)) return fail();
  for (const [id, p] of Object.entries(input.progress)) {
    if (!byId.has(Number(id)) || !object(p) || !Number.isInteger(p.attempts) || Number(p.attempts) < 1 || !Number.isInteger(p.correct) || Number(p.correct) < 0 || Number(p.correct) > Number(p.attempts) || typeof p.latest !== 'boolean' || !Number.isFinite(p.lastSeen)) return fail();
  }
  const session = (v: unknown, finished: boolean) => {
    if (!object(v) || typeof v.id !== 'string' || !v.id || !['practice', 'exam'].includes(String(v.mode)) || !ids(v.questionIds) || !v.questionIds.length || !Number.isInteger(v.index) || Number(v.index) < 0 || Number(v.index) >= v.questionIds.length || !object(v.answers) || !ids(v.revealed) || !ids(v.flagged) || !Number.isFinite(v.startedAt) || !object(v.settings)) return fail();
    const set = new Set(v.questionIds);
    if (![...v.revealed, ...v.flagged].every(id => set.has(id))) return fail();
    if (!['immediate', 'end'].includes(String(v.settings.feedback)) || !['random', 'sequential'].includes(String(v.settings.order)) || !['all', 'wrong', 'bookmarked', 'unseen'].includes(String(v.settings.scope)) || !['all','1-66','67-133','134-200','201-266','267-332',...questionRanges.map(r=>r.value)].includes(String(v.settings.range)) || typeof v.settings.includeReview !== 'boolean' || typeof v.settings.includeHistorical !== 'boolean' || !Number.isInteger(v.settings.count) || v.settings.count !== v.questionIds.length || !Number.isFinite(v.settings.minutes)) return fail();
    if (v.settings.collection !== undefined && !['all','mls','mla'].includes(String(v.settings.collection)) || v.settings.includeSource !== undefined && typeof v.settings.includeSource !== 'boolean') return fail();
    if (v.settings.quick !== undefined && typeof v.settings.quick !== 'boolean') return fail();
    for (const [id, values] of Object.entries(v.answers)) {
      const q = byId.get(Number(id));
      if (!q || !set.has(q.id) || !Array.isArray(values) || values.length > q.required || new Set(values).size !== values.length || values.some(c => typeof c !== 'string' || !Object.hasOwn(q.choices, c))) return fail();
    }
    if (v.mode === 'exam' && (!Number.isFinite(v.deadline) || Number(v.deadline) <= Number(v.startedAt) || v.revealed.length || v.questionIds.some(id => byId.get(id)?.status === 'review'))) return fail();
    if (v.mode === 'practice' && v.deadline !== null) return fail();
    if (finished ? !Number.isFinite(v.finishedAt) || Number(v.finishedAt) < Number(v.startedAt) || !['manual','timeout'].includes(String(v.finishReason)) : v.finishedAt !== null || v.finishReason !== null) return fail();
    return true;
  };
  if (input.active !== null) session(input.active, false);
  if (!Array.isArray(input.history) || input.history.length > 100) return fail();
  input.history.forEach(v => session(v, true));
  if (input.flash !== null && (!object(input.flash) || !ids(input.flash.ids) || !input.flash.ids.length || !Number.isInteger(input.flash.index) || Number(input.flash.index) < 0 || Number(input.flash.index) >= input.flash.ids.length)) return fail();
  if (object(input.flash) && (input.flash.filter !== undefined && !['all','new','known','bookmarked'].includes(String(input.flash.filter)) || input.flash.includeReview !== undefined && typeof input.flash.includeReview !== 'boolean')) return fail();
  if (object(input.flash) && (input.flash.collection !== undefined && !['all','mls','mla'].includes(String(input.flash.collection)) || input.flash.includeSource !== undefined && typeof input.flash.includeSource !== 'boolean')) return fail();
  if (object(input.flash) && input.flash.origin !== undefined && !['all','imported','original'].includes(String(input.flash.origin))) return fail();
  return JSON.parse(JSON.stringify(input)) as State;
}

import { STORAGE_KEY, validateState } from '../domain.ts';
import type { Question, Session, State } from '../domain.ts';
import { attemptKey, cleanRow, composeState, mergeBaseline, newer, sessionKey, validateRow } from './records.ts';
import type { Backup, Baseline, RowKind, StudyRow } from './records.ts';

export const PROFILE_PREFIX = 'ml-profile:v2:';
export const ROW_PREFIX = 'ml-row:v2:';
export const CHANGE_EVENT = 'ml-practice-change';
export type Learner = { id: string; name: string; code: string; shared: boolean; createdAt: number; cloudReady?: boolean };
const memory = new Map<string, string>();
let lastStorageError = '';
const failedKeys = new Set<string>();
export function storageError() { return lastStorageError; }
export function read(key: string) { if (failedKeys.has(key)) return memory.get(key) ?? null; try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; } }
export function write(key: string, value: string) {
  memory.set(key, value);
  try { localStorage.setItem(key, value); failedKeys.delete(key); if (!failedKeys.size) lastStorageError = ''; }
  catch { failedKeys.add(key); lastStorageError = 'Trình duyệt chưa lưu được tiến trình. Hãy xuất bản sao trước khi đóng trang.'; }
}
export function keys(prefix: string) {
  const result = new Set([...memory.keys()].filter(k => k.startsWith(prefix)));
  try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith(prefix)) result.add(key); } } catch { /* Memory remains usable. */ }
  return [...result];
}
export function notifyChange(profileId?: string) { window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {detail: {profileId}})); }
export function getProfiles(): Learner[] {
  return keys(PROFILE_PREFIX).flatMap(key => {
    try { const profile = JSON.parse(read(key)!); return typeof profile.id === 'string' && typeof profile.name === 'string' && typeof profile.code === 'string' ? [profile as Learner] : []; } catch { return []; }
  }).sort((a, b) => a.createdAt - b.createdAt);
}
export function saveProfile(profile: Learner) { write(PROFILE_PREFIX + profile.id, JSON.stringify(profile)); notifyChange(); }
export function createLearner(name: string): Learner {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean || clean.length > 40) throw new Error('Tên người học cần từ 1 đến 40 ký tự.');
  const code = [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join('');
  const learner = { id: crypto.randomUUID(), name: clean, code, shared: false, createdAt: Date.now() };
  saveProfile(learner); return learner;
}
export function tabGet(key: string) { try { return sessionStorage.getItem(key); } catch { return memory.get(`tab:${key}`) || null; } }
export function tabSet(key: string, value: string) { memory.set(`tab:${key}`, value); try { sessionStorage.setItem(key, value); } catch { /* Stay usable with a storage warning. */ } }
// A reload retains the tab identity. New tabs start independent sessions.
let currentWriter = '';
export function getWriter() {
  if (currentWriter) return currentWriter;
  let id = tabGet('ml-tab:v2');
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!id || navigation && navigation.type !== 'reload') { id = crypto.randomUUID(); tabSet('ml-tab:v2', id); }
  currentWriter = id;
  return id;
}
export class ProgressRepository {
  readonly prefix: string;
  readonly activeKey: string;
  readonly learner: Learner;
  readonly bank: Question[];
  readonly writer: string;
  private rowCache = new Map<string, {raw: string | null; row: StudyRow | null}>();
  constructor(learner: Learner, bank: Question[], writer: string) {
    this.learner=learner; this.bank=bank; this.writer=writer;
    this.prefix = `${ROW_PREFIX}${learner.id}:`;
    this.activeKey = `ml-active:v2:${learner.id}`;
  }
  rows(): StudyRow[] {
    return keys(this.prefix).flatMap(key => { const row = this.getRow(key.slice(this.prefix.length)); return row ? [row] : []; });
  }
  private getRow(key: string): StudyRow | null {
    const raw = read(this.prefix + key), cached = this.rowCache.get(key);
    if (cached && cached.raw === raw) return cached.row;
    let row: StudyRow | null = null;
    try { if (raw !== null) { row = JSON.parse(raw); validateRow(row, this.bank); } }
    catch { row = null; lastStorageError = 'Một phần dữ liệu không đọc được. Dữ liệu gốc vẫn được giữ trong trình duyệt.'; }
    this.rowCache.set(key, {raw, row});
    return row;
  }
  state() { return composeState(this.rows(), tabGet(this.activeKey), this.writer, this.bank); }
  put(kind: RowKind, key: string, value: unknown, claim = false) {
    const old = this.getRow(key);
    const row: StudyRow = { key, kind, value, stamp: Math.max(Date.now(), (old?.stamp || 0) + 1), writer: this.writer, dirty: true, claim: claim || Boolean(old?.dirty && old.claim && old.writer === this.writer) };
    validateRow(row, this.bank);
    write(this.prefix + key, JSON.stringify(row));
  }
  update(fn: (state: State) => State, notify = true) {
    const rows = this.rows(), previous = composeState(rows, tabGet(this.activeKey), this.writer, this.bank), next = fn(previous);
    if (previous === next) return false;
    const sessions = new Map(rows.filter(r => r.kind === 'session').map(r => [r.key, r]));
    for (const session of [...next.history, ...(next.active ? [next.active] : [])]) {
      const old = sessions.get(sessionKey(session.id));
      if (JSON.stringify(old?.value) === JSON.stringify(session)) continue;
      if (old && old.writer !== this.writer) continue;
      if ((old?.value as Session | undefined)?.finishedAt != null) continue;
      this.put('session', sessionKey(session.id), session, !old);
    }
    for (const [id, progress] of Object.entries(next.progress)) {
      if (progress.attempts <= (previous.progress[id]?.attempts || 0)) continue;
      const session = previous.active || next.active;
      if (!session) continue;
      const key = attemptKey(session.id, Number(id));
      if (!read(this.prefix + key)) this.put('attempt', key, { questionId: Number(id), sessionId: session.id, correct: progress.latest, lastSeen: progress.lastSeen });
    }
    for (const kind of ['bookmark', 'known'] as const) {
      const before = new Set(kind === 'bookmark' ? previous.bookmarks : previous.known);
      const after = new Set(kind === 'bookmark' ? next.bookmarks : next.known);
      for (const id of new Set([...before, ...after])) if (before.has(id) !== after.has(id)) this.put(kind, `${kind}:${id}`, after.has(id));
    }
    if (JSON.stringify(previous.flash) !== JSON.stringify(next.flash)) this.put('flash', `flash:${this.writer}`, next.flash);
    tabSet(this.activeKey, next.active?.id || '');
    if (notify) notifyChange(this.learner.id);
    return true;
  }
  resume(id: string) {
    const row = this.getRow(sessionKey(id));
    if (!row || (row.value as Session).finishedAt !== null) return;
    this.put('session', row.key, row.value, true); tabSet(this.activeKey, id); notifyChange(this.learner.id);
  }
  mergeRemote(input: unknown, acknowledged?: StudyRow) {
    const row = validateRow(input, this.bank);
    const old = this.getRow(row.key);
    // An acknowledgement must never clear a newer local edit queued during the request.
    if (acknowledged && old?.dirty && (old.stamp !== acknowledged.stamp || old.writer !== acknowledged.writer)) return;
    if (acknowledged || !old || !old.dirty && newer(row, old) || old.dirty && newer(row, old)) {
      write(this.prefix + row.key, JSON.stringify({ ...row, dirty: false }));
    }
  }
  importBackup(backup: Backup | State) {
    if (backup.version === 2) {
      const existing = new Map(this.rows().map(r => [r.key, r]));
      for (const row of backup.rows) {
        const old = existing.get(row.key);
        if (old && !newer(row, old)) continue;
        if ((old?.value as Session | undefined)?.finishedAt != null && row.kind === 'session') continue;
        // Keep the original session owner; resume explicitly claims a running session.
        write(this.prefix + row.key, JSON.stringify({ ...cleanRow(row), dirty: true, claim: true }));
      }
    } else {
      const state = validateState(backup, this.bank);
      const covered: string[] = [];
      for (const session of [...state.history, ...(state.active ? [state.active] : [])]) {
        const key = sessionKey(session.id), existing = this.getRow(key);
        if (!existing) this.put('session', key, session, true);
        for (const [id, answer] of Object.entries(session.answers)) if (answer.length && (session.finishedAt !== null || session.revealed.includes(Number(id)))) covered.push(attemptKey(session.id, Number(id)));
      }
      const baseline = this.getRow('baseline:legacy')?.value as Baseline | undefined;
      this.put('baseline', 'baseline:legacy', mergeBaseline(baseline, { progress: state.progress, covered }));
      for (const id of state.bookmarks) this.put('bookmark', `bookmark:${id}`, true);
      for (const id of state.known) this.put('known', `known:${id}`, true);
      if (state.flash) this.put('flash', `flash:${this.writer}`, state.flash);
    }
    notifyChange(this.learner.id);
  }
  migrateLegacy() {
    const owner = read('ml-legacy-owner:v2'), raw = read(STORAGE_KEY);
    if (owner || !raw) return;
    const state = validateState(JSON.parse(raw), this.bank);
    this.importBackup(state);
    if (state.active) { tabSet(this.activeKey, state.active.id); }
    // The v1 data is deliberately kept for recovery.
    write('ml-legacy-owner:v2', this.learner.id);
  }
  backup(): Backup { return { version: 2, name: this.learner.name, exportedAt: Date.now(), rows: this.rows().map(cleanRow) }; }
  unfinished() { return this.rows().filter(r => r.kind === 'session' && (r.value as Session).finishedAt === null).map(r => r.value as Session).sort((a, b) => b.startedAt - a.startedAt); }
}

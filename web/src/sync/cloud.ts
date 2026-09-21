import { createClient } from '@supabase/supabase-js';
import type { Learner } from './local';
import { getProfiles, notifyChange, saveProfile } from './local';
import type { ProgressRepository } from './local';
import type { StudyRow } from './records';
import type { Session } from '../domain';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();
export const cloudConfigured = Boolean(url && key);
export const supabase = cloudConfigured ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
let signingIn: Promise<void> | null = null;
export function ensureIdentity(): Promise<void> {
  if (!supabase) return Promise.reject(new Error('Chưa cấu hình Supabase.'));
  if (!signingIn) {
    const authenticate = async () => {
      const session = await supabase!.auth.getSession();
      if (session.error) throw session.error;
      if (!session.data.session) {
        const result = await supabase!.auth.signInAnonymously();
        if (result.error) throw new Error('Chưa tạo được phiên học ẩn danh. Kiểm tra Anonymous Sign-Ins trong Supabase.');
      }
    };
    const pending = typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('ml-supabase-identity', authenticate) : authenticate();
    signingIn = pending.finally(() => { signingIn = null; });
  }
  return signingIn;
}
async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('Chưa cấu hình Supabase.');
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export async function registerProfile(profile: Learner) {
  await ensureIdentity();
  const remote = await rpc<{ id: string; name: string; shared: boolean }>('ml_ensure_profile', { p_id: profile.id, p_name: profile.name, p_code: profile.code });
  const current = getProfiles().find(p => p.id === profile.id) || profile;
  const next = { ...current, name: remote.name, shared: remote.shared, cloudReady: true };
  if (JSON.stringify(current) !== JSON.stringify(next)) saveProfile(next);
  return next;
}
export async function restoreProfile(code: string) {
  const clean = code.trim().replace(/^.*#\/join\//, '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(clean)) throw new Error('Mã tiếp tục không hợp lệ. Hãy dán toàn bộ mã hoặc link của hồ sơ.');
  await ensureIdentity();
  const remote = await rpc<{ id: string; name: string; shared: boolean; created_at: string }>('ml_restore_profile', { p_code: clean });
  const profile: Learner = { id: remote.id, name: remote.name, code: clean, shared: remote.shared, createdAt: Date.parse(remote.created_at), cloudReady: true };
  saveProfile(profile); return profile;
}
export async function changeSharing(profile: Learner, shared: boolean) {
  if (cloudConfigured) {
    await registerProfile(profile);
    await rpc('ml_set_sharing', { p_id: profile.id, p_shared: shared });
  }
  saveProfile({ ...(getProfiles().find(p=>p.id===profile.id)||profile), shared });
}
export async function syncRepository(repo: ProgressRepository, pull: boolean) {
  await registerProfile(repo.learner);
  const dirty = repo.rows().filter(r => r.dirty);
  for (let offset = 0; offset < dirty.length; offset += 80) {
    const batch = dirty.slice(offset, offset + 80);
    const returned = await rpc<StudyRow[]>('ml_push_rows', { p_profile_id: repo.learner.id, p_rows: batch });
    for (const row of returned) repo.mergeRemote(row, batch.find(r => r.key === row.key));
  }
  if (pull) {
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await supabase!.from('ml_records').select('key,kind,value,stamp,writer').eq('profile_id', repo.learner.id).order('key').range(offset, offset + 499);
      if (error) throw new Error(error.message);
      for (const row of data || []) repo.mergeRemote(row);
      if (!data || data.length < 500) break;
    }
  }
  notifyChange();
}
export type SharedLearner = { id: string; name: string; sessions: number; latest: string | null };
export async function sharedProfiles(): Promise<SharedLearner[]> { await ensureIdentity(); return rpc('ml_shared_profiles'); }
export async function sharedHistory(id: string): Promise<Session[]> { await ensureIdentity(); return rpc('ml_shared_history', { p_id: id }); }

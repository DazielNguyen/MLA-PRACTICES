import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Question, State } from './domain';
import { CHANGE_EVENT, getProfiles, getWriter, notifyChange, ProgressRepository, storageError as getStorageError, tabGet, tabSet } from './sync/local';
import type { Learner } from './sync/local';
import { cloudConfigured, syncRepository } from './sync/cloud';

export function useLearners() {
  const [profiles, setProfiles] = useState(getProfiles);
  const [selected, setSelected] = useState(() => tabGet('ml-selected:v2') || '');
  useEffect(() => {
    const changed = () => setProfiles(getProfiles());
    window.addEventListener(CHANGE_EVENT, changed); window.addEventListener('storage', changed);
    return () => { window.removeEventListener(CHANGE_EVENT, changed); window.removeEventListener('storage', changed); };
  }, []);
  const select = (id: string) => { tabSet('ml-selected:v2', id); setSelected(id); notifyChange(); };
  return { profiles, learner: profiles.find(p => p.id === selected) || null, select };
}
export function useProgress(bank: Question[], learner: Learner) {
  const repo = useMemo(() => new ProgressRepository(learner, bank, getWriter()), [learner.id, bank]);
  const [state, setState] = useState(() => repo.state());
  const [storageError, setStorageError] = useState(getStorageError);
  const [cloudStatus, setCloudStatus] = useState(cloudConfigured ? 'pending' : 'local');
  const [cloudError, setCloudError] = useState('');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const mounted = useRef(false), running = useRef(false), lastPull = useRef(0), retryAt = useRef(0);
  const refresh = useCallback(() => { setState(repo.state()); setStorageError(getStorageError()); }, [repo]);
  const sync = useCallback(async (force = false) => {
    if (!cloudConfigured || running.current || !force && Date.now() < retryAt.current) return;
    running.current = true; setCloudStatus('syncing'); setCloudError('');
    try {
      const pull = force || Date.now() - lastPull.current > 30000;
      await syncRepository(repo, pull);
      if (!mounted.current) return;
      if (pull) lastPull.current = Date.now();
      retryAt.current = 0;
      const pending = repo.rows().some(r => r.dirty);
      setCloudStatus(pending ? 'pending' : 'synced'); setLastSynced(Date.now()); refresh();
    } catch (error) {
      if (!mounted.current) return;
      retryAt.current = Date.now() + 15000;
      setCloudStatus('error'); setCloudError(error instanceof Error ? error.message : 'Không kết nối được Supabase.');
    } finally { running.current = false; }
  }, [repo, refresh]);
  useEffect(() => {
    mounted.current = true;
    const changed = () => { refresh(); };
    window.addEventListener(CHANGE_EVENT, changed); window.addEventListener('storage', changed);
    const reconnect = () => { void sync(true); };
    window.addEventListener('online', reconnect); window.addEventListener('focus', reconnect);
    void sync(true);
    const interval = window.setInterval(() => { void sync(); }, 15000);
    return () => { mounted.current = false; window.removeEventListener(CHANGE_EVENT, changed); window.removeEventListener('storage', changed); window.removeEventListener('online', reconnect); window.removeEventListener('focus', reconnect); clearInterval(interval); };
  }, [refresh, sync]);
  useEffect(() => {
    if (!cloudConfigured || !repo.rows().some(r => r.dirty)) return;
    const timeout = window.setTimeout(() => { void sync(); }, 700);
    return () => clearTimeout(timeout);
  }, [state.updatedAt, sync, repo]);
  const update = useCallback((fn: (s: State) => State) => { repo.update(fn); refresh(); if (cloudConfigured && repo.rows().some(r=>r.dirty)) setCloudStatus('pending'); }, [repo, refresh]);
  return { state, update, storageError, repo, cloudStatus, cloudError, lastSynced, sync: () => sync(true) };
}

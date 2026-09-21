import { useCallback, useEffect, useState } from 'react';
import { emptyState, STORAGE_KEY, validateState } from './domain';
import type { Question, State } from './domain';

export function useProgress(bank: Question[]) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return { state: raw ? validateState(JSON.parse(raw), bank) : emptyState(), error: '' };
    } catch { return { state: emptyState(), error: 'Không đọc được tiến trình đã lưu. Hãy khôi phục bản sao hoặc cho phép trình duyệt lưu dữ liệu.' }; }
  });
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const update = useCallback((fn: (s: State) => State) => {
    setState(previous => {
      const next = fn(previous);
      return next === previous ? previous : { ...next, updatedAt: Math.max(Date.now(), previous.updatedAt + 1) };
    });
  }, []);
  useEffect(() => {
    if (!state.updatedAt) return;
    try {
      // Preserve an unreadable prior save before the first overwrite.
      if (initial.error) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && !localStorage.getItem(`${STORAGE_KEY}:recovery`)) localStorage.setItem(`${STORAGE_KEY}:recovery`, raw);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError('');
    } catch { setStorageError('Trình duyệt chưa lưu được tiến trình. Hãy xuất bản sao trước khi đóng trang.'); }
  }, [state, initial.error]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try { const next = validateState(JSON.parse(event.newValue), bank); setState(prev => next.updatedAt > prev.updatedAt ? next : prev); } catch { /* Keep this tab's valid state. */ }
    };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [bank]);
  return { state, update, storageError };
}

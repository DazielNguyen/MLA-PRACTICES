import { createContext, lazy, Suspense, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import './assistant.css';

export type AssistantTopic = { kind: 'question'; id: number; label: string } | { kind: 'keyword'; id: string; label: string };
const Chat = lazy(() => import('./StudyAssistant'));
type AssistantActions = { ask: (topic?: AssistantTopic) => void; setBlocked: (value: boolean) => void; blocked: boolean };
const AssistantContext = createContext<AssistantActions | null>(null);

export function AssistantProvider({ learnerId, children }: { learnerId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false), [blocked, setBlocked] = useState(false);
  const [topic, setTopic] = useState<AssistantTopic>();
  const ask = (next?: AssistantTopic) => { if (blocked) return; if (next) setTopic(next); setLoaded(true); setOpen(true); };
  useEffect(() => { if (blocked) setOpen(false); }, [blocked]);
  return <AssistantContext.Provider value={{ ask, setBlocked, blocked }}>
    {children}
    <button className="assistant-launcher" onClick={() => ask()} disabled={blocked} title={blocked ? 'Trợ lý mở lại sau khi nộp bài hoặc rời chế độ tự kiểm tra.' : 'Hỏi trợ lý MLA'} aria-label="Mở trợ lý AI"><MessageCircle size={20}/><span>Trợ lý AI</span></button>
    {loaded && <Suspense fallback={<div className="assistant-loading" role="status">Đang mở trợ lý…</div>}><Chat key={`${learnerId}:${topic?.kind}:${topic?.id}`} learnerId={learnerId} topic={topic} open={open && !blocked} close={() => setOpen(false)} clearTopic={() => setTopic(undefined)}/></Suspense>}
  </AssistantContext.Provider>;
}
export function useAssistantGuard(blocked: boolean) {
  const setBlocked = useContext(AssistantContext)?.setBlocked;
  useEffect(() => { setBlocked?.(blocked); return () => setBlocked?.(false); }, [blocked, setBlocked]);
}
export function AskAssistant({ topic }: { topic: AssistantTopic }) {
  const assistant = useContext(AssistantContext);
  if (!assistant || assistant.blocked) return null;
  return <button type="button" className="ask-assistant" onClick={() => assistant.ask(topic)}><Sparkles size={14}/>Hỏi AI về {topic.kind === 'question' ? 'câu này' : 'nội dung này'}</button>;
}

import { createContext, lazy, Suspense, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import { topicKey } from './assistant-topic';
import type { AssistantTopic } from './assistant-topic';
import './assistant.css';

export type { AssistantTopic } from './assistant-topic';
const Chat = lazy(() => import('./StudyAssistant'));
type AssistantActions = { ask: (topic?: AssistantTopic) => void; setCurrentTopic: (topic?: AssistantTopic) => void; setBlocked: (value: boolean) => void; blocked: boolean };
const AssistantContext = createContext<AssistantActions | null>(null);

export function AssistantProvider({ learnerId, children }: { learnerId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false), [loaded, setLoaded] = useState(false), [blocked, setBlocked] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<AssistantTopic>();
  const [override, setOverride] = useState<{ anchor: string; topic?: AssistantTopic }>();
  const currentKey = topicKey(currentTopic);
  const anchor = `${currentKey}:${currentTopic?.study?.page || ''}`;
  const topic = override?.anchor === anchor ? override.topic : currentTopic;
  const embedded = Boolean(currentTopic) && !blocked;
  const ask = (next?: AssistantTopic) => {
    if (blocked) return;
    // Inline buttons keep the current attempt, and the launcher always follows the page.
    setOverride(next && topicKey(next) !== currentKey ? { anchor, topic: next } : undefined);
    setLoaded(true); setOpen(!embedded);
    if (embedded) requestAnimationFrame(() => {
      const panel = document.querySelector<HTMLElement>('.assistant-embedded');
      panel?.scrollIntoView({block:'nearest'});
      panel?.querySelector<HTMLElement>('.assistant-unlock input, textarea:not(:disabled)')?.focus({preventScroll:true});
    });
  };
  useEffect(() => { if (blocked || embedded) setOpen(false); }, [blocked, embedded]);
  const chat = (loaded || embedded) && <Suspense fallback={<div className={embedded?'assistant-notice':'assistant-loading'} role="status">Đang mở trợ lý…</div>}><Chat key={`${learnerId}:${topicKey(topic)}`} learnerId={learnerId} topic={topic} embedded={embedded} open={(embedded || open) && !blocked} close={() => setOpen(false)} clearTopic={() => setOverride({ anchor })}/></Suspense>;
  return <AssistantContext.Provider value={{ ask, setCurrentTopic, setBlocked, blocked }}>
    <div className={`assistant-workspace ${embedded?'with-assistant':''}`}>
      <div className="assistant-page">{children}</div>
      {embedded && <aside className="assistant-inline-rail" aria-label="Trợ lý trong trang học">{chat}</aside>}
    </div>
    {!embedded && <><button className="assistant-launcher" onClick={() => ask()} disabled={blocked} title={blocked ? 'Trợ lý mở lại sau khi nộp bài hoặc rời chế độ tự kiểm tra.' : 'Hỏi trợ lý MLA'} aria-label="Mở trợ lý AI"><MessageCircle size={20}/><span>Trợ lý AI</span></button>{chat}</>}
  </AssistantContext.Provider>;
}
// Exactly one page owns the visible study context. Do not register hidden list rows.
export function useAssistantTopic(topic?: AssistantTopic) {
  const setCurrentTopic = useContext(AssistantContext)?.setCurrentTopic;
  const serialized = JSON.stringify(topic ?? null);
  useEffect(() => {
    setCurrentTopic?.(JSON.parse(serialized) ?? undefined);
    return () => setCurrentTopic?.(undefined);
  }, [serialized, setCurrentTopic]);
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

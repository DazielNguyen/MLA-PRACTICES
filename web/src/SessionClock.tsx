import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Session } from './domain';
import { formatTime, remainingMs } from './domain';

export default function SessionClock({session}:{session:Session}) {
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{
    const tick=()=>setNow(Date.now());
    const timer=setInterval(tick,1000);
    window.addEventListener('focus',tick);
    return()=>{clearInterval(timer);window.removeEventListener('focus',tick);};
  },[]);
  const remaining=remainingMs(session,now);
  return <div className={`session-timer ${remaining!==null&&remaining<300000?'urgent':''}`} role="timer" aria-label={remaining!==null?'Thời gian còn lại':'Thời gian đã học'}>
    <Clock3 size={19}/><div><small>{remaining!==null?'CÒN LẠI':'ĐÃ HỌC'}</small><strong>{formatTime(remaining??now-session.startedAt)}</strong></div>
  </div>;
}

import { useMemo, useState } from 'react';
import { ArrowRight, Images } from 'lucide-react';
import type { Question, Session, Settings, State } from './domain';
import { defaultSettings, eligibleQuestions, matchesOrigin, validPrioritySettings } from './domain';
import { focusedQuestions, formatLabels, questionFormats } from './question-formats';
import type { QuestionFormat } from './question-formats';
import { QuestionCards } from './Library';
import { Empty } from './components';
import { StudyPriorityOptions, StudyPriorityPreview, StudyScopeSelect } from './StudyPriority';

export default function FocusedPractice({bank,state,update,start}:{bank:Question[];state:State;update:(fn:(s:State)=>State)=>void;start:(settings:Settings,mode:Session['mode'],ids:number[])=>void}) {
  const [format,setFormat]=useState<QuestionFormat|'all'>('all'),[origin,setOrigin]=useState('all');
  const [priority,setPriority]=useState<Settings>({...defaultSettings});
  const updatePriority=(patch:Partial<Settings>)=>setPriority(s=>({...s,...patch}));
  const [count,setCount]=useState(10),[mode,setMode]=useState('quick');
  const all=useMemo(()=>focusedQuestions(bank),[bank]);
  const pool=eligibleQuestions(all.filter(q=>matchesOrigin(q,origin)&&(format==='all'||questionFormats(q).includes(format))),priority,state);
  const size=Math.min(count,pool.length);
  const valid=validPrioritySettings(priority)&&Number.isInteger(size)&&size>0;
  return <div className="page focused-page">
    <div className="page-heading"><div className="eyebrow">ÔN RIÊNG DẠNG CÂU KHÓ</div><h1>Ảnh & ghép từ</h1><p>{all.length} câu trong bộ {bank.length} câu · Giữ nguyên nguồn, đáp án và lịch sử học.</p></div>
    <a className="button secondary focused-exam-link" href="#/exam?set=focused">Thi thử bộ {all.length} câu này <ArrowRight size={17}/></a>
    <section className="panel focused-setup" aria-label="Thiết lập ôn ảnh và ghép từ">
      <div className="section-heading"><h2><Images size={20}/> Chọn phần cần ôn</h2></div>
      <div className="focused-formats" aria-label="Dạng câu hỏi">
        <button type="button" aria-pressed={format==='all'} onClick={()=>setFormat('all')}>Tất cả <b>{all.length}</b></button>
        {(Object.keys(formatLabels) as QuestionFormat[]).map(value=><button type="button" key={value} aria-pressed={format===value} onClick={()=>setFormat(value)}>{formatLabels[value]} <b>{all.filter(q=>questionFormats(q).includes(value)).length}</b></button>)}
      </div>
      <p className="subtle">Một câu có thể vừa có ảnh vừa thuộc dạng ghép hoặc sắp xếp. Câu đã chuyển ảnh sang chữ cũng được đưa vào đây. Chọn phương án chứa toàn bộ tổ hợp đúng.</p>
      <div className="focused-fields">
        <label>Nguồn đề<select value={origin} onChange={e=>setOrigin(e.target.value)}><option value="all">Tất cả nguồn</option><option value="imported">Bộ 286 · 242 câu sau gộp</option><option value="udemy">Udemy · 195 câu</option></select></label>
        <StudyScopeSelect settings={priority} onChange={updatePriority}/>
        <label>Số câu mỗi phiên<input type="number" min={1} max={pool.length||1} value={size} onChange={e=>setCount(e.target.valueAsNumber||0)}/></label>
        <label>Cách học<select value={mode} onChange={e=>setMode(e.target.value)}><option value="quick">Học nhanh · chọn là chấm</option><option value="immediate">Xem đáp án sau khi kiểm tra</option><option value="end">Tự kiểm tra · ẩn đáp án</option></select></label>
      </div>
      <StudyPriorityOptions settings={priority} onChange={updatePriority}/>
      <StudyPriorityPreview pool={pool} state={state} settings={priority}/>
      <div className="focused-actions"><div className="preset-row"><button type="button" disabled={!pool.length} onClick={()=>setCount(Math.min(10,pool.length))}>Ôn 10 câu</button><button type="button" disabled={!pool.length} onClick={()=>setCount(pool.length)}>Ôn toàn bộ {pool.length} câu</button></div><button className="button primary" disabled={!valid} onClick={()=>start({...priority,count:size,quick:mode==='quick',feedback:mode==='end'?'end':'immediate'},'practice',pool.map(q=>q.id))}>Bắt đầu ôn {size} câu <ArrowRight size={17}/></button></div>
      <p className="subtle">{priority.order==='priority'?'Thứ tự ưu tiên theo lịch sử trả lời.':'Thứ tự ngẫu nhiên.'} Tiến trình và số lần đúng/sai dùng chung với các chế độ học khác.</p>
    </section>
    <div className="section-heading focused-list-heading"><h2>{pool.length} câu phù hợp</h2><span>Mở câu để xem ảnh, nội dung và giải thích tiếng Việt</span></div>
    {pool.length?<QuestionCards questions={pool} state={state} update={update} showFormats/>:<Empty title="Không có câu phù hợp">Thay đổi dạng câu, nguồn đề hoặc ưu tiên ôn để xem thêm.</Empty>}
  </div>;
}

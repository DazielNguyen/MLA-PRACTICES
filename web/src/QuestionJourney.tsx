import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import type { Question, State } from './domain';
import { matchesOrigin, sourceLabel } from './domain';
import { accuracyLabel, questionStatistics, rankMistakes } from './question-statistics';
import type { Mastery } from './question-statistics';
const levels:{value:Mastery;label:string}[]=[
  {value:'strong',label:'Trên 80%'},{value:'building',label:'50–80%'},{value:'low',label:'Trên 0%, dưới 50%'},
  {value:'never-correct',label:'Đã sai, chưa đúng'},{value:'unseen',label:'Chưa trả lời'},
];
export default function QuestionJourney({bank,state,go}:{bank:Question[];state:State;go:(path:string)=>void}) {
  const [origin,setOrigin]=useState('all'),[level,setLevel]=useState('all'),[neverCorrect,setNeverCorrect]=useState(false),[page,setPage]=useState(0);
  const all=useMemo(()=>questionStatistics(bank,state),[bank,state]);
  const stats=all.filter(s=>matchesOrigin(s.question,origin));
  const attempted=stats.filter(s=>s.attempts>0).length;
  const coverage=stats.length?Math.round(attempted/stats.length*100):0;
  const visible=stats.filter(s=>level==='all'||s.mastery===level);
  const ranked=rankMistakes(stats,neverCorrect),pages=Math.max(1,Math.ceil(ranked.length/10)),current=Math.min(page,pages-1);
  const open=(id:number)=>go(`/library?question=${id}`);
  return <section className="panel progress-panel question-journey" aria-label="Hành trình theo tỷ lệ đúng">
    <div className="section-heading"><h2>Hành trình của bạn</h2><Flag size={18}/></div>
    <div className="journey-filters"><label>Bộ đề<select aria-label="Bộ đề trong bản đồ" value={origin} onChange={e=>{setOrigin(e.target.value);setPage(0);}}><option value="all">Tất cả bộ đề</option><option value="imported">Bộ 286 · 242 câu</option><option value="udemy">Udemy · 195 câu</option></select></label><label>Tỷ lệ đúng<select aria-label="Lọc màu bản đồ" value={level} onChange={e=>setLevel(e.target.value)}><option value="all">Mọi mức độ</option>{levels.map(l=><option value={l.value} key={l.value}>{l.label}</option>)}</select></label></div>
    <div className="progress-caption"><strong>{attempted}<span> / {stats.length} câu đã trả lời</span></strong><span>{coverage}%</span></div>
    <div className="progress-track"><div style={{width:`${coverage}%`}}/></div>
    <p className="journey-description">Mỗi ô là một câu. Màu dựa trên số lần đúng / tổng lượt trả lời, không dự báo kết quả thi. Bấm số câu để mở nội dung.</p>
    <div className="mastery-grid" aria-label="Bản đồ tỷ lệ đúng từng câu">{visible.map(s=>{
      const label=`Câu #${s.question.id} · ${sourceLabel(s.question)} · Đúng ${s.correct} · Sai ${s.wrong} · ${accuracyLabel(s.rate)} (${s.attempts} lượt)`;
      return <button key={s.question.id} type="button" className={`mastery-cell ${s.mastery}`} data-question-id={s.question.id} title={label} aria-label={label} onClick={()=>open(s.question.id)}>{s.question.id}</button>;
    })}</div>
    {!visible.length&&<p className="journey-empty" role="status">Chưa có câu nào ở mức này.</p>}
    <div className="mastery-legend">{levels.map(l=><span key={l.value}><i className={`mastery-cell ${l.value}`} aria-hidden="true"/>{l.label}</span>)}</div>
    <p className="journey-note">Hiển thị {visible.length} câu. Dấu “đã thuộc” không thay đổi tỷ lệ đúng. Tỷ lệ cao với ít lượt trả lời vẫn cần ôn thêm.</p>
    <div className="mistake-section"><h3>Câu cần ưu tiên ôn</h3>
      <div className="mistake-tabs" aria-label="Danh sách câu sai"><button type="button" aria-pressed={!neverCorrect} onClick={()=>{setNeverCorrect(false);setPage(0);}}>Sai nhiều nhất ({rankMistakes(stats).length})</button><button type="button" aria-pressed={neverCorrect} onClick={()=>{setNeverCorrect(true);setPage(0);}}>Chưa từng đúng ({rankMistakes(stats,true).length})</button></div>
      <p className="journey-note">Xếp theo số lần sai giảm dần{neverCorrect?' · Chỉ gồm câu đã sai và có 0 lần đúng.':'.'}</p>
      {ranked.length?<><div className="mistake-table-wrap"><table className="mistake-table"><caption className="sr-only">{neverCorrect?'Câu đã sai nhưng chưa từng đúng':'Câu sai nhiều nhất'}</caption><thead><tr><th scope="col">Câu hỏi</th><th scope="col">Sai</th><th scope="col">Đúng</th><th scope="col">Tỷ lệ đúng</th></tr></thead><tbody>{ranked.slice(current*10,current*10+10).map(s=><tr key={s.question.id} data-question-id={s.question.id}><th scope="row"><button type="button" onClick={()=>open(s.question.id)} aria-label={`Mở câu #${s.question.id}`}><strong>#{s.question.id}</strong><small>{sourceLabel(s.question)}</small></button></th><td className="wrong-count">{s.wrong}</td><td>{s.correct}</td><td><span className={`mastery-rate ${s.mastery}`}>{accuracyLabel(s.rate)}</span></td></tr>)}</tbody></table></div>{pages>1&&<div className="mistake-pagination"><button className="button secondary small" disabled={!current} onClick={()=>setPage(current-1)} aria-label="Trang câu sai trước"><ArrowLeft size={14}/></button><span>Trang {current+1} / {pages}</span><button className="button secondary small" disabled={current===pages-1} onClick={()=>setPage(current+1)} aria-label="Trang câu sai tiếp"><ArrowRight size={14}/></button></div>}</>:<p className="journey-empty" role="status">{neverCorrect?'Không có câu đã sai mà chưa từng trả lời đúng.':'Chưa ghi nhận lượt trả lời sai.'}</p>}
    </div>
  </section>;
}

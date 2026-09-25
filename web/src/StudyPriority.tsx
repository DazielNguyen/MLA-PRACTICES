import type { Question, Settings, State } from './domain';
import { isPerformanceScope, questionProgress, sourceLabel, validPrioritySettings } from './domain';

type Props={settings:Settings;onChange:(patch:Partial<Settings>)=>void};
export function StudyScopeSelect({settings,onChange}:Props) {
  return <label>Ưu tiên ôn<select aria-label="Ưu tiên ôn" value={settings.scope} onChange={e=>{
    const scope=e.target.value as Settings['scope'];
    onChange({scope,order:isPerformanceScope(scope)?'priority':settings.order==='priority'?'random':settings.order});
  }}>
    <option value="all">Tất cả câu hỏi</option>
    <option value="low-accuracy">Tỷ lệ đúng thấp</option>
    <option value="high-error">Tỷ lệ sai cao</option>
    <option value="most-wrong">Sai nhiều nhất · tổng số lần sai</option>
    <option value="never-correct">Đã sai, chưa từng đúng</option>
    <option value="wrong">Câu trả lời sai gần nhất</option>
    <option value="bookmarked">Câu đã lưu</option>
    <option value="unseen">Chưa có lượt chấm</option>
  </select></label>;
}

export function StudyPriorityOptions({settings,onChange}:Props) {
  if (!isPerformanceScope(settings.scope)) return null;
  const low=settings.scope==='low-accuracy',high=settings.scope==='high-error';
  const threshold=low?settings.accuracyMax??80:settings.errorMin??50;
  const setThreshold=(value:number)=>onChange(low?{accuracyMax:value}:{errorMin:value});
  return <div className="study-priority-options">
    <div className="priority-fields">
      {(low||high)&&<label>{low?'Tỷ lệ đúng tối đa (%)':'Tỷ lệ sai tối thiểu (%)'}<input type="number" min={0} max={100} step={1} value={threshold} onChange={e=>setThreshold(e.target.valueAsNumber||0)}/></label>}
      <label>Số lượt trả lời tối thiểu<input type="number" min={1} max={10000} step={1} value={settings.minAttempts??1} onChange={e=>onChange({minAttempts:e.target.valueAsNumber||0})}/></label>
    </div>
    {(low||high)&&<div className="preset-row" aria-label="Ngưỡng phần trăm">{(low?[50,70,80,90]:[20,50,80,100]).map(value=><button type="button" key={value} aria-pressed={value===threshold} className={value===threshold?'selected':''} onClick={()=>setThreshold(value)}>{value}%</button>)}</div>}
    <p>{low?`Chỉ lấy câu có tỷ lệ đúng ≤ ${threshold}%.`:high?`Chỉ lấy câu đã sai, có tỷ lệ sai ≥ ${threshold}%.`:settings.scope==='most-wrong'?'Chỉ lấy câu từng trả lời sai.':'Chỉ lấy câu đã sai và chưa có lần trả lời đúng.'} Tính trên toàn bộ lượt đã chấm; câu chưa trả lời được tách riêng.</p>
    <p>{settings.order==='priority'?(settings.scope==='most-wrong'?'Lấy câu có số lần sai nhiều nhất trước.':'Lấy câu có tỷ lệ đúng thấp nhất trước; nếu bằng nhau, ưu tiên số lần sai nhiều hơn.'):'Lấy câu theo thứ tự bạn chọn bên dưới.'} Đây là tỷ lệ đã học, không dự báo kết quả lần sau.</p>
    {!validPrioritySettings(settings)&&<p className="field-error" role="alert">Nhập phần trăm nguyên từ 0 đến 100 và số lượt nguyên từ 1 đến 10.000.</p>}
  </div>;
}

export function StudyPriorityPreview({pool,state,settings}:{pool:Question[];state:State;settings:Settings}) {
  if (!isPerformanceScope(settings.scope)||!pool.length) return null;
  return <details className="priority-preview"><summary>Xem tỷ lệ các câu trong bộ lọc</summary>
    <p>Hiển thị {Math.min(5,pool.length)} / {pool.length} câu theo thứ tự bộ lọc. Khi chọn ngẫu nhiên, phiên học có thể lấy câu khác.</p>
    <div className="priority-table-wrap"><table><thead><tr><th>Câu</th><th>Đúng / Lượt</th><th>Đúng</th><th>Sai</th></tr></thead><tbody>{pool.slice(0,5).map(q=>{
      const p=questionProgress(q,state)!;
      const correct=p.correct/p.attempts*100,wrong=(p.attempts-p.correct)/p.attempts*100;
      return <tr key={q.id}><th scope="row">#{q.id}<small>{sourceLabel(q)}</small></th><td>{p.correct} / {p.attempts}</td><td>{Number(correct.toFixed(1))}%</td><td>{Number(wrong.toFixed(1))}%</td></tr>;
    })}</tbody></table></div>
  </details>;
}

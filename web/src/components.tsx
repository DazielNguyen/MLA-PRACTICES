import { Bookmark, Check, ExternalLink, Flag, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Question } from './domain';

export function Tag({ status }: { status: Question['status'] }) {
  return <span className={`tag ${status}`}>{status === 'checked' ? <><Check size={12} /> Đã đối chiếu</> : status === 'historical' ? 'Dịch vụ cũ' : 'Cần xác minh'}</span>;
}
export function QuestionImages({ question, slot = 'question' }: { question: Question; slot?: string }) {
  return <>{question.images.filter(im => im.slot === slot).map(im => <a className="question-image" key={im.url} href={im.url} target="_blank" rel="noreferrer" aria-label="Mở hình câu hỏi ở kích thước đầy đủ"><img src={im.url} alt={im.alt} loading="lazy" /><span>Mở hình đầy đủ <ExternalLink size={11} /></span></a>)}</>;
}
export function QuestionText({ question }: { question: Question }) {
  return <><p className="question-text" lang="en">{question.text}</p><QuestionImages question={question} />{question.notes.some(note => note.includes('unit')) && <p className="notice"><Info size={15} /> Đơn vị dung lượng trong PDF bị lỗi, đã giữ nguyên ghi chú thay vì đoán đơn vị.</p>}</>;
}
export function Explanation({ question, selected }: { question: Question; selected?: string[] }) {
  const unscored = question.status === 'review';
  return <div className={`explanation ${unscored ? 'uncertain' : ''}`}>
    <div className="explanation-title"><span className="answer-label">{unscored ? 'CHƯA CHỐT ĐÁP ÁN' : `ĐÁP ÁN ${question.answer.join(' + ')}`}</span>{selected && <span className="muted">Bạn chọn: {selected.join(', ') || 'Chưa trả lời'}</span>}</div>
    {!unscored && <div className="correct-answer-text" lang="en">{question.answer.map(a => <p key={a}><strong>{a}.</strong> {question.choices[a]}</p>)}</div>}
    {unscored && question.answer.length > 0 && <p>Phương án tham khảo có điều kiện: <strong>{question.answer.join(', ')}</strong>. Câu này không tính điểm.</p>}
    <p>{question.explanation}</p>
    <details className="source-list"><summary>Tài liệu đối chiếu · PDF trang {question.page}</summary>{question.sources.map(s => <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>{s.title}<ExternalLink size={12} /></a>)}</details>
  </div>;
}
export function ChoiceList({ question, selected, onSelect, revealed = false, disabled = false }: { question: Question; selected: string[]; onSelect?: (letter: string) => void; revealed?: boolean; disabled?: boolean }) {
  return <div className="choices" role="group" aria-label={`Chọn ${question.required} đáp án`}>
    {Object.entries(question.choices).map(([letter, text]) => {
      const chosen = selected.includes(letter), correct = revealed && question.status !== 'review' && question.answer.includes(letter);
      const wrong = revealed && question.status !== 'review' && chosen && !correct;
      return <div key={letter} className={`choice ${chosen ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}>
        <button type="button" aria-pressed={chosen} disabled={disabled} onClick={() => onSelect?.(letter)} className="choice-button">
          <span className={`choice-letter ${question.required > 1 ? 'square' : ''}`}>{correct ? <Check size={16} /> : wrong ? <X size={16} /> : letter}</span>
          <span lang="en">{text}</span><span className="choice-indicator">{chosen ? <Check size={16} /> : null}</span>
        </button>
        {question.images.some(im => im.slot === letter) && <div className="choice-picture"><QuestionImages question={question} slot={letter} /></div>}
      </div>;
    })}
  </div>;
}
export function IconToggle({ active, onClick, kind = 'bookmark' }: { active: boolean; onClick: () => void; kind?: 'bookmark' | 'flag' }) {
  const Icon = kind === 'bookmark' ? Bookmark : Flag;
  const label = kind === 'bookmark' ? (active ? 'Bỏ lưu câu hỏi' : 'Lưu câu hỏi') : (active ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại');
  return <button className={`icon-button ${active ? 'is-active' : ''}`} aria-label={label} title={label} aria-pressed={active} onClick={onClick}><Icon size={18} fill={active ? 'currentColor' : 'none'} /></button>;
}
export function Dialog({ title, children, confirmLabel, onConfirm, onClose }: { title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="dialog" onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="dialog-title"><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Đóng hộp thoại" onClick={onClose}><X size={20} /></button></div><div className="dialog-body">{children}</div><div className="dialog-actions"><button className="button secondary" onClick={onClose}>Quay lại</button><button className="button primary" onClick={onConfirm}>{confirmLabel}</button></div></dialog>;
}
export function Empty({ title, children }: { title: string; children: ReactNode }) { return <div className="empty"><div className="empty-symbol">↗</div><h3>{title}</h3><p>{children}</p></div>; }

import { Bookmark, Check, ExternalLink, Flag, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Question, State } from './domain';
import { questionProgress, sourceLabel } from './domain';
import StudyText from './StudyText';
import { AskAssistant } from './assistant-context';

export function Tag({ status }: { status: Question['status'] }) {
  return <span className={`tag ${status}`}>{status === 'checked' ? <><Check size={12} /> Đã đối chiếu</> : status === 'historical' ? 'Dịch vụ cũ' : status === 'source' ? 'Theo đáp án bộ đề' : 'Cần xác minh'}</span>;
}
export function OriginTag({ question }: { question: Question }) {
  return question.origin === 'udemy' ? <span className="tag udemy">Udemy</span> : null;
}
export function QuestionAnswerStats({ question, state, live = false }: { question: Question; state: State; live?: boolean }) {
  const progress = questionProgress(question, state);
  const correct = progress?.correct ?? 0, wrong = (progress?.attempts ?? 0) - correct;
  return <span className="question-answer-stats" role="group" aria-label={`Lịch sử trả lời câu #${question.id}`} aria-live={live ? 'polite' : undefined} aria-atomic={live || undefined} title="Cộng dồn các lượt trả lời đã chấm. Chuyển câu hoặc tải lại không cộng lượt; câu bỏ trống không tính lượt.">
      <span className="answer-count-label">Lịch sử trả lời</span>
      <span className="answer-count-correct"><Check size={13}/>Đúng <b>{correct}</b> lần</span>
      <span className="answer-count-wrong"><X size={13}/>Sai <b>{wrong}</b> lần</span>
  </span>;
}
export function QuestionImages({ question, slot = 'question' }: { question: Question; slot?: string }) {
  return <>{question.images.filter(im => im.slot === slot).map(im => <a className="question-image" key={im.url} href={im.url} target="_blank" rel="noreferrer" aria-label="Mở hình câu hỏi ở kích thước đầy đủ"><img src={im.url} alt={im.alt} loading="lazy" /><span>Mở hình đầy đủ <ExternalLink size={11} /></span></a>)}</>;
}
export function QuestionText({ question, allowHint = false, highlight = false }: { question: Question; allowHint?: boolean; highlight?: boolean }) {
  return <><AskAssistant topic={{kind:"question",id:question.id,label:`Câu #${question.id} · MLA-C01`}}/><p className="question-origin">{question.origin==='udemy' && <OriginTag question={question}/>} {sourceLabel(question)}{question.sourceIds.length > 1 && ` · Đã gộp ${question.sourceIds.length} bản`}</p>{question.duplicateMatches?.length ? <div className="duplicate-matches" aria-label="Câu trùng được giữ lại">{question.duplicateMatches.map(match=><p key={match.questionId}><span className="tag duplicate">{match.kind==='exact'?'Trùng nguyên văn':'Trùng ý · Biến thể'}</span> {match.sourceLabel} · #{match.questionId}{match.answerConflict && <strong> · Khác khóa đáp án giữa nguồn</strong>}</p>)}<small>Giữ cả hai bản và tiến trình riêng. Lựa chọn hoặc thứ tự đáp án có thể khác.</small></div> : null}{question.duplicateOf !== undefined && <p className="notice archived-variant">Biến thể đã gộp vào #{String(question.duplicateOf).padStart(3,'0')}. Đây là bản câu hỏi của phiên đã lưu.</p>}<p className="question-text" lang="en"><StudyText text={question.text} highlight={highlight}/></p><QuestionImages question={question} />{allowHint && question.hint && <details className="question-hint"><summary>Gợi ý — mở sau khi tự phân tích</summary><p>{question.hint}</p></details>}{question.notes.some(note => note.includes('unit')) && <p className="notice"><Info size={15} /> Đơn vị dung lượng trong PDF bị lỗi, đã giữ nguyên ghi chú thay vì đoán đơn vị.</p>}</>;
}
export function Explanation({ question, selected, compact = false }: { question: Question; selected?: string[]; compact?: boolean }) {
  const uncertain = question.conditionalAnswer || question.status === 'review';
  const analysis = question.analysis;
  const optionAnalysis = (letters: string[]) => <ul className="option-analysis-list">{letters.map(letter=><li key={letter} data-option={letter}><p className="option-analysis-choice" lang="en"><strong>{letter}.</strong> <StudyText text={question.choices[letter]} highlight={compact}/></p><p><StudyText text={analysis?.options[letter]||''} highlight={compact}/></p></li>)}</ul>;
  return <div className={`explanation ${question.status === 'review' ? 'uncertain' : ''} ${compact?'compact-explanation':''}`}>
    <div className="explanation-title"><span className="answer-label" lang="vi">{`${uncertain || question.status === 'source' ? 'Đáp án theo bộ đề' : 'Đáp án đúng'}: ${question.answer.join(' + ')}`}</span>{selected && <span className="muted">Bạn chọn: {selected.join(', ') || 'Chưa trả lời'}</span>}</div>
    <div className="correct-answer-text" lang="en">{question.answer.map(a => <p key={a}><strong>{a}.</strong> <StudyText text={question.choices[a]} highlight={compact}/></p>)}</div>
    {(uncertain || question.status === 'source') && <p className="source-answer-note">{question.origin==='udemy'?'Chấm điểm theo đáp án Udemy trong tệp bạn cung cấp. Giải thích tiếng Việt tóm lược từ nguồn.':'Chấm điểm theo đáp án bộ đề. Phần giải thích bên dưới nêu các giả định của câu hỏi.'}</p>}
    {analysis && compact && !uncertain ? <div className="answer-analysis quick-analysis" lang="vi">
      <section className="key-concept"><h4>Ý chính</h4><p><StudyText text={analysis.keyConcept} highlight={compact}/></p></section>
      <section className="why-correct"><h4>Vì sao đáp án này đúng</h4>{question.answer.map(letter=><p key={letter} data-option={letter}><strong>{letter}.</strong> <StudyText text={analysis.options[letter]} highlight={compact}/></p>)}</section>
      {selected?.some(letter=>!question.answer.includes(letter))&&<section className="your-choice-analysis"><h4>Vì sao lựa chọn của bạn sai</h4>{selected.filter(letter=>!question.answer.includes(letter)).map(letter=><p key={letter} data-option={letter}><strong>{letter}.</strong> <StudyText text={analysis.options[letter]} highlight={compact}/></p>)}</section>}
      <details className="quick-distractors why-incorrect"><summary>Vì sao các lựa chọn còn lại sai · {Object.keys(question.choices).length-question.answer.length}</summary>{optionAnalysis(Object.keys(question.choices).filter(letter=>!question.answer.includes(letter)))}</details>
    </div> : analysis ? <div className="answer-analysis" lang="vi"><h3>Giải thích và phân tích lựa chọn</h3><section className="key-concept"><h4>Ý chính</h4><p><StudyText text={analysis.keyConcept} highlight={compact}/></p></section>{uncertain ? <section><h4>Phân tích từng lựa chọn</h4><p className="analysis-caveat">Câu hỏi còn giả định chưa rõ hoặc khóa đáp án mâu thuẫn. Phân tích dưới đây giải thích từng lựa chọn; đáp án đang tranh luận chưa được xem là đã xác nhận.</p>{optionAnalysis(Object.keys(question.choices))}</section> : <><section className="why-correct"><h4>{question.status === 'source' ? 'Vì sao nguồn chọn đáp án này' : 'Vì sao đáp án này đúng'}</h4>{optionAnalysis(question.answer)}</section><section className="why-incorrect"><h4>Vì sao các lựa chọn còn lại sai</h4>{optionAnalysis(Object.keys(question.choices).filter(letter=>!question.answer.includes(letter)))}</section></>}</div> : <p className="explanation-copy">{question.explanation}</p>}
    <details className="source-list"><summary>Nguồn và ghi chú · {question.page ? `PDF trang ${question.page}` : sourceLabel(question)}</summary><p>{question.sourceName}{question.sourceIds.length > 1 && ` · Q${question.sourceIds.join(', Q')}`}</p>{question.notes.map(note=><p key={note}>{note}</p>)}{question.sources.map(s => <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>{s.title}<ExternalLink size={12} /></a>)}</details>
  </div>;
}
export function ChoiceList({ question, selected, onSelect, revealed = false, disabled = false, quick = false, revealedAction }: { question: Question; selected: string[]; onSelect?: (letter: string) => void; revealed?: boolean; disabled?: boolean; quick?: boolean; revealedAction?: string }) {
  return <div className="choices" role="group" aria-label={`Chọn ${question.required} đáp án`}>
    {Object.entries(question.choices).map(([letter, text], index) => {
      const chosen = selected.includes(letter), correct = revealed && question.answer.includes(letter);
      const wrong = revealed && chosen && !correct;
      return <div key={letter} className={`choice ${chosen ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}>
        <button type="button" aria-pressed={chosen} disabled={disabled} onClick={() => onSelect?.(letter)} className="choice-button" title={quick&&revealed?(revealedAction||'Bấm lại để tiếp tục'):undefined}>
          <span className={`choice-letter ${question.required > 1 ? 'square' : ''}`}>{quick ? letter : correct ? <Check size={16} /> : wrong ? <X size={16} /> : letter}</span>
          <span lang="en"><StudyText text={text} highlight={quick}/></span>{quick&&<kbd className="choice-shortcut" aria-hidden="true">{index+1}</kbd>}<span className="choice-indicator">{wrong ? <X size={16}/> : chosen||correct ? <Check size={16} /> : null}</span>
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

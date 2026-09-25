import { hasQuestionMark, questionProgress, relatedQuestionIds, studyQuestions } from './domain.ts';
import type { Question, Session, State } from './domain.ts';
export type UnscoredReason = 'unseen'|'pending'|'known-only'|'skipped';
export type Mastery = UnscoredReason|'never-correct'|'low'|'building'|'strong';
export const unscoredLabels:Record<UnscoredReason,string>={
  unseen:'Chưa có lịch sử trả lời',pending:'Có đáp án lưu · chưa có lượt chấm',
  'known-only':'Đã thuộc flashcard · chưa có lượt chấm',skipped:'Bỏ trống trong bài đã nộp',
};
export function unscoredReason(question:Question,state:State,unfinished:Session[]=[]):UnscoredReason {
  const ids=relatedQuestionIds(question),sessions=[...state.history,...unfinished,...(state.active?[state.active]:[])];
  if (sessions.some(s=>ids.some(id=>s.answers[id]?.length))) return 'pending';
  if (hasQuestionMark(question,state.known)) return 'known-only';
  if (state.history.some(s=>ids.some(id=>s.questionIds.includes(id)))) return 'skipped';
  return 'unseen';
}
export type QuestionStatistic = { question: Question; attempts: number; correct: number; wrong: number; rate: number | null; mastery: Mastery };
export function questionStatistics(bank: Question[], state: State, unfinished:Session[]=[]): QuestionStatistic[] {
  return studyQuestions(bank).map(question=>{
    const progress=questionProgress(question,state);
    const attempts=progress?.attempts??0, correct=progress?.correct??0, wrong=attempts-correct;
    const rate=attempts?correct/attempts:null;
    const mastery:Mastery=rate===null?unscoredReason(question,state,unfinished):correct===0?'never-correct':rate>.8?'strong':rate>=.5?'building':'low';
    return {question,attempts,correct,wrong,rate,mastery};
  });
}
export function rankMistakes(stats: QuestionStatistic[], neverCorrect=false) {
  return stats.filter(s=>s.wrong>0&&(!neverCorrect||s.correct===0))
    .sort((a,b)=>b.wrong-a.wrong||(a.rate??0)-(b.rate??0)||a.question.id-b.question.id);
}
export const accuracyLabel=(rate:number|null)=>rate===null?'Chưa có lượt chấm':`${Number((rate*100).toFixed(1))}%`;

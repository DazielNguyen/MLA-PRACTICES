import { questionProgress, studyQuestions } from './domain.ts';
import type { Question, State } from './domain.ts';
export type Mastery = 'unseen'|'never-correct'|'low'|'building'|'strong';
export type QuestionStatistic = { question: Question; attempts: number; correct: number; wrong: number; rate: number | null; mastery: Mastery };
export function questionStatistics(bank: Question[], state: State): QuestionStatistic[] {
  return studyQuestions(bank).map(question=>{
    const progress=questionProgress(question,state);
    const attempts=progress?.attempts??0, correct=progress?.correct??0, wrong=attempts-correct;
    const rate=attempts?correct/attempts:null;
    const mastery:Mastery=rate===null?'unseen':correct===0?'never-correct':rate>.8?'strong':rate>=.5?'building':'low';
    return {question,attempts,correct,wrong,rate,mastery};
  });
}
export function rankMistakes(stats: QuestionStatistic[], neverCorrect=false) {
  return stats.filter(s=>s.wrong>0&&(!neverCorrect||s.correct===0))
    .sort((a,b)=>b.wrong-a.wrong||(a.rate??0)-(b.rate??0)||a.question.id-b.question.id);
}
export const accuracyLabel=(rate:number|null)=>rate===null?'Chưa trả lời':`${Number((rate*100).toFixed(1))}%`;

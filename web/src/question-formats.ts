import type { Question } from './domain.ts';
import { studyQuestions } from './domain.ts';

export type QuestionFormat = 'image' | 'matching' | 'ordering';
export const formatLabels: Record<QuestionFormat, string> = {
  image: 'Có ảnh', matching: 'Ghép từ / tình huống', ordering: 'Sắp xếp thứ tự',
};

// Classify instructions and answer structure, not incidental words such as
// “drop columns”, “match demand”, or the Sequence-to-Sequence algorithm.
export function questionFormats(question: Question): QuestionFormat[] {
  const formats: QuestionFormat[] = question.images.length ? ['image'] : [];
  const text = question.text;
  const choices = Object.values(question.choices);
  const ordered = /\bselect and order\b|\bcorrect order\b|\bselected and ordered\b/i.test(text)
    || choices.length > 1 && choices.every(c => /^\s*\d+(?:\s*[,→]\s*\d+){2,}\s*$/.test(c));
  const matching = /\b(?:can|would|should) you match\b|\bselect the correct\b[^.]*\b(?:each|for the following list of features)\b/i.test(text)
    || choices.length > 1 && choices.every(c => /^\s*\d+\s*-\s*[A-Z](?:\s*,\s*\d+\s*-\s*[A-Z])+\s*$/.test(c));
  if (ordered) formats.push('ordering');
  else if (matching) formats.push('matching');
  return formats;
}

export function focusedQuestions(bank: Question[], format: QuestionFormat | 'all' = 'all') {
  return studyQuestions(bank).filter(q => {
    const formats = questionFormats(q);
    return format === 'all' ? formats.length > 0 : formats.includes(format);
  });
}

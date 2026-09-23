import { keywordIds } from './data/keyword-ids.ts';

export type KeywordItem = {
  id: string; domain: number; part: number; order: number; title: string; prompt: string; answer: string;
  keywords: string; task: string; topic: string; steps: string[];
  sections: {title: string; text: string}[];
  source: {file: string; row: number; scope: string; urls: string[]; date: string};
};
export type KeywordStatus = 'learning' | 'review' | 'mastered';
export type KeywordProgress = {id: string; status: KeywordStatus; seenAt: number; result: boolean | null};
export type KeywordDeck = {ids: string[]; index: number; mode: 'cards' | 'match'; selected: string | null; revealed: boolean; correct: number; answered: number; startedAt: number};
export type KeywordExercise = {prompt: string; answer: string; choices: string[]};
export const keywordDomains = ['Chuẩn bị dữ liệu cho ML', 'Phát triển mô hình ML', 'Triển khai và điều phối ML', 'Giám sát, bảo trì và bảo mật'];
export const keywordParts = ['Thuật ngữ', 'Dịch vụ và công cụ', 'Quy trình', 'Ghép tình huống'];
export const keywordStatusLabels = {unseen: 'Chưa học', learning: 'Đang học', review: 'Cần ôn', mastered: 'Đã nắm'};
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const time = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
export function isKeywordProgress(v: unknown): v is KeywordProgress {
  return object(v) && typeof v.id === 'string' && keywordIds.has(v.id) && ['learning','review','mastered'].includes(String(v.status)) && time(v.seenAt) && (typeof v.result === 'boolean' || v.result === null);
}
export function isKeywordDeck(v: unknown): v is KeywordDeck | null {
  if (v === null) return true;
  return object(v) && Array.isArray(v.ids) && v.ids.length > 0 && v.ids.length <= keywordIds.size && v.ids.every(id => typeof id === 'string' && keywordIds.has(id)) && new Set(v.ids).size === v.ids.length && Number.isInteger(v.index) && Number(v.index) >= 0 && Number(v.index) <= v.ids.length && ['cards','match'].includes(String(v.mode)) && (v.selected === null || typeof v.selected === 'string' && v.selected.length <= 5000) && typeof v.revealed === 'boolean' && Number.isInteger(v.correct) && Number(v.correct) >= 0 && Number.isInteger(v.answered) && Number(v.answered) >= Number(v.correct) && Number(v.answered) <= v.ids.length && time(v.startedAt);
}
export function keywordCoverage(items: KeywordItem[], progress: Map<string, KeywordProgress>) {
  const counts = {unseen: 0, learning: 0, review: 0, mastered: 0, total: items.length};
  for (const item of items) counts[progress.get(item.id)?.status || 'unseen']++;
  return counts;
}
export function shuffleKeywords<T>(input: readonly T[], random = Math.random) {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];}
  return result;
}
function seedRandom(seed: string) {
  let n = 2166136261;
  for (const c of seed) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return () => {n += 0x6D2B79F5; let t = Math.imul(n ^ n >>> 15, 1 | n); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296;};
}
export function keywordExercise(item: KeywordItem, bank: KeywordItem[], seed: number): KeywordExercise {
  const random = seedRandom(`${item.id}:${seed}`);
  if (item.part === 3) {
    const gap = Math.floor(random() * item.steps.length), answer = item.steps[gap];
    const choices = shuffleKeywords([...new Set(item.steps.filter(step => step !== answer))], random).slice(0, 3);
    return {prompt: item.steps.map((step, i) => i === gap ? '________' : step).join(' → '), answer, choices: shuffleKeywords([...choices, answer], random)};
  }
  const answer = item.answer;
  const norm = (text: string) => text.normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  // Prefer peers from the same topic. Exclude aliases containing the correct answer.
  const compatible = (text: string) => !norm(text).includes(norm(answer)) && !norm(answer).includes(norm(text));
  const candidates = bank.filter(q => q.domain === item.domain && q.part === item.part && q.id !== item.id && compatible(q.answer));
  const peers = [...new Set([...shuffleKeywords(candidates.filter(q => q.topic === item.topic), random), ...shuffleKeywords(candidates, random)].map(q => q.answer))].slice(0, 3);
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prompt = item.prompt.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'giu'), '________');
  return {prompt, answer, choices: shuffleKeywords([...peers, answer], random)};
}

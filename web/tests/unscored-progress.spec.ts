import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createSession, defaultSettings, emptyState } from '../src/domain';
import type { Question } from '../src/domain';
import { onboard, snapshot } from './helpers';
const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
test('unscored states retain saved activity without inventing attempts or marking every cell unseen',async({page})=>{
  const state=emptyState();
  const past=createSession([bank[0]],{...defaultSettings,count:1},'exam',1000);
  state.history=[{...past,finishedAt:2000,finishReason:'manual'}];
  state.active=createSession([bank[1]],{...defaultSettings,count:1,minutes:600},'exam',Date.now());
  state.active.answers[bank[1].id]=bank[1].answer;
  state.known=[bank[2].id];
  state.progress[bank[4].id]={attempts:1,correct:1,latest:true,lastSeen:1000};
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),state);await onboard(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  const before=await snapshot(page);
  for(const [q,level] of [[bank[0],'skipped'],[bank[1],'pending'],[bank[2],'known-only'],[bank[3],'unseen']] as const){
    await expect(page.locator(`.mastery-grid [data-question-id="${q.id}"]`)).toHaveClass(new RegExp(level));
    await expect(page.locator(`.mastery-grid [data-question-id="${q.id}"]`)).toHaveAttribute('title',/0 lượt/);
  }
  await expect(page.locator('.ungraded-summary')).toContainText('1 bỏ trống trong bài đã nộp');
  await page.getByLabel('Lọc màu bản đồ').selectOption('skipped');await expect(page.locator('.mastery-grid button')).toHaveCount(1);
  await page.locator('.mastery-grid button').click();await expect(page.locator('.answer-count-status')).toContainText('Bỏ trống trong bài đã nộp');
  await page.goto('/#/progress');await page.getByLabel('Lọc màu bản đồ').selectOption('pending');await expect(page.locator('.mastery-grid button')).toHaveCount(1);
  await page.reload();expect((await snapshot(page)).progress).toEqual(before.progress);expect((await snapshot(page)).active!.answers).toEqual(before.active!.answers);
});

test('submitting an exam saves every selected conditional answer and grades it exactly once across reloads',async({page})=>{
  const questions=[519,520,536,537,543,611,613].map(id=>bank.find(q=>q.id===id)!);
  const state=emptyState();
  state.active=createSession(questions,{...defaultSettings,count:questions.length,minutes:60,order:'sequential'},'exam');
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),state);await onboard(page);
  await page.goto('/#/session');
  for(let i=0;i<questions.length;i++){
    const q=questions[i];
    await expect(page.locator('.question-id')).toContainText(`#${q.id}`);
    for(const a of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(a)).click();
    if(i<questions.length-1)await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();
  }
  await page.reload();const before=await snapshot(page);
  expect(Object.keys(before.active!.answers)).toHaveLength(7);expect(Object.keys(before.progress)).toHaveLength(0);
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
  await page.getByRole('button',{name:'Nộp và xem kết quả',exact:true}).click();
  await page.reload();await page.reload();
  const saved=await snapshot(page);
  for(const q of questions){expect(saved.history[0].answers[q.id]).toEqual(q.answer);expect(saved.progress[q.id]).toMatchObject({attempts:1,correct:1});}
  await page.goto('/#/progress');
  for(const q of questions)await expect(page.locator(`.mastery-grid [data-question-id="${q.id}"]`)).toHaveClass(/strong/);
});

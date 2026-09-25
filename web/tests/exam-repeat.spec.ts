import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { focusedQuestions } from '../src/question-formats';
import { emptyState } from '../src/domain';
import type { Question } from '../src/domain';
import { onboard, snapshot } from './helpers';
const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
const focused=focusedQuestions(bank);
test.beforeEach(async({page})=>{
  await page.goto('/');
  await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),{
    ...emptyState(),known:bank.map(q=>q.id),
    progress:Object.fromEntries(bank.map(q=>[q.id,{attempts:1,correct:1,latest:true,lastSeen:1000}]))
  });
  await onboard(page);await page.emulateMedia({reducedMotion:'reduce'});
});

test('all 21 mastered focused questions can be examined repeatedly without losing earlier results',async({page})=>{
  await page.goto('/#/focused');
  await page.getByRole('link',{name:'Thi thử bộ 21 câu này',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Nội dung',exact:true})).toHaveValue('focused');
  await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('21');
  await expect(page.locator('.pool-count')).toContainText('21 câu');
  await page.getByLabel('Thời gian (phút)',{exact:true}).fill('10');
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  const first=(await snapshot(page)).active!;
  expect(first.questionIds).toEqual(focused.map(q=>q.id));
  const q=focused[0];
  for(const letter of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(letter)).click();
  await expect(page.locator('.explanation')).toHaveCount(0);
  await page.reload();expect((await snapshot(page)).active!.deadline).toBe(first.deadline);
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
  await page.getByRole('button',{name:'Nộp và xem kết quả',exact:true}).click();
  const completed=(await snapshot(page)).history[0];
  await page.locator('.results-summary').screenshot({path:'test-results/exam-repeat-results.png',animations:'disabled'});
  await page.getByRole('button',{name:'Thi lại bộ này',exact:true}).click();
  await expect(page.locator('.question-id')).toContainText(`#${q.id}`);
  const second=(await snapshot(page)).active!;
  expect(second.id).not.toBe(first.id);expect(second.questionIds).toEqual(first.questionIds);
  expect(second.answers).toEqual({});expect(second.revealed).toEqual([]);expect(second.flagged).toEqual([]);
  expect(second.deadline).toBeGreaterThan(first.deadline!);
  expect(second.deadline!-second.startedAt).toBe(10*60*1000);
  expect((await snapshot(page)).history).toEqual([completed]);
  const wrong=Object.keys(q.choices).find(letter=>!q.answer.includes(letter))!;
  await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(wrong)).click();
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
  await page.getByRole('button',{name:'Nộp và xem kết quả',exact:true}).click();
  await page.reload();const saved=await snapshot(page);
  expect(saved.history).toHaveLength(2);expect(saved.history.find(s=>s.id===first.id)).toEqual(completed);
  expect(saved.progress[q.id].attempts).toBe(3);expect(saved.progress[q.id].correct).toBe(2);
  await page.getByRole('button',{name:'Thi lại bộ này',exact:true}).click();
  await expect(page.locator('.question-id')).toContainText(`#${q.id}`);
  expect((await snapshot(page)).active!.questionIds).toHaveLength(21);
});

test('exam selector retains every bank after mastery while practice filters still work',async({page})=>{
  await page.goto('/#/exam');
  await expect(page.locator('.pool-count')).toContainText('437 câu');
  await expect(page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true})).toHaveCount(0);
  const select=page.getByRole('combobox',{name:'Nội dung',exact:true});
  await select.selectOption('333-618');await expect(page.locator('.pool-count')).toContainText('242 câu');
  await select.selectOption('701-895');await expect(page.locator('.pool-count')).toContainText('195 câu');
  await select.selectOption('focused');await expect(page.locator('.pool-count')).toContainText('21 câu');
  await expect(page.getByRole('button',{name:'Bắt đầu thi thử',exact:true})).toBeEnabled();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.setup-form').screenshot({path:'test-results/exam-focused-mobile.png',animations:'disabled'});
  await page.goto('/#/practice');
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('unseen');
  await expect(page.locator('.pool-count')).toContainText('0 câu');
});

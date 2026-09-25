import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { focusedQuestions } from '../src/question-formats';
import type { Question } from '../src/domain';
import { onboard, snapshot } from './helpers';
const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
const focused=focusedQuestions(bank);
test.beforeEach(async({page})=>{await onboard(page);await page.emulateMedia({reducedMotion:'reduce'});});

test('focused page includes all images and converted text tasks, filters them and fits mobile',async({page})=>{
  await page.getByRole('link',{name:'Ảnh & ghép từ',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(21);
  await page.getByRole('button',{name:'Ghép từ / tình huống 11',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(11);
  await page.getByRole('button',{name:'Sắp xếp thứ tự 10',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(10);
  await page.getByRole('button',{name:'Có ảnh 16',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(16);
  await page.locator('.library-card > details > summary').first().click();
  const image=page.locator('.library-card').first().locator('img').first();
  await expect(image).toBeVisible();await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  await page.getByRole('combobox',{name:'Nguồn đề',exact:true}).selectOption('udemy');
  await expect(page.getByText('Không có câu phù hợp',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Bắt đầu ôn 0 câu',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Tất cả 21',exact:true}).click();
  await expect(page.locator('.library-card')).toHaveCount(5);
  await page.locator('.library-card > details > summary').first().click();
  await expect(page.locator('.library-card').first().locator('.question-text')).toContainText('1.');
  await page.locator('.focused-setup').screenshot({path:'test-results/focused-desktop.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.focused-setup').screenshot({path:'test-results/focused-mobile.png',animations:'disabled'});
});

test('quick focused sessions use ten matching IDs and share persistent answer counts',async({page})=>{
  await page.goto('/#/focused');await page.getByRole('button',{name:'Bắt đầu ôn 10 câu',exact:true}).click();
  await expect(page.locator('.quick-session')).toBeVisible();
  const session=(await snapshot(page)).active!;
  expect(session.questionIds).toHaveLength(10);
  expect(session.questionIds.every(id=>focused.some(q=>q.id===id))).toBe(true);
  const q=focused.find(q=>q.id===session.questionIds[0])!;
  for(const letter of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(letter)).click();
  await expect(page.locator('.answer-analysis')).toBeVisible();
  await page.reload();expect((await snapshot(page)).progress[q.id].correct).toBe(1);
  expect((await snapshot(page)).active!.questionIds).toEqual(session.questionIds);
  await page.goto(`/#/library?question=${q.id}`);
  await expect(page.locator('.question-answer-stats')).toContainText('Đúng');
  expect((await snapshot(page)).progress[q.id].attempts).toBe(1);
});

test('whole text-only subset can hide answers and empty mistake filters cannot start sessions',async({page})=>{
  await page.goto('/#/focused');await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('never-correct');
  await expect(page.locator('.library-card')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Bắt đầu ôn 0 câu',exact:true})).toBeDisabled();
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('all');
  await page.getByRole('combobox',{name:'Nguồn đề',exact:true}).selectOption('udemy');
  await page.getByRole('button',{name:'Ôn toàn bộ 5 câu',exact:true}).click();
  await page.getByRole('combobox',{name:'Cách học',exact:true}).selectOption('end');
  await page.getByRole('button',{name:'Bắt đầu ôn 5 câu',exact:true}).click();
  const session=(await snapshot(page)).active!;
  expect(session.questionIds.slice().sort()).toEqual(focused.filter(q=>q.origin==='udemy').map(q=>q.id).sort());
  expect(session.settings.feedback).toBe('end');
  const q=bank.find(q=>q.id===session.questionIds[0])!;
  for(const letter of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(letter)).click();
  await expect(page.locator('.answer-analysis')).toHaveCount(0);
  await page.reload();expect((await snapshot(page)).active!.answers[q.id]).toEqual(q.answer);
});

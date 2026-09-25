import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { emptyState } from '../src/domain';
import type { Question } from '../src/domain';
import { onboard, snapshot } from './helpers';

const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
const unseen=[bank.find(q=>q.id===519)!,...bank.filter(q=>q.origin==='udemy').slice(0,12)];
test.beforeEach(async({page})=>{
  await page.goto('/');
  await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),{
    ...emptyState(),bookmarks:[unseen[0].id],
    progress:Object.fromEntries(bank.filter(q=>!unseen.some(u=>u.id===q.id)).map(q=>[q.id,{attempts:1,correct:1,latest:true,lastSeen:1000}]))
  });
  await onboard(page);await page.goto('/#/practice');
});

test('switching from one bookmarked question to 13 unseen questions starts all 13 and persists submitted answers',async({page})=>{
  const scope=page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true});
  await scope.selectOption('bookmarked');
  await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('1');
  await scope.selectOption('unseen');
  await expect(page.locator('.pool-count')).toContainText('13 câu');
  await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('13');
  const source=page.getByRole('combobox',{name:'Nội dung',exact:true});
  await source.selectOption('333-618');await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('1');
  await source.selectOption('all');await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('13');
  await expect(page.locator('.pool-count')).toContainText('Phiên này: 13 câu');
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:/^Tự kiểm tra/}).click();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.setup-form').screenshot({path:'test-results/unseen-13-mobile.png',animations:'disabled'});
  await page.setViewportSize({width:1440,height:1050});
  await page.locator('.setup-form').screenshot({path:'test-results/unseen-13-desktop.png',animations:'disabled'});
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  expect((await snapshot(page)).active!.questionIds).toEqual(unseen.map(q=>q.id));
  await expect(page.locator('.question-grid button')).toHaveCount(13);
  for(let i=0;i<unseen.length;i++){
    const q=unseen[i];
    await expect(page.locator('.question-id')).toContainText(`#${q.id}`);
    for(const a of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(a)).click();
    if(i===0){await page.reload();expect((await snapshot(page)).active!.answers[q.id]).toEqual(q.answer);}
    if(i<unseen.length-1) await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();
  }
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();
  await page.getByRole('button',{name:'Nộp và xem kết quả',exact:true}).click();
  await page.reload();const saved=await snapshot(page);
  expect(saved.history[0].questionIds).toHaveLength(13);
  for(const q of unseen){expect(saved.history[0].answers[q.id]).toEqual(q.answer);expect(saved.progress[q.id]).toMatchObject({attempts:1,correct:1});}
  await page.goto('/#/practice');await scope.selectOption('unseen');
  await expect(page.locator('.pool-count')).toContainText('0 câu');
});

test('quick study preserves the selected source and all 13 unseen question IDs',async({page})=>{
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('unseen');
  await page.getByRole('button',{name:'Tất cả',exact:true}).click();
  await page.getByRole('button',{name:/^Học nhanh Chọn là chấm/}).click();
  await expect(page.getByRole('combobox',{name:'Nội dung',exact:true})).toHaveValue('all');
  await expect(page.locator('.pool-count')).toContainText('13 câu');
  await expect(page.getByLabel('Số câu hỏi',{exact:true})).toHaveValue('13');
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  const before=(await snapshot(page)).active!;
  expect([...before.questionIds].sort((a,b)=>a-b)).toEqual(unseen.map(q=>q.id));
  const q=bank.find(q=>q.id===before.questionIds[0])!;
  for(const a of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(a)).click();
  await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();await page.reload();
  expect((await snapshot(page)).active!.questionIds).toEqual(before.questionIds);
  expect((await snapshot(page)).active!.index).toBe(1);
  await expect(page.locator('.question-grid button')).toHaveCount(13);
});

test('explicit counts and the all preset survive smaller and empty filters',async({page})=>{
  const scope=page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}),count=page.getByLabel('Số câu hỏi',{exact:true});
  await count.fill('5');await scope.selectOption('bookmarked');await expect(count).toHaveValue('1');
  await scope.selectOption('unseen');await expect(count).toHaveValue('5');
  await page.getByRole('button',{name:'Tất cả',exact:true}).click();await expect(count).toHaveValue('13');
  await scope.selectOption('bookmarked');await expect(count).toHaveValue('1');
  await scope.selectOption('unseen');await expect(count).toHaveValue('13');
  await scope.selectOption('wrong');await expect(count).toHaveValue('0');
  await expect(page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true})).toBeDisabled();
  await scope.selectOption('unseen');await expect(count).toHaveValue('13');
});

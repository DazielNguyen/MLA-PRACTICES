import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { emptyState } from '../src/domain';
import type { Question } from '../src/domain';
import { onboard, snapshot } from './helpers';
const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
const progress={
  333:{attempts:10,correct:1,latest:true,lastSeen:1000},334:{attempts:5,correct:4,latest:false,lastSeen:1000},
  335:{attempts:3,correct:0,latest:false,lastSeen:1000},337:{attempts:1,correct:1,latest:true,lastSeen:1000},
  338:{attempts:4,correct:2,latest:true,lastSeen:1000},554:{attempts:4,correct:1,latest:true,lastSeen:1000},
  701:{attempts:20,correct:5,latest:true,lastSeen:1000},
};
test.beforeEach(async({page})=>{
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),{...emptyState(),progress,known:[336]});
  await onboard(page);await page.emulateMedia({reducedMotion:'reduce'});
});
test('custom accuracy and attempt thresholds choose weakest questions first and survive reload',async({page})=>{
  await page.goto('/#/practice');await page.getByRole('combobox',{name:'Nội dung',exact:true}).selectOption('333-618');
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('low-accuracy');
  await expect(page.locator('.pool-count')).toContainText('5 câu');
  await expect(page.getByRole('button',{name:'Tỷ lệ đúng thấp trước',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('Tỷ lệ đúng tối đa (%)',{exact:true}).fill('50');
  await expect(page.locator('.pool-count')).toContainText('4 câu');
  await page.getByLabel('Số lượt trả lời tối thiểu',{exact:true}).fill('4');
  await expect(page.locator('.pool-count')).toContainText('3 câu');
  await page.locator('.priority-preview summary').click();
  await expect(page.locator('.priority-preview tbody tr')).toHaveCount(3);
  await expect(page.locator('.priority-preview tbody tr').first()).toContainText('10%');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.setup-form').screenshot({path:'test-results/priority-mobile.png',animations:'disabled'});
  await page.setViewportSize({width:1440,height:1050});
  await page.locator('.setup-form').screenshot({path:'test-results/priority-desktop.png',animations:'disabled'});
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('2');
  await page.getByRole('button',{name:/^Học nhanh Chọn là chấm/}).click();
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  const active=(await snapshot(page)).active!;expect(active.questionIds).toEqual([333,554]);
  const q=bank.find(q=>q.id===333)!;for(const a of q.answer) await page.locator('.choice-button').nth(Object.keys(q.choices).indexOf(a)).click();
  await expect(page.locator('.answer-analysis')).toBeVisible();await page.reload();
  const saved=await snapshot(page);expect(saved.active!.settings).toMatchObject({scope:'low-accuracy',order:'priority',accuracyMax:50,minAttempts:4});
  expect(saved.active!.questionIds).toEqual([333,554]);expect(saved.progress[333].attempts).toBe(11);
});
test('error rate, total mistakes and never-correct filters differ and do not shrink exam banks',async({page})=>{
  await page.goto('/#/practice');await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('most-wrong');
  await page.locator('.priority-preview summary').click();await expect(page.locator('.priority-preview tbody tr').first()).toContainText('#701');
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('never-correct');await expect(page.locator('.pool-count')).toContainText('1 câu');
  await page.getByRole('combobox',{name:'Nội dung',exact:true}).selectOption('701-895');
  await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('high-error');await expect(page.locator('.pool-count')).toContainText('1 câu');
  await page.getByLabel('Tỷ lệ sai tối thiểu (%)',{exact:true}).fill('80');await expect(page.locator('.pool-count')).toContainText('0 câu');
  await expect(page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true})).toBeDisabled();
  await page.getByLabel('Tỷ lệ sai tối thiểu (%)',{exact:true}).fill('75');await expect(page.locator('.pool-count')).toContainText('1 câu');
  await page.getByLabel('Số lượt trả lời tối thiểu',{exact:true}).fill('0');await expect(page.getByRole('alert')).toContainText('số lượt');
  await expect(page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true})).toBeDisabled();
  await page.goto('/#/exam');await expect(page.locator('.pool-count')).toContainText('437 câu');
});
test('the same priority controls apply inside the separate focused bank',async({page})=>{
  await page.goto('/#/focused');await page.getByRole('combobox',{name:'Ưu tiên ôn',exact:true}).selectOption('low-accuracy');
  await expect(page.locator('.library-card')).toHaveCount(1);await expect(page.locator('.library-card-meta')).toContainText('#554');
  await page.getByRole('button',{name:'Bắt đầu ôn 1 câu',exact:true}).click();
  const active=(await snapshot(page)).active!;expect(active.questionIds).toEqual([554]);expect(active.settings.order).toBe('priority');
});

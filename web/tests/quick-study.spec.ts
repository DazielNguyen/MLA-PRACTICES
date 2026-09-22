import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { onboard, snapshot } from './helpers';

async function ready(page:Page){
  await page.locator('.quick-question').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});
}
async function start(page:Page,count=3){
  await page.goto('/#/practice');
  await page.getByLabel('Số câu hỏi',{exact:true}).fill(String(count));
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:/^Học nhanh Chọn là chấm/}).click();
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await ready(page);
}
test.beforeEach(async({page})=>{await onboard(page);});

test('quick home entry enables immediate grading without a confirmation button',async({page})=>{
  await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();
  expect((await snapshot(page)).active!.settings.quick).toBe(true);
  await expect(page.locator('.quick-session')).toBeVisible();
  await expect(page.getByRole('button',{name:'Kiểm tra đáp án'})).toHaveCount(0);
});

test('a wrong click explains immediately and another click advances exactly once during a burst',async({page})=>{
  await start(page);
  await page.locator('.choice-button').first().click();
  await expect(page.locator('.answer-label')).toHaveText('Correct answer: C');
  await expect(page.locator('.your-choice-analysis')).toBeVisible();
  await expect(page.locator('.quick-distractors')).not.toHaveAttribute('open','');
  await page.locator('.quick-distractors > summary').click();
  await expect(page.locator('.why-incorrect [data-option]')).toHaveCount(3);
  await page.locator('.choice-button').first().evaluate(button=>{for(let i=0;i<15;i++)(button as HTMLButtonElement).click();});
  await expect(page.locator('.question-id')).toContainText('#334');
  const saved=await snapshot(page);
  expect(saved.active!.index).toBe(1);
  expect(saved.active!.answers).toEqual({333:['A']});
  expect(saved.progress[333].attempts).toBe(1);
});

test('number keys grade, Enter and Space advance, and the last answer finishes without a dialog',async({page})=>{
  await start(page,2);
  await page.keyboard.press('3');
  await expect(page.locator('.feedback-banner')).toContainText('Chính xác!');
  await page.reload();await ready(page);
  expect((await snapshot(page)).progress[333].attempts).toBe(1);
  await page.getByRole('button',{name:'Lưu câu hỏi',exact:true}).focus();
  await page.keyboard.press('Space');
  expect((await snapshot(page)).bookmarks).toContain(333);
  expect((await snapshot(page)).active!.index).toBe(0);
  await page.locator('.choice-button').nth(1).focus();
  await page.keyboard.press('Enter');
  await ready(page);await expect(page.locator('.question-id')).toContainText('#334');
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'1',repeat:true,bubbles:true})));
  expect((await snapshot(page)).active!.answers[334]).toBeUndefined();
  await page.keyboard.press('1');
  await expect(page.locator('.answer-label')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('.results-page')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const saved=await snapshot(page);
  expect(saved.active).toBeNull();expect(saved.history).toHaveLength(1);
  expect(saved.progress[333].attempts).toBe(1);expect(saved.progress[334].attempts).toBe(1);
});

test('multi-select waits for all choices and does not grade an incomplete selection',async({page})=>{
  await start(page,30);
  const index=(await snapshot(page)).active!.questionIds.indexOf(350);
  await page.getByRole('button',{name:`Đến câu ${index+1}`,exact:true}).click();await ready(page);
  await page.keyboard.press('1');
  await expect(page.locator('.explanation')).toHaveCount(0);
  expect((await snapshot(page)).progress[350]).toBeUndefined();
  await page.keyboard.press('1');
  await expect(page.locator('.choice-button[aria-pressed=true]')).toHaveCount(0);
  await page.keyboard.press('1');await page.keyboard.press('2');
  await expect(page.locator('.answer-label')).toHaveText('Correct answer: A + B');
  await expect(page.locator('.why-correct [data-option]')).toHaveCount(2);
  expect((await snapshot(page)).progress[350].correct).toBe(1);
});

test('quick feedback fits desktop and mobile and respects reduced motion',async({page})=>{
  await start(page);await page.keyboard.press('3');
  await expect(page.locator('.quick-feedback')).toBeVisible();
  await page.screenshot({path:'test-results/quick-study-desktop.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/quick-study-mobile.png',fullPage:true,animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.quick-question').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  expect(await page.locator('.quick-feedback').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
});

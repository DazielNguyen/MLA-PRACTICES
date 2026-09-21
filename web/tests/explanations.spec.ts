import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';

test.beforeEach(async({page})=>{await onboard(page);});

test('warm-pool practice explains the correct answer and every distractor after checking',async({page})=>{
  await page.goto('/#/practice');
  await page.getByRole('combobox',{name:'Bộ đề',exact:true}).selectOption('mla');
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('2');
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();
  await expect(page.locator('.question-id')).toContainText('#334');
  await expect(page.locator('.answer-analysis')).toHaveCount(0);
  await page.locator('.choice-button').nth(0).click();
  await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();
  await expect(page.locator('.answer-label')).toHaveText('Correct answer: B');
  await expect(page.locator('.correct-answer-text')).toContainText('Use SageMaker managed warm pools.');
  await expect(page.getByRole('heading',{name:'Key Concept',exact:true})).toBeVisible();
  await expect(page.locator('.why-correct [data-option="B"]')).toContainText('retained instances');
  await expect(page.locator('.why-incorrect [data-option]')).toHaveCount(3);
  await expect(page.locator('.why-incorrect [data-option="A"]')).toContainText('cost');
  await expect(page.locator('.why-incorrect [data-option="C"]')).toContainText('provisioning');
  await expect(page.locator('.why-incorrect [data-option="D"]')).toContainText('throughput');
  expect((await snapshot(page)).progress[334].latest).toBe(false);
  await page.screenshot({path:'test-results/warm-pool-analysis-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/warm-pool-analysis-mobile.png',fullPage:true});
});

test('unresolved questions show conditional analysis without a confirmed answer',async({page})=>{
  await page.goto('/#/library');
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#525');
  await page.locator('.library-card > details > summary').click();
  await expect(page.locator('.answer-analysis')).not.toBeVisible();
  await page.locator('.show-explanation > summary').click();
  await expect(page.locator('.answer-label')).toHaveText('Answer not finalized');
  await expect(page.getByRole('heading',{name:'Option-by-option analysis',exact:true})).toBeVisible();
  await expect(page.locator('.answer-analysis [data-option]')).toHaveCount(4);
  await expect(page.locator('.why-correct')).toHaveCount(0);
  await expect(page.locator('.correct-answer-text')).toHaveCount(0);
  await expect(page.locator('.choice.correct, .choice.wrong')).toHaveCount(0);
});

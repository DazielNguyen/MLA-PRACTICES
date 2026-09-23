import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';

test('original questions support quick study, explanations and saved progress', async ({page}) => {
  await onboard(page);
  await page.goto('/#/practice');
  await page.getByRole('combobox',{name:'Nội dung',exact:true}).selectOption('1001-1352');
  await expect(page.locator('.pool-count')).toContainText('352 câu');
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('2');
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:/^Học nhanh/}).click();
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await expect(page.locator('.question-origin')).toHaveText('MLA-C01 Q1001 · Tự biên soạn');
  await page.locator('.choice-button').nth(3).click();
  await expect(page.locator('.answer-label')).toHaveText('Đáp án đúng: D');
  await expect(page.locator('.why-correct')).toBeVisible();
  await page.locator('.quick-distractors summary').click();
  await expect(page.locator('.why-incorrect .option-analysis-list li')).toHaveCount(3);
  await page.reload();
  expect((await snapshot(page)).progress[1001].correct).toBe(1);
  await page.locator('.choice-button').nth(3).click();
  await expect(page.locator('.question-origin')).toContainText('Q1002 · Tự biên soạn');
});

test('original flashcard source survives reload and labels remain readable on mobile', async ({page}) => {
  await onboard(page);
  await page.goto('/#/flashcards');
  await page.getByLabel('Nguồn câu hỏi',{exact:true}).selectOption('original');
  await expect(page.locator('.flash-meta')).toContainText('/ 352');
  await expect(page.locator('.question-origin')).toContainText('Q1001 · Tự biên soạn');
  await page.getByRole('button',{name:'Thẻ tiếp',exact:true}).click();
  await page.reload();
  await expect(page.getByLabel('Nguồn câu hỏi',{exact:true})).toHaveValue('original');
  await expect(page.locator('.question-origin')).toContainText('Q1002 · Tự biên soạn');
  await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();
  await expect(page.locator('.flash-meta')).toContainText('Tự biên soạn');
  await expect(page.locator('.why-incorrect li')).toHaveCount(3);
  await page.goto('/#/library');
  await page.getByLabel('Nguồn câu hỏi',{exact:true}).selectOption('original');
  await expect(page.locator('.library-count')).toContainText('352 câu hỏi');
  await expect(page.locator('.library-card .tag.original')).toHaveCount(20);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/original-library-mobile.png',fullPage:true,animations:'disabled'});
  await page.getByLabel('Nguồn câu hỏi',{exact:true}).selectOption('imported');
  await expect(page.locator('.library-count')).toContainText('242 câu hỏi');
  await expect(page.locator('.tag.original')).toHaveCount(0);
});

test('original domain exam filters expose the intended questions', async ({page}) => {
  await onboard(page);
  await page.goto('/#/exam');
  await page.getByRole('combobox',{name:'Nội dung',exact:true}).selectOption('1265-1352');
  await expect(page.locator('.pool-count')).toContainText('88 câu');
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('88');
  await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  const ids=(await snapshot(page)).active!.questionIds;
  expect(ids).toHaveLength(88);
  expect(ids.every(id=>id>=1265&&id<=1352)).toBe(true);
  await expect(page.locator('.question-origin')).toContainText('Tự biên soạn');
  await expect(page.locator('.explanation')).toHaveCount(0);
});

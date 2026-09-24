import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { onboard } from './helpers';

const counts = (page: Page, id = 333) => page.getByRole('group', { name: `Lịch sử trả lời câu #${id}`, exact: true });
async function expectCounts(page: Page, correct: number, wrong: number, id = 333) {
  await expect(counts(page, id)).toContainText(`Đúng ${correct} lần`);
  await expect(counts(page, id)).toContainText(`Sai ${wrong} lần`);
}
async function startQuick(page: Page) {
  await page.goto('/#/practice');
  await page.getByLabel('Số câu hỏi', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Theo thứ tự', exact: true }).click();
  await page.getByRole('button', { name: /^Học nhanh Chọn là chấm/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true }).click();
  await expect(page.locator('.question-id')).toContainText('#333');
}

test('answer counters accumulate across sessions, reloads and tabs without counting navigation or flashcard ratings', async ({ page, context }) => {
  await onboard(page);
  await startQuick(page);
  await expectCounts(page, 0, 0);
  await page.locator('.choice-button').first().click();
  await expectCounts(page, 0, 1);
  await page.reload();
  await expectCounts(page, 0, 1);
  await page.locator('.choice-button').first().click();
  await expect(page.locator('.results-page')).toBeVisible();
  await expectCounts(page, 0, 1);

  await startQuick(page);
  await expectCounts(page, 0, 1);
  await page.locator('.choice-button').nth(2).click();
  await expectCounts(page, 1, 1);
  await page.screenshot({ path: 'test-results/answer-counts-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(counts(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/answer-counts-mobile.png', animations: 'disabled' });
  await page.locator('.choice-button').nth(2).click();
  await expect(page.locator('.results-page')).toBeVisible();
  await page.reload();
  await expectCounts(page, 1, 1);

  await page.goto('/#/library');
  await page.getByLabel('Tìm câu hỏi').fill('#333');
  await expectCounts(page, 1, 1);
  await page.goto('/#/flashcards');
  await expectCounts(page, 1, 1);
  await page.getByRole('button', { name: 'Lật thẻ', exact: true }).click();
  await page.getByRole('button', { name: 'Đã thuộc', exact: true }).last().click();
  await page.getByRole('button', { name: 'Thẻ trước', exact: true }).click();
  await expectCounts(page, 1, 1);

  const tab = await context.newPage();
  await tab.goto('/');
  await tab.locator('.saved-learners button').filter({ hasText: 'Duy' }).click();
  await tab.goto('/#/library');
  await tab.getByLabel('Tìm câu hỏi').fill('#333');
  await expectCounts(tab, 1, 1);
  await tab.goto('/#/learner');
  await tab.getByRole('button', { name: 'Đổi người học' }).click();
  await tab.getByLabel('Tên người học', { exact: true }).fill('An');
  await tab.getByRole('button', { name: 'Tạo hồ sơ và bắt đầu' }).click();
  await tab.goto('/#/library');
  await tab.getByLabel('Tìm câu hỏi').fill('#333');
  await expectCounts(tab, 0, 0);
  await tab.close();
});

test('exam counts change only after submission and blank questions do not count as wrong attempts', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/exam');
  await page.getByLabel('Số câu hỏi', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Theo thứ tự', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu thi thử', exact: true }).click();
  await page.locator('.choice-button').nth(2).click();
  await expectCounts(page, 0, 0);
  await expect(page.locator('.explanation')).toHaveCount(0);
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Nộp và xem kết quả', exact: true }).click();
  await expectCounts(page, 1, 0);
  await expectCounts(page, 0, 0, 334);
});

test('unverified questions explain why right and wrong counters are unavailable', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/library');
  await page.getByLabel('Tìm câu hỏi').fill('#337');
  await expect(counts(page, 337)).toHaveText('Cần xác minh · Không tính đúng/sai');
  await expect(counts(page, 337).locator('.answer-count-correct,.answer-count-wrong')).toHaveCount(0);
});

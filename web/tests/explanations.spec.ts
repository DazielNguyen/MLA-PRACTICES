import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';

test.beforeEach(async({page})=>{await onboard(page);});

test('warm-pool practice explains the correct answer and every distractor after checking',async({page})=>{
  await page.goto('/#/practice');
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('2');
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();
  await expect(page.locator('.question-id')).toContainText('#334');
  await expect(page.locator('.answer-analysis')).toHaveCount(0);
  await page.locator('.choice-button').nth(0).click();
  await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();
  await expect(page.locator('.answer-label')).toHaveText('Đáp án đúng: B');
  await expect(page.locator('.correct-answer-text')).toContainText('Use SageMaker managed warm pools.');
  await expect(page.getByRole('heading',{name:'Ý chính',exact:true})).toBeVisible();
  await expect(page.locator('.answer-analysis')).toHaveAttribute('lang','vi');
  await expect(page.locator('.why-correct [data-option="B"]')).toContainText('instance được giữ lại');
  await expect(page.locator('.why-incorrect [data-option]')).toHaveCount(3);
  await expect(page.locator('.why-incorrect [data-option="A"]')).toContainText('chi phí');
  await expect(page.locator('.why-incorrect [data-option="C"]')).toContainText('cấp phát');
  await expect(page.locator('.why-incorrect [data-option="D"]')).toContainText('thông lượng');
  expect((await snapshot(page)).progress[334].latest).toBe(false);
  await page.screenshot({path:'test-results/warm-pool-analysis-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/warm-pool-analysis-mobile.png',fullPage:true});
});

test('conditional source questions show their scoring key while retaining conditional analysis',async({page})=>{
  await page.goto('/#/library');
  await page.getByLabel('Nguồn câu hỏi',{exact:true}).selectOption('imported');
  await page.getByLabel('Trạng thái đáp án').selectOption('source');
  await expect(page.locator('.library-count strong')).toHaveText('32 câu hỏi');
  await expect(page.getByLabel('Trạng thái đáp án').locator('option[value="review"]')).toHaveCount(0);
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#525');
  await page.locator('.library-card > details > summary').click();
  await expect(page.locator('.answer-analysis')).not.toBeVisible();
  await page.locator('.show-explanation > summary').click();
  await expect(page.locator('.answer-label')).toHaveText('Đáp án theo bộ đề: D');
  await expect(page.getByRole('heading',{name:'Phân tích từng lựa chọn',exact:true})).toBeVisible();
  await expect(page.locator('.answer-analysis [data-option]')).toHaveCount(4);
  await expect(page.locator('.why-correct')).toHaveCount(0);
  await expect(page.locator('.correct-answer-text')).toBeVisible();
  await expect(page.locator('.source-answer-note')).toContainText('Chấm điểm theo đáp án bộ đề');
  await expect(page.locator('.choice.correct, .choice.wrong')).toHaveCount(0);
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#477');
  await page.locator('.library-card > details > summary').click();
  await page.locator('.show-explanation > summary').click();
  await expect(page.locator('.tag.source')).toHaveText('Theo đáp án bộ đề');
  await expect(page.locator('.answer-label')).toHaveText('Đáp án theo bộ đề: C');
  await expect(page.locator('.explanation')).not.toHaveClass(/uncertain/);
  await page.screenshot({path:'test-results/source-answer-477.png',fullPage:true});
});

import { test, expect } from '@playwright/test';
import { emptyState } from '../src/domain';
import { onboard, snapshot } from './helpers';
const progress={
  333:{attempts:5,correct:4,latest:true,lastSeen:1000},
  334:{attempts:10,correct:9,latest:false,lastSeen:1000},
  335:{attempts:6,correct:0,latest:false,lastSeen:1000},
  336:{attempts:20,correct:2,latest:true,lastSeen:1000},
  701:{attempts:3,correct:0,latest:false,lastSeen:1000},
  337:{attempts:1,correct:1,latest:true,lastSeen:1000},
  1001:{attempts:100,correct:0,latest:false,lastSeen:1000},
};
test.beforeEach(async({page})=>{
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),{...emptyState(),known:[338,1001],progress});
  await onboard(page);await page.emulateMedia({reducedMotion:'reduce'});
});
test('heatmap grades lifetime accuracy, sorts mistakes and opens the matching question without recording attempts',async({page})=>{
  const panel=page.getByRole('region',{name:'Hành trình theo tỷ lệ đúng'});
  await expect(panel.locator('.mastery-grid button')).toHaveCount(437);
  await expect(panel.locator('.mastery-grid [data-question-id="333"]')).toHaveClass(/building/);
  await expect(panel.locator('.mastery-grid [data-question-id="334"]')).toHaveClass(/strong/);
  await expect(panel.locator('.mastery-grid [data-question-id="335"]')).toHaveClass(/never-correct/);
  await expect(panel.locator('.mastery-grid [data-question-id="336"]')).toHaveClass(/low/);
  await expect(panel.locator('.mastery-grid [data-question-id="338"]')).toHaveClass(/unseen/);
  await expect(panel.locator('.mastery-grid [data-question-id="1001"]')).toHaveCount(0);
  await expect(panel.locator('.mastery-grid [data-question-id="334"]')).toHaveAttribute('title',/Đúng 9 · Sai 1 · 90%/);
  expect(await panel.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-question-id')))).toEqual(['336','335','701','333','334']);
  await panel.getByRole('button',{name:/^Chưa từng đúng/}).click();
  expect(await panel.locator('tbody tr').evaluateAll(rows=>rows.map(r=>r.getAttribute('data-question-id')))).toEqual(['335','701']);
  await panel.getByRole('button',{name:'Mở câu #701',exact:true}).click();
  await expect(page).toHaveURL(/#\/library\?question=701$/);
  await expect(page.locator('.library-card')).toHaveCount(1);
  await expect(page.locator('.library-card > details')).toHaveAttribute('open','');
  await expect(page.locator('.question-origin')).toContainText('Udemy · MLA-C01 Q001');
  await page.reload();await expect(page.locator('.question-origin')).toContainText('Udemy · MLA-C01 Q001');
  expect((await snapshot(page)).progress).toEqual(progress);
  await page.goto('/');await page.locator('.mastery-grid [data-question-id="334"]').focus();await page.keyboard.press('Enter');
  await expect(page.locator('.question-origin')).toContainText('MLA-C01 Q002');
});
test('filters and mobile layout work on both home and progress pages',async({page})=>{
  await page.getByLabel('Lọc màu bản đồ').selectOption('strong');await expect(page.locator('.mastery-grid button')).toHaveCount(2);
  await page.getByLabel('Bộ đề trong bản đồ').selectOption('udemy');await expect(page.locator('.mastery-grid button')).toHaveCount(0);
  await expect(page.getByText('Chưa có câu nào ở mức này.',{exact:true})).toBeVisible();
  await page.getByLabel('Lọc màu bản đồ').selectOption('never-correct');await expect(page.locator('.mastery-grid button')).toHaveCount(1);
  await page.goto('/#/progress');await page.getByRole('button',{name:/^Chưa từng đúng/}).click();
  await expect(page.locator('.mistake-table tbody tr')).toHaveCount(2);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.question-journey').screenshot({path:'test-results/question-journey-mobile.png',animations:'disabled'});
  await page.setViewportSize({width:1440,height:1050});await page.goto('/');
  await page.locator('.question-journey').screenshot({path:'test-results/question-journey-desktop.png',animations:'disabled'});
});

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const key='ml-practice:v1';
async function configure(page:Page,mode='exam',count=3){
  await page.goto(`/#/${mode}`);await page.getByLabel('Số câu hỏi',{exact:true}).fill(String(count));
  await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();
  if(mode==='exam')await page.getByLabel('Thời gian (phút)',{exact:true}).fill('1');
}
test('dashboard, mobile navigation and question images render without errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('heading',{name:/Mỗi ngày một chút/})).toBeVisible();
  await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Mở điều hướng'}).click();await page.getByRole('link',{name:'Ngân hàng câu hỏi'}).click();
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#178');await page.locator('.library-card > details > summary').click();
  await expect(page.locator('.question-image img')).toHaveCount(3);
  for(const img of await page.locator('.question-image img').all())await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/question-images-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
test('exam hides answers, persists selections and flags, and grades on submission',async({page})=>{
  await configure(page);await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  await expect(page.locator('.question-id')).toHaveText('Ngân hàng #002');
  await expect(page.locator('.explanation')).toHaveCount(0);await expect(page.getByRole('button',{name:'Kiểm tra đáp án'})).toHaveCount(0);
  const deadline=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active.deadline,key);
  await page.locator('.choice-button').nth(1).click();await page.getByRole('button',{name:'Đánh dấu xem lại',exact:true}).click();
  await page.reload();await expect(page.locator('.choice-button').nth(1)).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'Bỏ đánh dấu xem lại'})).toBeVisible();
  expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active.deadline,key)).toBe(deadline);
  await page.screenshot({path:'test-results/exam-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Câu tiếp',exact:true}).click();await page.locator('.choice-button').nth(0).click();
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();await page.getByRole('button',{name:'Nộp và xem kết quả'}).click();
  await expect(page.getByText('Câu trả lời đúng',{exact:true})).toBeVisible();
  const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(saved.active).toBeNull();expect(saved.history).toHaveLength(1);expect(saved.history[0].answers['2']).toEqual(['B']);
  await page.locator('.review-card summary').first().click();await expect(page.locator('.explanation').first()).toBeVisible();
  await page.screenshot({path:'test-results/results-desktop.png',fullPage:true});
});
test('absolute timer automatically submits once, including on reload after closing',async({page})=>{
  await page.clock.install();await configure(page,'exam',2);await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  await page.locator('.choice-button').nth(1).click();await page.clock.fastForward(61000);
  await expect(page.getByText('Hết thời gian. Bài làm đã được tự động nộp và lưu.')).toBeVisible();await page.reload();
  let data=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(data.history).toHaveLength(1);expect(data.progress['2'].attempts).toBe(1);expect(data.history[0].finishedAt).toBe(data.history[0].deadline);
  await configure(page,'exam',2);await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)!);s.active.startedAt=Date.now()-120000;s.active.deadline=Date.now()-60000;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();await expect(page.getByText('Hết thời gian. Bài làm đã được tự động nộp và lưu.')).toBeVisible();
  data=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(data.history).toHaveLength(2);expect(data.active).toBeNull();
});
test('practice checks once, while hidden practice reveals only after submission',async({page})=>{
  await configure(page,'practice',2);await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await expect(page.getByRole('button',{name:'Kiểm tra đáp án'})).toBeDisabled();await page.locator('.choice-button').nth(1).click();await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();
  await expect(page.locator('.explanation')).toBeVisible();await expect(page.locator('.choice-button').first()).toBeDisabled();
  await page.reload();await expect(page.locator('.explanation')).toBeVisible();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).progress['2'].attempts,key)).toBe(1);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/practice-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Nộp bài',exact:true}).click();await page.getByRole('button',{name:'Nộp và xem kết quả'}).click();
  expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).progress['2'].attempts,key)).toBe(1);
  await configure(page,'practice',2);await page.getByRole('button',{name:/Tự kiểm tra/}).click();await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await page.locator('.choice-button').nth(1).click();await expect(page.locator('.explanation')).toHaveCount(0);await expect(page.getByRole('button',{name:'Kiểm tra đáp án'})).toHaveCount(0);
});
test('flashcards remember the deck position and known cards',async({page})=>{
  await page.goto('/#/flashcards');await expect(page.getByRole('button',{name:'Đã thuộc',exact:true}).last()).toBeDisabled();await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();
  await expect(page.locator('.explanation')).toBeVisible();await page.screenshot({path:'test-results/flashcard-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();await expect(page.locator('.flashcard-top>.eyebrow')).toContainText('#003');
  await page.reload();await expect(page.locator('.flashcard-top>.eyebrow')).toContainText('#003');expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).known,key)).toEqual([2]);
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/flashcard-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('backup export and restore preserve state; invalid input cannot clobber it',async({page})=>{
  await page.goto('/#/flashcards');await page.getByRole('button',{name:'Lưu câu hỏi',exact:true}).click();
  await page.goto('/#/progress');const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất bản sao JSON',exact:true}).click();const download=await downloadPromise;expect(download.suggestedFilename()).toMatch(/ml-practice.*\.json/);
  const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);
  await page.getByLabel('Chọn file tiến trình').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":99}')});
  await expect(page.getByRole('status')).toContainText('không hợp lệ');expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key)).toEqual(before);
  before.known=[2,3];await page.getByLabel('Chọn file tiến trình').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(before))});
  await expect(page.getByRole('dialog')).toBeVisible();const previousBackup=page.waitForEvent('download');await page.getByRole('button',{name:'Khôi phục bản sao',exact:true}).click();await previousBackup;
  await page.reload();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).known,key)).toEqual([2,3]);
});
test('a new session requires confirmation and keeps the previous session in history',async({page})=>{
  await configure(page,'practice',2);await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();await page.locator('.choice-button').nth(1).click();
  await page.getByRole('button',{name:'Về tổng quan'}).click();await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Quay lại',exact:true}).click();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active.questionIds.length,key)).toBe(2);
  await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await page.getByRole('button',{name:'Lưu bài cũ và bắt đầu'}).click();const data=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(data.active.questionIds).toHaveLength(10);expect(data.history).toHaveLength(1);expect(data.history[0].answers['2']).toEqual(['B']);
});

test('multiple choices enforce the required count and survive reload',async({page})=>{
  await configure(page,'practice',30);await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  const index=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).active.questionIds.indexOf(21),key);
  await page.getByRole('button',{name:`Đến câu ${index+1}`,exact:true}).click();await expect(page.locator('.question-id')).toContainText('#021');
  await page.locator('.choice-button').nth(0).click();await expect(page.getByRole('button',{name:'Kiểm tra đáp án'})).toBeDisabled();
  await page.locator('.choice-button').nth(3).click();await page.locator('.choice-button').nth(1).click();await expect(page.locator('.choice-button[aria-pressed=true]')).toHaveCount(2);
  await page.reload();await expect(page.locator('.choice-button[aria-pressed=true]')).toHaveCount(2);await page.getByRole('button',{name:'Kiểm tra đáp án'}).click();await expect(page.locator('.feedback-banner')).toContainText('Chính xác!');
});

test('storage failures are visible and progress can still be exported',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage quota exceeded','QuotaExceededError');};});
  await page.goto('/');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await expect(page.getByRole('alert')).toContainText('Trình duyệt chưa lưu được tiến trình');
  const download=page.waitForEvent('download');await page.getByRole('alert').getByRole('button',{name:'Xuất bản sao'}).click();expect((await download).suggestedFilename()).toMatch(/\.json$/);
});

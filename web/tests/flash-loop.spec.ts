import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { onboard, snapshot } from './helpers';
import { emptyFlashLoop, flashWindow } from '../src/flash-loop';
async function ready(page:Page){
  await page.locator('.quick-question,.quick-feedback').evaluateAll(async els=>{await Promise.all(els.flatMap(el=>el.getAnimations()).map(a=>a.finished.catch(()=>{})));});
}
async function seedDeck(page:Page,ids:number[]){
  await page.evaluate(({ids,loop})=>{
    const profile=sessionStorage.getItem('ml-selected:v2'),writer=sessionStorage.getItem('ml-tab:v2');
    const key=`ml-row:v2:${profile}:flash:${writer}`, row=JSON.parse(localStorage.getItem(key)!);
    row.value={...row.value,ids,index:0,mode:'loop',loop};localStorage.setItem(key,JSON.stringify(row));
  },{ids,loop:emptyFlashLoop()});
  await page.reload();await ready(page);
}
test.beforeEach(async({page})=>{await onboard(page);await page.goto('/#/flashcards');await expect(page.locator('.flash-loop-question')).toBeVisible();await ready(page);});

test('ten-card loop retries mistakes, counts each attempt once and brings in a new card after success',async({page})=>{
  await expect(page.getByRole('button',{name:'Vòng học 10 câu',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.flash-loop-window li')).toHaveCount(10);
  const before=(await snapshot(page)).flash!;
  await page.locator('.choice-button').first().evaluate(el=>{for(let i=0;i<15;i++)(el as HTMLButtonElement).click();});
  await expect(page.locator('.feedback-banner')).toContainText('Chưa đúng');await ready(page);
  expect((await snapshot(page)).progress[333].attempts).toBe(1);
  expect(flashWindow((await snapshot(page)).flash)).toEqual(before.ids.slice(0,10));
  await expect(page.locator('.flash-loop-window li').first()).toHaveClass('incorrect');
  await page.screenshot({path:'test-results/flash-loop-wrong-desktop.png',fullPage:true,animations:'disabled'});
  await page.reload();await ready(page);
  await expect(page.locator('.choice-button').first()).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('3');await ready(page);
  await expect(page.locator('.feedback-banner')).toContainText('Đúng rồi');
  const correct=await snapshot(page);expect(correct.progress[333].attempts).toBe(2);expect(correct.progress[333].correct).toBe(1);expect(correct.known).toContain(333);
  await page.keyboard.press('Enter');await ready(page);
  await expect(page.locator('.flashcard-top>.eyebrow')).toContainText('#334');
  expect(flashWindow((await snapshot(page)).flash)).toEqual(before.ids.slice(1,11));
  await page.reload();await ready(page);
  expect((await snapshot(page)).flash!.index).toBe(1);expect((await snapshot(page)).progress[333].attempts).toBe(2);
});

test('multi-select retries, a short final window and completion survive reload',async({page})=>{
  await seedDeck(page,[350,334]);
  await page.keyboard.press('3');await expect(page.locator('.feedback-banner')).toHaveCount(0);
  expect((await snapshot(page)).progress[350]).toBeUndefined();
  await page.keyboard.press('4');await ready(page);
  await expect(page.locator('.feedback-banner')).toContainText('Chưa đúng');
  await page.keyboard.press('Enter');
  await expect(page.locator('.choice-button[aria-pressed=true]')).toHaveCount(0);
  await page.keyboard.press('1');await page.keyboard.press('2');await ready(page);
  await expect(page.locator('.answer-label')).toHaveText('Đáp án đúng: A + B');
  await page.keyboard.press('Space');await ready(page);
  await expect(page.locator('.flash-loop-window li')).toHaveCount(1);
  await page.keyboard.press('2');await ready(page);await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Đã hoàn thành bộ thẻ!'})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Đã hoàn thành bộ thẻ!'})).toBeVisible();
  expect((await snapshot(page)).progress[350].attempts).toBe(2);expect((await snapshot(page)).progress[334].attempts).toBe(1);
});

test('loop fits mobile, supports reduced motion and keeps source and empty filters usable',async({page})=>{
  await page.getByLabel('Nguồn câu hỏi',{exact:true}).selectOption('udemy');
  await expect(page.locator('.question-origin')).toContainText('Udemy · MLA-C01 Q001');
  await page.keyboard.press('4');await ready(page);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/flash-loop-mobile.png',fullPage:true,animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.quick-question').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.getByRole('button',{name:'Đã lưu',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Không còn thẻ trong nhóm này'})).toBeVisible();
  await page.getByRole('button',{name:'Tất cả',exact:true}).click();
  await expect(page.locator('.flash-loop-window li')).toHaveCount(10);
  await page.reload();await expect(page.getByLabel('Nguồn câu hỏi',{exact:true})).toHaveValue('udemy');
});

test('the assistant receives the loop choice and follows the new question without losing chat',async({page})=>{
  const requests:any[]=[];
  await page.route('**/api/chat',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{configured:true,model:'test-model'}});
    requests.push(route.request().postDataJSON());
    return route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'done',text:'Giải thích theo câu đang mở.'})+'\n'});
  });
  await page.reload();await ready(page);
  await page.getByLabel('Mã truy cập bot', {exact:true}).fill('local-test-code-long');
  await page.getByRole('button',{name:'Dùng mã này',exact:true}).click();
  await page.locator('.choice-button').first().click();await ready(page);
  await page.getByLabel('Câu hỏi cho trợ lý').fill('Vì sao sai?');await page.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  await expect.poll(()=>requests.length).toBe(1);
  expect(requests[0].context).toMatchObject({kind:'question',id:333,study:{page:'flashcards',selected:['A'],revealed:true}});
  await page.locator('.choice-button').nth(2).click();await ready(page);
  await page.getByRole('button',{name:'Câu tiếp · Thêm thẻ mới',exact:true}).click();await ready(page);
  await expect(page.locator('.assistant-topic')).toContainText('#334');
  await expect(page.locator('.assistant-thread')).toContainText('Vì sao sai?');
  await page.getByLabel('Câu hỏi cho trợ lý').fill('Câu này cần nhớ gì?');await page.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  await expect.poll(()=>requests.length).toBe(2);
  expect(requests[1].context).toMatchObject({id:334,study:{selected:[],revealed:false}});
});

import { test, expect } from '@playwright/test';
import { emptyState, defaultSettings } from '../src/domain';
import { onboard, snapshot } from './helpers';
test('retired original source disappears and its saved flash deck falls back without losing progress',async({page})=>{
  const old={...emptyState(),known:[1001,333],progress:{1001:{attempts:3,correct:2,latest:true,lastSeen:2000},333:{attempts:1,correct:1,latest:true,lastSeen:2000}},flash:{ids:[1001,1002],index:1,origin:'original' as const,collection:'mla' as const,mode:'classic' as const}};
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),old);
  await onboard(page);await expect(page.locator('.bank-card')).toContainText('437 câu hỏi');
  await page.goto('/#/practice');await expect(page.locator('option[value="1001-1352"]')).toHaveCount(0);
  await page.goto('/#/library');await expect(page.locator('option[value="original"]')).toHaveCount(0);
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#1001');await expect(page.locator('.library-card')).toHaveCount(0);
  await page.goto('/#/flashcards');await expect(page.getByLabel('Nguồn câu hỏi',{exact:true})).toHaveValue('imported');
  await expect(page.locator('.question-origin')).toContainText('MLA-C01');
  expect((await snapshot(page)).flash!.ids.every(id=>id<1001)).toBe(true);
  expect((await snapshot(page)).progress[1001]).toEqual(old.progress[1001]);
  expect((await snapshot(page)).known).toContain(1001);
  await page.reload();await expect(page.getByLabel('Nguồn câu hỏi',{exact:true})).toHaveValue('imported');
});
test('old original running session does not block a new retained session or disappear from backup',async({page})=>{
  const active={id:'retired-original',mode:'practice' as const,questionIds:[1001],index:0,answers:{1001:['A']},revealed:[1001],flagged:[],startedAt:1000,deadline:null,finishedAt:null,finishReason:null,settings:{...defaultSettings,count:1,range:'1001-1352'}};
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),{...emptyState(),active});
  await onboard(page);await page.goto('/#/session');await expect(page.locator('.session-screen')).toHaveCount(0);
  await page.goto('/');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();
  expect((await snapshot(page)).active!.questionIds.every(id=>id<1001)).toBe(true);
  await page.goto('/#/progress');const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất bản sao JSON',exact:true}).click();
  const stream=await (await downloaded).createReadStream();const chunks=[];for await(const chunk of stream!)chunks.push(chunk);
  const backup=JSON.parse(Buffer.concat(chunks).toString());expect(backup.rows.find((r:any)=>r.key==='session:retired-original').value).toEqual(active);
});

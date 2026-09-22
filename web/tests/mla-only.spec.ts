import { test, expect } from '@playwright/test';
import { emptyState, defaultSettings } from '../src/domain';
import { onboard, snapshot } from './helpers';

test('all web study modes expose only MLA questions and no MLS selector',async({page})=>{
  await onboard(page);
  await expect(page.locator('.bank-card')).toContainText('594 câu hỏi');
  await expect(page.locator('.bank-card')).not.toContainText('MLS');
  await page.goto('/#/exam');
  await expect(page.locator('.pool-count')).toContainText('562 câu');
  await expect(page.getByRole('combobox',{name:'Bộ đề',exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Bao gồm câu về dịch vụ cũ')).toHaveCount(0);
  await page.getByLabel('Số câu hỏi',{exact:true}).fill('562');
  await page.getByRole('button',{name:'Bắt đầu thi thử',exact:true}).click();
  const ids=(await snapshot(page)).active!.questionIds;
  expect(ids).toHaveLength(562);expect(ids.every(id=>id>332)).toBe(true);
  await page.goto('/#/library');
  await expect(page.locator('.library-count')).toContainText('594 câu hỏi');
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('#269');
  await expect(page.locator('.library-card')).toHaveCount(0);
  await page.getByRole('textbox',{name:'Tìm câu hỏi'}).fill('mla-c01 q228');
  await expect(page.locator('.library-card-meta')).toContainText('#559');
  await page.goto('/#/flashcards');
  expect((await snapshot(page)).flash!.ids.every(id=>id>332)).toBe(true);
});

test('old mixed backups remain intact while sessions, flashcards and statistics display MLA only',async({page})=>{
  const finished={id:'old-mlp',mode:'practice' as const,questionIds:[271],index:0,answers:{271:['A']},revealed:[271],flagged:[271],startedAt:1000,deadline:null,finishedAt:2000,finishReason:'manual' as const,settings:{...defaultSettings,collection:'mls' as const,count:1}};
  const active={...finished,id:'old-mixed',questionIds:[271,333],answers:{271:['A'],333:['C']},settings:{...defaultSettings,collection:'all' as const,count:2},finishedAt:null,finishReason:null};
  const legacy={...emptyState(),updatedAt:2000,bookmarks:[269,334],known:[271,333],progress:{271:{attempts:10,correct:0,latest:false,lastSeen:2000},333:{attempts:1,correct:1,latest:true,lastSeen:2000}},history:[finished],active,flash:{ids:[70,333,269,334],index:2}};
  await page.goto('/');await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),legacy);
  await onboard(page);
  await expect(page.getByRole('region',{name:'Thống kê học tập'})).toContainText('100%');
  await page.goto('/#/results/old-mlp');await expect(page.locator('.results-page')).toHaveCount(0);
  await page.goto('/#/progress');await expect(page.locator('.history-row,.unfinished-row')).toHaveCount(0);
  await page.goto('/#/flashcards');await expect(page.locator('.question-origin')).toContainText('MLA-C01 Q002');
  expect((await snapshot(page)).flash).toMatchObject({ids:[333,334],index:1,collection:'mla'});
  await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  expect((await snapshot(page)).known).toEqual([271,333,334]);
  await page.goto('/');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();
  expect((await snapshot(page)).active!.questionIds.every(id=>id>332)).toBe(true);
  await page.goto('/#/progress');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Xuất bản sao JSON',exact:true}).click();
  const stream=await (await downloadPromise).createReadStream();const chunks=[];for await(const chunk of stream!)chunks.push(chunk);
  const backup=JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.rows.find((r:any)=>r.key==='session:old-mlp').value).toEqual(finished);
  expect(backup.rows.find((r:any)=>r.key==='session:old-mixed').value).toEqual(active);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ml-practice:v1')!))).toEqual(legacy);
});

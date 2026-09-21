import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';

test('welcome, name selection and per-profile history work on mobile',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Hôm nay ai đang học?'})).toBeVisible();
  await page.screenshot({path:'test-results/welcome-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/welcome-mobile.png',fullPage:true});
  await page.getByLabel('Tên người học',{exact:true}).fill('Duy');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();await expect(page.getByRole('button',{name:'Đang học: Duy'})).toBeVisible();
  await page.goto('/#/flashcards');await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  await page.getByRole('button',{name:'Đang học: Duy'}).click();await page.getByRole('button',{name:'Đổi người học'}).click();
  await page.getByLabel('Tên người học',{exact:true}).fill('An');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();expect((await snapshot(page)).known).toEqual([]);
  await page.getByRole('button',{name:'Đang học: An'}).click();await page.getByRole('button',{name:'Đổi người học'}).click();await page.locator('.saved-learners button').filter({hasText:'Duy'}).click();expect((await snapshot(page)).known).toEqual([2]);
  await page.getByRole('button',{name:'Đang học: Duy'}).click();await page.screenshot({path:'test-results/profile-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('two tabs start independent sessions, then combine history without losing answers',async({page,context})=>{
  await onboard(page,'Duy');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await page.locator('.choice-button').first().click();const first=(await snapshot(page)).active!;
  const tab=await context.newPage();await tab.goto('/');await tab.locator('.saved-learners button').filter({hasText:'Duy'}).click();await tab.getByRole('button',{name:'Học nhanh 10 câu'}).click();await tab.locator('.choice-button').last().click();const second=(await snapshot(tab)).active!;
  expect(first.id).not.toBe(second.id);expect((await snapshot(page)).active!.answers).toEqual(first.answers);expect((await snapshot(tab)).active!.answers).toEqual(second.answers);
  await page.getByRole('button',{name:'Kết thúc',exact:true}).click();
  await expect(tab.locator('.session-screen')).toBeVisible();await tab.getByRole('button',{name:'Kết thúc',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).history.length).toBe(2);expect((await snapshot(page)).history.find(s=>s.id===first.id)!.answers).toEqual(first.answers);
});

test('continuing an unfinished session moves control to the selected tab',async({page,context})=>{
  await onboard(page,'Duy');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await page.locator('.choice-button').first().click();
  const active=(await snapshot(page)).active!;
  const tab=await context.newPage();await tab.goto('/');await tab.locator('.saved-learners button').filter({hasText:'Duy'}).click();await tab.getByRole('link',{name:'Tiến trình của tôi',exact:true}).click();await tab.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await expect(tab.locator('.session-screen')).toBeVisible();expect((await snapshot(tab)).active!.answers).toEqual(active.answers);
  await expect(page.locator('.session-screen')).toHaveCount(0);expect((await snapshot(page)).active).toBeNull();
});

test('shared history is read only and toggling sharing controls its listing',async({page})=>{
  await onboard(page,'Duy');await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await page.locator('.choice-button').first().click();await page.getByRole('button',{name:'Kết thúc',exact:true}).click();
  await page.getByRole('button',{name:'Đang học: Duy'}).click();await page.getByRole('checkbox',{name:'Chia sẻ lịch sử học tập'}).check();await page.getByRole('button',{name:'Đổi người học'}).click();
  await page.getByLabel('Tên người học',{exact:true}).fill('An');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();await page.getByRole('link',{name:'Học chung',exact:true}).click();
  await page.locator('.group-person').filter({hasText:'Duy'}).click();await expect(page.locator('.group-session')).toHaveCount(1);await page.screenshot({path:'test-results/group-desktop.png',fullPage:true});
  await page.locator('.group-session').click();await expect(page.getByText('Chỉ xem · Không thay đổi tiến trình của bạn')).toBeVisible();expect((await snapshot(page)).history).toHaveLength(0);
  await page.getByRole('button',{name:'Đang học: An'}).click();await page.getByRole('button',{name:'Đổi người học'}).click();await page.locator('.saved-learners button').filter({hasText:'Duy'}).click();await page.getByRole('button',{name:'Đang học: Duy'}).click();await page.getByRole('checkbox',{name:'Chia sẻ lịch sử học tập'}).uncheck();await page.getByRole('link',{name:'Học chung',exact:true}).click();await expect(page.locator('.group-person')).toHaveCount(0);
});

test('existing v1 progress migrates only to the chosen profile and remains recoverable',async({page})=>{
  await page.goto('/');const legacy={version:1,updatedAt:1,bookmarks:[2],known:[3],progress:{},active:null,history:[],flash:null};
  await page.evaluate(s=>localStorage.setItem('ml-practice:v1',JSON.stringify(s)),legacy);await page.reload();await expect(page.getByRole('checkbox',{name:'Chuyển tiến trình cũ trên máy vào hồ sơ này'})).toBeChecked();
  await page.getByLabel('Tên người học',{exact:true}).fill('Duy');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();expect((await snapshot(page)).known).toEqual([3]);expect((await snapshot(page)).bookmarks).toEqual([2]);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ml-practice:v1')!))).toEqual(legacy);
});

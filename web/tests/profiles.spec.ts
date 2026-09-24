import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';

test('closing a tab then typing the saved name reopens its answers, cards and unfinished session',async({page,context})=>{
  await onboard(page,'Duy Nguyen');
  await page.goto('/#/flashcards');await page.getByRole('button',{name:'Lật thẻ tự đánh giá',exact:true}).click();await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  await page.goto('/#/practice');await page.getByLabel('Số câu hỏi',{exact:true}).fill('3');await page.getByRole('button',{name:'Theo thứ tự',exact:true}).click();await page.getByRole('button',{name:/^Học nhanh Chọn là chấm/}).click();await page.getByRole('button',{name:'Bắt đầu luyện tập',exact:true}).click();
  await page.locator('.quick-question').evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{})));});
  await page.keyboard.press('3');await expect(page.locator('.feedback-banner')).toBeVisible();
  const before=await snapshot(page);const profileId=await page.evaluate(()=>sessionStorage.getItem('ml-selected:v2'));
  await page.close();
  const tab=await context.newPage();await tab.goto('/#/session');
  const card=tab.locator('.saved-learners button').filter({hasText:'Duy Nguyen'});
  await expect(card).toContainText('1 thẻ đã thuộc');await expect(card).toContainText('1 bài đang làm');
  await tab.screenshot({path:'test-results/saved-learners-desktop.png',fullPage:true});
  await tab.setViewportSize({width:390,height:844});
  expect((await card.boundingBox())!.y).toBeLessThan((await tab.getByLabel('Tên người học',{exact:true}).boundingBox())!.y);
  expect(await tab.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await tab.screenshot({path:'test-results/saved-learners-mobile.png',fullPage:true});
  await tab.getByLabel('Tên người học',{exact:true}).fill('  dUY   nguyen  ');await tab.getByRole('button',{name:'Tiếp tục với Duy Nguyen',exact:true}).click();
  expect(await tab.evaluate(()=>sessionStorage.getItem('ml-selected:v2'))).toBe(profileId);
  expect(await tab.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('ml-profile:v2:')).length)).toBe(1);
  expect((await snapshot(tab)).known).toEqual(before.known);
  await tab.getByRole('button',{name:/Mở lại phiên luyện tập/}).click();
  await expect(tab.locator('.session-screen')).toBeVisible();
  const after=await snapshot(tab);expect(after.active!.id).toBe(before.active!.id);expect(after.active!.answers).toEqual(before.active!.answers);expect(after.progress).toEqual(before.progress);
  await tab.close();
});

test('duplicate saved names require choosing the profile without merging histories',async({page})=>{
  await onboard(page,'Duy');
  await page.goto('/#/flashcards');await page.getByRole('button',{name:'Lật thẻ tự đánh giá',exact:true}).click();await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  const originalId=await page.evaluate(()=>sessionStorage.getItem('ml-selected:v2'));
  await page.evaluate(()=>{
    const profile={id:crypto.randomUUID(),name:'Duy',code:'b'.repeat(64),createdAt:Date.now(),shared:false};
    localStorage.setItem(`ml-profile:v2:${profile.id}`,JSON.stringify(profile));sessionStorage.removeItem('ml-selected:v2');
  });
  await page.reload();await page.getByLabel('Tên người học',{exact:true}).fill('duy');
  await expect(page.getByRole('button',{name:'Chọn hồ sơ phía trên'})).toBeDisabled();
  await expect(page.locator('.saved-learners button')).toHaveCount(2);
  await page.locator('.saved-learners button').filter({hasText:'1 thẻ đã thuộc'}).click();
  expect(await page.evaluate(()=>sessionStorage.getItem('ml-selected:v2'))).toBe(originalId);
  expect((await snapshot(page)).known).toEqual([333]);
});

test('saved learner summaries update when another tab answers a question',async({page,context})=>{
  await onboard(page,'Duy');
  const tab=await context.newPage();await tab.goto('/');
  await expect(tab.locator('.saved-learners button')).toContainText('0 câu đã học');
  await page.getByRole('button',{name:'Học nhanh 10 câu'}).click();await page.locator('.choice-button').first().click();
  await expect(tab.locator('.saved-learners button')).toContainText('1 câu đã học');
  await expect(tab.locator('.saved-learners button')).toContainText('1 bài đang làm');
  await tab.close();
});

test('welcome, name selection and per-profile history work on mobile',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Hôm nay ai đang học?'})).toBeVisible();
  await page.screenshot({path:'test-results/welcome-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/welcome-mobile.png',fullPage:true});
  await page.getByLabel('Tên người học',{exact:true}).fill('Duy');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();await expect(page.getByRole('button',{name:'Đang học: Duy'})).toBeVisible();
  await page.goto('/#/flashcards');await page.getByRole('button',{name:'Lật thẻ tự đánh giá',exact:true}).click();await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  await page.getByRole('button',{name:'Đang học: Duy'}).click();await page.getByRole('button',{name:'Đổi người học'}).click();
  await page.getByLabel('Tên người học',{exact:true}).fill('An');await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();expect((await snapshot(page)).known).toEqual([]);
  await page.getByRole('button',{name:'Đang học: An'}).click();await page.getByRole('button',{name:'Đổi người học'}).click();await page.locator('.saved-learners button').filter({hasText:'Duy'}).click();expect((await snapshot(page)).known).toEqual([333]);
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

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { onboard, snapshot } from './helpers';

const code = 'test-private-bot-access-12345';
const answer = '**Managed warm pools** giữ tài nguyên sẵn sàng.\n\n[AWS](https://docs.aws.amazon.com/sagemaker/latest/dg/train-warm-pools.html)';
async function mockAI(page: Page, requests: any[], beforeReply?: () => Promise<void>) {
  await page.route('**/api/chat', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true, requiresAccessCode: true, model: 'gpt-5-mini' } });
    requests.push(route.request().postDataJSON());
    if (route.request().headers().authorization !== `Bearer ${code}`) return route.fulfill({ status: 401, json: { error: 'Mã truy cập bot chưa đúng.' } });
    await beforeReply?.();
    await route.fulfill({ contentType: 'application/x-ndjson', body: [{ type: 'delta', text: '**Managed ' }, { type: 'delta', text: 'warm pools**' }, { type: 'done', text: answer }].map(event => JSON.stringify(event)).join('\n') + '\n' }).catch(() => {});
  });
}
async function unlock(page: Page, value = code) {
  await page.getByLabel('Mã truy cập bot', { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Dùng mã này', exact: true }).click();
}

test('an unconfigured bot gives a clear state without making an OpenAI call', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Mở trợ lý AI' }).click();
  await expect(page.getByRole('dialog')).toContainText('Trợ lý chưa được kích hoạt');
  await expect(page.getByLabel('Câu hỏi cho trợ lý')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Gửi câu hỏi', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Đóng trợ lý AI' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('question chat uses its ID, saves messages, renders citations and never triggers quiz shortcuts', async ({ page }) => {
  const requests: any[] = []; await mockAI(page, requests); await onboard(page);
  await page.goto('/#/practice');
  await page.getByLabel('Số câu hỏi', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Theo thứ tự', exact: true }).click();
  await page.getByRole('button', { name: /^Học nhanh Chọn là chấm/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true }).click();
  await page.getByRole('button', { name: 'Đến câu 2', exact: true }).click();
  await page.getByRole('button', { name: 'Hỏi AI về câu này', exact: true }).click();
  await expect(page.locator('.assistant-topic')).toContainText('Câu #334');
  await unlock(page);
  await page.getByLabel('Câu hỏi cho trợ lý').fill('So sánh lựa chọn 1234 và giải thích bằng tiếng Việt.');
  await page.getByLabel('Tra tài liệu AWS', { exact: true }).check();
  await page.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  await expect(page.locator('.assistant-message.assistant strong')).toHaveText('Managed warm pools');
  await expect(page.getByRole('link', { name: 'AWS', exact: true })).toHaveAttribute('href', /https:\/\/docs.aws.amazon.com/);
  expect(requests).toHaveLength(1);
  expect(requests[0].context).toEqual({ kind: 'question', id: 334 });
  expect(requests[0].webSearch).toBe(true);
  expect((await snapshot(page)).active!.answers).toEqual({});
  await page.screenshot({ path: 'test-results/assistant-desktop.png' });
  await page.getByRole('button', { name: 'Đóng trợ lý AI' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Hỏi AI về câu này', exact: true }).click();
  await expect(page.locator('.assistant-message.assistant strong')).toHaveText('Managed warm pools');
  await page.getByLabel('Câu hỏi cho trợ lý').fill('Cho tôi ví dụ khác.');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].messages).toHaveLength(3);
  await expect(page.getByRole('button', { name: 'Gửi câu hỏi' })).toBeVisible();
  await page.getByRole('button', { name: 'Chuyển sang hỏi chung' }).click();
  await expect(page.locator('.assistant-message')).toHaveCount(0);
});

test('Keywork sends its own context and the chat fits mobile without changing mastery', async ({ page }) => {
  const requests: any[] = []; await mockAI(page, requests); await onboard(page);
  await page.goto('/#/keywork');
  await page.getByLabel('Tìm kiến thức Keywork').fill('Representative');
  await page.getByRole('button', { name: 'Bắt đầu học', exact: true }).click();
  await page.getByRole('button', { name: 'Hỏi AI về nội dung này', exact: true }).click();
  await unlock(page);
  await page.getByLabel('Câu hỏi cho trợ lý').fill('Giải thích 1 2 3 4');
  await page.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  await expect(page.locator('.assistant-message.assistant strong')).toBeVisible();
  expect(requests[0].context.kind).toBe('keyword');
  expect(requests[0].context.id).toMatch(/^d[1-4]-p[1-4]-/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Câu hỏi cho trợ lý')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Đóng trợ lý AI' })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/assistant-mobile.png' });
  await page.getByRole('button', { name: 'Đóng trợ lý AI' }).click();
  await expect(page.locator('.kw-feedback')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Xem đáp án', exact: true })).toBeVisible();
});

test('exam and hidden practice disable the tutor until the session ends', async ({ page }) => {
  await onboard(page); await page.goto('/#/exam');
  await page.getByLabel('Số câu hỏi', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Bắt đầu thi thử', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở trợ lý AI' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Hỏi AI về câu này' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await page.getByRole('button', { name: 'Nộp và xem kết quả', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở trợ lý AI' })).toBeEnabled();
  await page.goto('/#/practice');
  await page.getByLabel('Số câu hỏi', { exact: true }).fill('1');
  await page.getByRole('button', { name: /^Tự kiểm tra/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở trợ lý AI' })).toBeDisabled();
});

test('wrong codes can be corrected and stopping a request keeps a retryable incomplete reply', async ({ page }) => {
  const requests: any[] = []; let finish!: () => void;
  const gate = new Promise<void>(resolve => { finish = resolve; });
  await mockAI(page, requests, () => gate); await onboard(page);
  await page.getByRole('button', { name: 'Mở trợ lý AI' }).click();
  await unlock(page, 'this-is-a-wrong-code-123');
  await page.getByLabel('Câu hỏi cho trợ lý').fill('So sánh Batch Transform và async inference');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.getByRole('alert')).toContainText('Mã truy cập bot chưa đúng');
  await unlock(page);
  await page.getByRole('button', { name: 'Thử lại câu vừa hỏi' }).click();
  await expect(page.getByRole('button', { name: 'Dừng trả lời' })).toBeVisible();
  await page.getByLabel('Câu hỏi cho trợ lý').press('Enter');
  expect(requests).toHaveLength(2);
  await page.getByRole('button', { name: 'Dừng trả lời' }).click();
  await expect(page.getByRole('alert')).toContainText('Đã dừng trả lời');
  await expect(page.locator('.assistant-incomplete')).toHaveText('Chưa hoàn tất');
  finish();
  await page.getByRole('button', { name: 'Thử lại câu vừa hỏi' }).click();
  await expect(page.locator('.assistant-message.assistant strong')).toHaveText('Managed warm pools');
  await expect(page.locator('.assistant-message.user')).toHaveCount(1);
});

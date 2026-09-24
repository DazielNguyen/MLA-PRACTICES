import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { composeState } from '../src/sync/records';
import { readFileSync } from 'node:fs';
import type { Question } from '../src/domain';
const bank:Question[]=JSON.parse(readFileSync(new URL('../src/data/questions.json',import.meta.url),'utf8'));
export async function onboard(page:Page,name='Duy') {
  await page.goto('/');await page.getByLabel('Tên người học',{exact:true}).fill(name);await page.getByRole('button',{name:'Tạo hồ sơ và bắt đầu'}).click();await expect(page.getByRole('heading',{name:/Mỗi ngày một chút/})).toBeVisible();
}
export async function snapshot(page:Page) {
  const { rows,active,writer }=await page.evaluate(()=>{
    const id=sessionStorage.getItem('ml-selected:v2');
    const rows=Object.keys(localStorage).filter(k=>k.startsWith(`ml-row:v2:${id}:`)).map(k=>JSON.parse(localStorage.getItem(k)!));
    return {rows,active:sessionStorage.getItem(`ml-active:v2:${id}`),writer:sessionStorage.getItem('ml-tab:v2')!};
  });
  return composeState(rows,active,writer,bank);
}

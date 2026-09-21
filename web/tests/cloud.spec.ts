import { test, expect } from '@playwright/test';
import { onboard, snapshot } from './helpers';
import type { BrowserContext } from '@playwright/test';

test.use({baseURL:'http://127.0.0.1:5174'});
test('Supabase adapter retries queued edits and restores a profile on another device',async({page,context,browser})=>{
  const profiles=new Map<string,{id:string;name:string;code:string;shared:boolean;created_at:string}>();
  const records=new Map<string,Map<string,any>>();let failWrites=false,signupCount=0;
  async function mock(context:BrowserContext){await context.route('https://ml-practice-test.supabase.co/**',async route=>{
    const request=route.request(),url=new URL(request.url()),body=request.method()==='POST'?request.postDataJSON():{};
    const respond=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(url.pathname==='/auth/v1/signup'){
      signupCount++;const user={id:`00000000-0000-4000-8000-${String(signupCount).padStart(12,'0')}`,aud:'authenticated',role:'authenticated',email:'',phone:'',created_at:new Date().toISOString(),app_metadata:{provider:'anonymous',providers:['anonymous']},user_metadata:{},identities:[],is_anonymous:true};
      const payload=Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
      return respond({access_token:`eyJhbGciOiJIUzI1NiJ9.${payload}.test`,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user});
    }
    const method=url.pathname.split('/').at(-1);
    if(method==='ml_ensure_profile'){
      if(!profiles.has(body.p_id)){profiles.set(body.p_id,{id:body.p_id,name:body.p_name,code:body.p_code,shared:false,created_at:new Date().toISOString()});records.set(body.p_id,new Map());}
      const p=profiles.get(body.p_id)!;return respond({id:p.id,name:p.name,shared:p.shared});
    }
    if(method==='ml_push_rows'){
      if(failWrites)return respond({message:'Test network unavailable',code:'503'},503);
      const rows=records.get(body.p_profile_id)!;for(const row of body.p_rows){const {dirty,claim,...clean}=row;rows.set(row.key,clean);}return respond(body.p_rows.map((r:any)=>rows.get(r.key)));
    }
    if(method==='ml_records'){const id=url.searchParams.get('profile_id')!.replace(/^eq\./,'');return respond([...records.get(id)!.values()]);}
    if(method==='ml_restore_profile'){const p=[...profiles.values()].find(p=>p.code===body.p_code);return p?respond(p):respond({message:'Không tìm thấy hồ sơ.',code:'P0001'},400);}
    if(method==='ml_set_sharing'){profiles.get(body.p_id)!.shared=body.p_shared;return respond(null);}
    if(method==='ml_shared_profiles')return respond([...profiles.values()].filter(p=>p.shared).map(p=>({id:p.id,name:p.name,sessions:[...records.get(p.id)!.values()].filter(r=>r.kind==='session'&&r.value.finishedAt!==null).length,latest:null})));
    if(method==='ml_shared_history')return respond([...records.get(body.p_id)!.values()].filter(r=>r.kind==='session'&&r.value.finishedAt!==null).map(r=>r.value));
    return respond({message:`Unexpected test request: ${url.pathname}`},400);
  });}
  await mock(context);await onboard(page,'Duy');await page.getByRole('button',{name:'Đang học: Duy'}).click();await expect(page.getByRole('button',{name:'Xem mã tiếp tục'})).toBeVisible();
  await expect(page.getByText('Các thay đổi đã được gửi lên Supabase.')).toBeVisible();await page.getByRole('button',{name:'Xem mã tiếp tục'}).click();const code=await page.getByLabel('Mã hồ sơ riêng').inputValue();expect(code).toMatch(/^[a-f0-9]{64}$/);
  await page.getByRole('link',{name:'Flashcard',exact:true}).click();await page.getByRole('button',{name:'Lật thẻ',exact:true}).click();failWrites=true;await page.getByRole('button',{name:'Đã thuộc',exact:true}).last().click();
  await page.getByRole('button',{name:'Đang học: Duy'}).click();await expect(page.getByText('Chưa kết nối được. Thay đổi vẫn được giữ trên máy và sẽ thử gửi lại.')).toBeVisible();expect((await snapshot(page)).known).toEqual([2]);
  failWrites=false;await page.getByRole('button',{name:'Đồng bộ ngay',exact:true}).click();await expect(page.getByText('Các thay đổi đã được gửi lên Supabase.')).toBeVisible();
  const other=await browser.newContext({baseURL:'http://127.0.0.1:5174'});await mock(other);const otherPage=await other.newPage();await otherPage.goto(`/#/join/${code}`);await otherPage.getByRole('button',{name:'Mở hồ sơ bằng mã'}).click();await expect(otherPage.getByRole('button',{name:'Đang học: Duy'})).toBeVisible();
  await expect.poll(async()=>(await snapshot(otherPage)).known).toEqual([2]);expect(await otherPage.evaluate(()=>location.hash)).toBe('#/');expect(profiles.size).toBe(1);expect(signupCount).toBe(2);
  await other.close();
});

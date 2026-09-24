import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyState, createSession, defaultSettings, finishSession, revealAnswer } from '../domain.ts';
import type { Question, State } from '../domain.ts';
import { composeState, validateBackup, validateRow } from './records.ts';
import { ProgressRepository, createLearner, getProfiles, read, tabSet } from './local.ts';
const bank:Question[]=JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url),'utf8'));
class MemoryStorage {
  values=new Map<string,string>();
  get length(){return this.values.size;}
  key(index:number){return [...this.values.keys()][index]??null;}
  getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){this.values.set(key,String(value));}
  removeItem(key:string){this.values.delete(key);}
}
Object.defineProperty(globalThis,'localStorage',{value:new MemoryStorage(),configurable:true});
Object.defineProperty(globalThis,'sessionStorage',{value:new MemoryStorage(),configurable:true});
Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
const settings={...defaultSettings,count:1,order:'sequential' as const};
const q=bank.find(q=>q.id===334)!;
const make=()=>new ProgressRepository(createLearner('Duy'),bank,crypto.randomUUID());
const start=(repo:ProgressRepository)=>{const session=createSession([q],settings,'practice');repo.update(s=>({...s,active:session}));return session;};
const finish=(repo:ProgressRepository)=>repo.update(s=>finishSession(s,bank));
test('identical display names retain separate IDs and progress',()=>{
  const a=make(),b=make();assert.notEqual(a.learner.id,b.learner.id);start(a);a.update(s=>({...s,bookmarks:[334]}));assert.deepEqual(b.state().bookmarks,[]);assert.equal(b.state().active,null);assert.equal(getProfiles().filter(p=>p.name==='Duy').length,2);
});
test('separate tabs keep independent session rows and combine completed history',()=>{
  const a=make(),b=new ProgressRepository(a.learner,bank,crypto.randomUUID());
  const sa=start(a),sb=start(b);
  assert.equal(a.rows().filter(r=>r.kind==='session').length,2);
  // Each browser tab has its own sessionStorage active pointer.
  tabSet(a.activeKey,sa.id);assert.equal(a.state().active?.id,sa.id);finish(a);
  tabSet(b.activeKey,sb.id);assert.equal(b.state().active?.id,sb.id);finish(b);
  assert.equal(a.state().history.length,2);assert.equal(new Set(a.state().history.map(s=>s.id)).size,2);
});
test('a resumed session transfers ownership and stops the old tab from editing',()=>{
  const a=make(),b=new ProgressRepository(a.learner,bank,crypto.randomUUID());const sa=start(a);
  b.resume(sa.id);assert.equal(b.state().active?.id,sa.id);assert.equal(a.state().active,null);
  a.update(s=>s.active?{...s,active:{...s.active,index:20}}:s);assert.equal(b.state().active?.index,0);
});
test('one graded answer contributes once across check, finish, replay and sync',()=>{
  const repo=make();start(repo);repo.update(s=>({...s,active:{...s.active!,answers:{334:['B']}}}));repo.update(s=>revealAnswer(s,q));repo.update(s=>revealAnswer(s,q));finish(repo);
  assert.equal(repo.state().progress['334'].attempts,1);const backup=repo.backup();repo.importBackup(backup);assert.equal(repo.state().progress['334'].attempts,1);
  for(const row of repo.rows())repo.mergeRemote(row,row);assert.equal(repo.state().progress['334'].attempts,1);
});
test('review answer attempts survive repository writes, backups and remote merges',()=>{
  const review=bank.find(q=>q.id===337)!;
  const repo=make(), session=createSession([review],settings,'practice',1000);
  repo.update(s=>({...s,active:{...session,answers:{337:['D']}}}));
  repo.update(s=>revealAnswer(s,review,2000));finish(repo);
  assert.equal(repo.state().progress[337].attempts,1);assert.equal(repo.state().progress[337].correct,1);
  const backup=validateBackup(repo.backup(),bank);repo.importBackup(backup);
  for (const row of repo.rows()) repo.mergeRemote(row,row);
  assert.equal(repo.state().progress[337].attempts,1);
  assert.equal(repo.rows().filter(row=>row.kind==='attempt').length,1);
});
test('previously unscored review answers are projected once without changing saved sessions',()=>{
  const review=bank.find(q=>q.id===337)!;
  const session={...createSession([review],settings,'practice',1000),answers:{337:['D']},revealed:[337]};
  const row={key:`session:${session.id}`,kind:'session' as const,value:session,stamp:2000,writer:'old-tab'};
  const rows=[row], original=structuredClone(rows);
  const project=()=>composeState(rows,session.id,'old-tab',bank);
  assert.equal(project().progress[337].correct,1);assert.deepEqual(rows,original);
  assert.deepEqual(composeState([{...row,stamp:9000}],session.id,'old-tab',bank).progress,project().progress);
  const key=`attempt:${session.id}:337`;
  const attempt={key,kind:'attempt' as const,stamp:2100,writer:'old-tab',value:{questionId:337,sessionId:session.id,correct:true,lastSeen:2000}};
  assert.equal(composeState([...rows,attempt],session.id,'old-tab',bank).progress[337].attempts,1);
  const legacy={key:'baseline:legacy',kind:'baseline' as const,stamp:2200,writer:'old-tab',value:{progress:{},covered:[key]}};
  assert.equal(composeState([...rows,legacy],session.id,'old-tab',bank).progress[337].attempts,1);
  const withCounts={...legacy,value:{progress:project().progress,covered:[key]}};
  assert.equal(composeState([...rows,withCounts],session.id,'old-tab',bank).progress[337].attempts,1);
  const hidden={...row,value:{...session,revealed:[],settings:{...settings,feedback:'end' as const}}};
  assert.equal(composeState([hidden],session.id,'old-tab',bank).progress[337],undefined);
  const finished={...hidden,value:{...hidden.value,answers:{337:['A']},finishedAt:3000,finishReason:'manual' as const}};
  assert.equal(composeState([finished],null,'old-tab',bank).progress[337].latest,false);
  const blank={...finished,value:{...finished.value,answers:{}}};
  assert.equal(composeState([blank],null,'old-tab',bank).progress[337],undefined);
});
test('independent tab grades accumulate without overwriting the other tab',()=>{
  const a=make(),b=new ProgressRepository(a.learner,bank,crypto.randomUUID());
  const sa=start(a),sb=start(b);
  tabSet(a.activeKey,sa.id);a.update(s=>({...s,active:{...s.active!,answers:{334:['B']}}}));finish(a);
  tabSet(b.activeKey,sb.id);b.update(s=>({...s,active:{...s.active!,answers:{334:['A']}}}));finish(b);
  assert.equal(a.state().progress['334'].attempts,2);assert.equal(a.state().progress['334'].correct,1);
});
test('an old network acknowledgement cannot erase an edit made in flight',()=>{
  const repo=make();repo.update(s=>({...s,known:[334]}));const sent=repo.rows()[0];repo.update(s=>({...s,known:[]}));repo.mergeRemote(sent,sent);
  assert.equal(repo.rows()[0].dirty,true);assert.deepEqual(repo.state().known,[]);
});
test('failed writes remain available in memory even when old disk data exists',()=>{
  const repo=make();repo.update(s=>({...s,known:[334]}));const save=localStorage.setItem;
  localStorage.setItem=()=>{throw new Error('quota');};repo.update(s=>({...s,known:[]}));assert.deepEqual(repo.state().known,[]);localStorage.setItem=save;
});
test('legacy migration keeps original bytes and does not mix into the next learner',()=>{
  const repo=make();const original={...emptyState(),known:[334],progress:{334:{attempts:5,correct:3,latest:true,lastSeen:100}}};localStorage.setItem('ml-practice:v1',JSON.stringify(original));repo.migrateLegacy();
  assert.deepEqual(repo.state().known,[334]);assert.equal(repo.state().progress['334'].attempts,5);assert.equal(read('ml-practice:v1'),JSON.stringify(original));
  const other=make();other.migrateLegacy();assert.deepEqual(other.state().progress,{});
});
test('legacy import does not double-count sessions already represented in a backup',()=>{
  const repo=make();start(repo);repo.update(s=>({...s,active:{...s.active!,answers:{334:['B']}}}));finish(repo);const old=repo.state();
  repo.importBackup(old);repo.importBackup(old);assert.equal(repo.state().progress['334'].attempts,1);
});
test('v2 backup roundtrip preserves all attempts, cards, flags and session rows',()=>{
  const a=make();start(a);a.update(s=>({...s,known:[334,333],bookmarks:[335],active:{...s.active!,answers:{334:['B']},flagged:[334]}}));finish(a);
  const b=make();b.importBackup(validateBackup(a.backup(),bank));assert.deepEqual(b.state().known.sort(),[333,334]);assert.equal(b.state().progress['334'].attempts,1);assert.deepEqual(b.state().history[0].flagged,[334]);assert.equal('code' in a.backup(),false);
});
test('invalid synced rows and backups fail validation',()=>{
  assert.throws(()=>validateBackup({version:2,name:'Duy',exportedAt:1,rows:[{key:'known:999',kind:'known',value:true,stamp:1,writer:'test'}]},bank));
  assert.throws(()=>validateRow({key:'attempt:bad:334',kind:'attempt',value:{questionId:334,sessionId:'other',correct:true,lastSeen:1},stamp:1,writer:'test'},bank));
});
test('a remote completed session is never projected as an active session',()=>{
  const repo=make(),session=start(repo);const state=finishSession(repo.state(),bank);const row={...repo.rows()[0],value:state.history[0],stamp:Date.now()+20};repo.mergeRemote(row,repo.rows()[0]);
  assert.equal(composeState(repo.rows(),session.id,repo.writer).active,null);assert.equal(repo.state().history.length,1);
});
test('an unsent ownership claim survives edits before the first cloud acknowledgement',()=>{
  const a=make(),b=new ProgressRepository(a.learner,bank,crypto.randomUUID());const session=start(a);b.resume(session.id);
  b.update(s=>({...s,active:{...s.active!,answers:{334:['B']}}}));const row=b.rows().find(r=>r.kind==='session')!;assert.equal(row.claim,true);assert.equal(row.writer,b.writer);
});

test('cached rows detect external storage changes and reject corrupted replacements',()=>{
  const repo=make();repo.update(s=>({...s,known:[334]}));
  assert.deepEqual(repo.state().known,[334]);
  const row=repo.rows().find(r=>r.key==='known:334')!;
  localStorage.setItem(repo.prefix+row.key,JSON.stringify({...row,value:false,stamp:row.stamp+1}));
  assert.deepEqual(repo.state().known,[]);
  localStorage.setItem(repo.prefix+row.key,'{"invalid":true}');
  assert.equal(repo.rows().length,0);
  localStorage.setItem(repo.prefix+row.key,JSON.stringify(row));
  assert.deepEqual(repo.state().known,[334]);
});
test('a remote acknowledgement reads its own row instead of scanning all history',()=>{
  const repo=make();repo.update(s=>({...s,known:[334,333,335,336]}));const row=repo.rows()[0];
  const original=localStorage.getItem;let reads=0;
  localStorage.getItem=function(key){reads++;return original.call(this,key);};
  try{repo.mergeRemote(row,row);assert.ok(reads<=2,`Unexpected storage scan: ${reads} reads`);}
  finally{localStorage.getItem=original;}
  assert.equal(repo.rows().find(r=>r.key===row.key)!.dirty,false);
});

test('editing MLA progress retains archived rows and their original backup values',()=>{
  const repo=make();
  const archived={id:'archived',mode:'practice' as const,questionIds:[271,333],index:0,answers:{271:['A'],333:['C']},revealed:[271,333],flagged:[],startedAt:1000,deadline:null,finishedAt:null,finishReason:null,settings:{...defaultSettings,count:2,collection:'all' as const}};
  repo.importBackup({...emptyState(),active:archived,known:[271,333],progress:{271:{attempts:1,correct:1,latest:true,lastSeen:2000},333:{attempts:1,correct:1,latest:true,lastSeen:2000}}});
  const before=repo.backup().rows.find(r=>r.key==='session:archived');
  start(repo);repo.update(s=>({...s,known:[...s.known,334]}));finish(repo);
  const backup=validateBackup(repo.backup(),bank);
  assert.deepEqual(repo.backup().rows.find(r=>r.key==='session:archived'),before);
  assert.deepEqual(repo.state().known,[271,333,334]);
  assert.equal(repo.state().progress[271].attempts,1);assert.equal(repo.state().progress[333].attempts,1);
  assert.equal(backup.version,2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {buildPendingReminders} from '../functions/src/pendingReminders.mjs';

const source=fs.readFileSync(new URL('../functions/src/index.ts',import.meta.url),'utf8');
const code=stripTypeScriptTypes(source.slice(source.indexOf('export const notifyPendingReminders')).split('\nexport const ')[0].replace('export const notifyPendingReminders','const notifyPendingReminders'));

test('pending scheduler deduplicates a day, repeats the next day and stops after read/completion',async()=>{
  let now=Date.parse('2026-11-02T12:00:00Z');
  const records={messages:[{id:'m1',threadId:'t1',senderId:'sender',participants:['sender','u1'],readBy:[],timestamp:now-86400000}],activities:[{id:'a1',status:'pending',assigneeIds:['u1'],updatedAt:now-86400000}]};
  const receipts=new Map();
  const sent=[];
  const collection=name=>({select(){return this;},async get(){return {docs:records[name].map(record=>({id:record.id,data:()=>record}))};},doc(id){return {id,async set(data){receipts.set(id,data);},async delete(){receipts.delete(id);}};}});
  const db={collection:()=>({get:async()=>({docs:[{id:'c1',ref:{collection}}]})}),runTransaction:async fn=>fn({get:async ref=>({exists:receipts.has(ref.id),data:()=>receipts.get(ref.id)}),set:(ref,data)=>receipts.set(ref.id,data)})};
  let handler;
  vm.runInNewContext(code,{
    console,Date:{now:()=>now},getFirestore:()=>db,buildPendingReminders,
    saoPauloCivilDate:()=>new Date(now).toISOString().slice(0,10),
    onSchedule:(config,callback)=>{assert.equal(config.schedule,'0 9 * * *');assert.equal(config.timeZone,'America/Sao_Paulo');handler=callback;},
    sendActivityPush:async item=>{sent.push(item);return {successCount:1,failureCount:0};},
  });
  await handler();assert.equal(sent.length,2);assert.equal(sent[0].type,'message');assert.equal(sent[1].type,'activity_update');
  await handler();assert.equal(sent.length,2);
  now+=86400000;await handler();assert.equal(sent.length,4);
  records.messages[0].readBy=['u1'];records.activities[0].status='resolved';
  now+=86400000;await handler();assert.equal(sent.length,4);
});

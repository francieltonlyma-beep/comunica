import {readFileSync} from 'node:fs';
import test from 'node:test';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('type ConversationDeadlineStage'), source.indexOf('export const saveScheduleCoverage')).replace('export const notifyConversationDeadlines', 'const notifyConversationDeadlines');
let now = '2026-11-01T12:00:00Z';
const NativeDate = Date;
class Clock extends NativeDate { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return new NativeDate(now).getTime(); } }
const sent = [];
const receipts = new Map();
const prefix = 'artifacts/comunica-salvador/public/data/companies/c1';
const document = (id, data) => ({id, data: () => data});
const records = {
  [prefix + '/messages']: [
    document('m1', {threadId:'t1', dueDate:'2026-10-15', participants:['u1'], timestamp:1}),
    document('m2', {threadId:'t2', dueDate:'2026-10-15', participants:['u1'], completedAt:1}),
    document('m3', {threadId:'t3', activity:{dueDate:'2026-10-15', status:'open', assigneeIds:['u1']}}),
    document('m4', {threadId:'t4', activity:{dueDate:'2026-10-15', status:'resolved', assigneeIds:['u1']}}),
    document('future', {threadId:'future', dueDate:'2026-12-01', participants:['u1']}),
    document('undated', {threadId:'undated', dueDate:'', participants:['u1']}),
  ],
  [prefix + '/activities']: [
    document('a1', {dueDate:'2026-10-15', status:'open', assigneeIds:['u1']}),
    document('a2', {dueDate:'2026-10-15', status:'resolved', assigneeIds:['u1']}),
  ],
  [prefix + '/users']: [document('u1', {pushTokens:['device']})],
};
function query(path, filters=[]) {
  return {where(field, op, value) { return query(path, [...filters, [field, op, value]]); }, async get() {
    if(path.endsWith('/companies')) return {docs:[{id:'c1', ref:{collection:name=>query(prefix+'/'+name)}}]};
    return {docs:(records[path] || []).filter(d=>filters.every(([field,op,value])=>{
      const actual=field.split('.').reduce((a,k)=>a?.[k],d.data());
      return op==='>' ? actual>value : actual<=value;
    }))};
  }};
}
const db = {collection:query, doc:path=>({path, async set(v){receipts.set(path,v);}, async delete(){receipts.delete(path);}}), async runTransaction(fn){return fn({async get(ref){return {exists:receipts.has(ref.path)};}, create(ref,v){receipts.set(ref.path,v);}});}};
let handler;
vm.runInNewContext(stripTypeScriptTypes(block), {
  Date:Clock, Intl, console,
  onSchedule(options, callback){assert.equal(options.schedule,'0 9 * * *');assert.equal(options.timeZone,'America/Sao_Paulo');handler=callback;},
  getFirestore:()=>db, getSupportNotificationTokens:async()=>[],
  getMessaging:()=>({async sendEachForMulticast(v){sent.push(v);return {successCount:1,failureCount:0};}}),
  messageActivityData:a=>a?.dueDate ? {...a, createdBy:'u1'} : null,
  sendActivityPush:async v=>{sent.push(v);return {successCount:1,failureCount:0};},
});
test('deadline reminders repeat daily for old unresolved items without same-day duplicates', async()=>{
  await handler(); assert.equal(sent.length,3,'old outstanding conversations and both activity types are notified');
  await handler(); assert.equal(sent.length,3,'same-day repeat does not duplicate sends');
  now='2026-11-02T12:00:00Z'; await handler(); assert.equal(sent.length,6,'outstanding items are notified again next day');
  assert.equal(receipts.size,6);
  assert([...receipts.keys()].some(k=>k.endsWith('2026-11-01')));
  assert([...receipts.keys()].some(k=>k.endsWith('2026-11-02')));
  console.log('PASS: old overdue items, both activity types, completed exclusion, future/empty exclusion, daily repetition and same-day deduplication.');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPendingReminders} from '../functions/src/pendingReminders.mjs';

const now = Date.parse('2026-11-02T12:00:00Z'); // 09:00 in São Paulo
const hour = 3600000;
const activity = {status:'pending', createdBy:'creator', assigneeIds:['owner'], createdAt:now-48*hour, updatedAt:now-24*hour};
const message = {id:'m1', threadId:'t1', senderId:'sender', participants:['sender','reader','unread','muted'], readBy:['reader'], mutedBy:['muted'], timestamp:now-12*hour};

test('only unread recipients of previous civil days receive one reminder per conversation',()=>{
  const items=buildPendingReminders([message,{...message,id:'m2',timestamp:now-13*hour}],[],now);
  assert.equal(items.length,1);
  assert.deepEqual(items[0].recipientIds,['unread']);
  assert.equal(items[0].messageId,'m1');
  assert.equal(items[0].type,'message');
  assert.equal(buildPendingReminders([{...message,timestamp:now-hour}],[],now).length,0);
  assert.equal(buildPendingReminders([{...message,timestamp:0}],[],now).length,0);
});

test('24-hour inactivity includes both sources without a due date and excludes recent updates',()=>{
  const items=buildPendingReminders([{...message,participants:[],activity}], [{...activity,id:'a1'}],now);
  assert.equal(items.length,2);
  assert(items.every(item=>item.kind==='stalled'&&item.recipientIds[0]==='owner'));
  assert.notEqual(items[0].key,items[1].key);
  assert.equal(buildPendingReminders([],[{...activity,id:'a1',updatedAt:now-23*hour}],now).length,0);
});

test('completed, silenced, missing-date and future activities do not generate reminders',()=>{
  assert.equal(buildPendingReminders([{...message,participants:[],activity,mutedBy:['owner']}],[],now).length,0);
  for(const status of ['resolved','completed','cancelled']) assert.equal(buildPendingReminders([],[{...activity,id:'a',status}],now).length,0);
  assert.equal(buildPendingReminders([],[{status:'pending',assigneeIds:['owner']}],now).length,0);
  assert.equal(buildPendingReminders([],[{...activity,updatedAt:now+hour}],now).length,0);
});

test('a new update restarts the 24-hour clock, and reminders stop when read or resolved',()=>{
  const updated={...activity,id:'a',updatedAt:now};
  assert.equal(buildPendingReminders([],[updated],now).length,0);
  assert.equal(buildPendingReminders([],[updated],now+24*hour).length,1);
  assert.equal(buildPendingReminders([],[{...updated,status:'resolved'}],now+48*hour).length,0);
  assert.equal(buildPendingReminders([{...message,readBy:message.participants}],[],now).length,0);
});

test('São Paulo midnight determines the unread cutoff, and missing assignees fall back to creator',()=>{
  assert.equal(buildPendingReminders([{...message,timestamp:Date.parse('2026-11-02T02:59:00Z')}],[],now).length,1);
  assert.equal(buildPendingReminders([{...message,timestamp:Date.parse('2026-11-02T03:01:00Z')}],[],now).length,0);
  assert.deepEqual(buildPendingReminders([],[{...activity,id:'a',assigneeIds:[]}],now)[0].recipientIds,['creator']);
});

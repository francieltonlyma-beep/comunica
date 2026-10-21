import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commitAtomicRecords } from '../src/atomicRecords.js';
const records = ['events', 'announcements'].map(collection => ({collection, id:'fixture', data:{title:'test'}}));
test('existing messages are updated and history is created in the same commit', async () => {
  const calls=[];
  await commitAtomicRecords([
    {collection:'messages',id:'existing',data:{dueDate:'2026-10-20'},operation:'update'},
    {collection:'messages',id:'history',data:{content:'changed'}},
  ],()=>({update:(ref)=>calls.push('update:'+ref),set:(ref)=>calls.push('set:'+ref),commit:async()=>calls.push('commit')}),(col,id)=>id);
  assert.deepEqual(calls,['update:existing','set:history','commit']);
});
test('related records use one awaited commit', async () => {
  const writes=[]; let committed=0;
  await commitAtomicRecords(records, () => ({set: (...args) => writes.push(args), commit: async () => { committed++; }}), (col,id) => `${col}/${id}`);
  assert.equal(committed,1); assert.equal(writes.length,2);
  assert.equal(writes[1][0],'announcements/fixture');
});
test('rejection propagates without retrying individual records', async () => {
  let attempts=0;
  await assert.rejects(commitAtomicRecords(records, () => ({set(){},commit:async()=>{attempts++;throw Error('permission-denied');}}), (col,id)=>`${col}/${id}`), /permission-denied/);
  assert.equal(attempts,1);
});
test('invalid targets and excessive batches do not start a commit', async () => {
  const factory=()=>{throw Error('should not create batch');};
  await assert.rejects(commitAtomicRecords(records,factory,()=>{throw Error('missing company');}),/missing company/);
  await assert.rejects(commitAtomicRecords(Array(451).fill(records[0]),factory,()=>''),/Quantidade/);
});
test('calendar handlers commit linked records together and preserve forms on failure', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const absence = source.split('const submitAbsence = async (e) => {')[1].split('const handleDeleteAbsence = async')[0];
  const event = source.split('const submitEvent = async (e) => {')[1].split('const handleDeleteEvent = async')[0];
  assert.match(absence, /if \(!await saveRelatedRecords\(\[\s*\{ collection: 'absences'.*?\{ collection: 'posts'.*?\]\)\) return;/s);
  assert.match(event, /const records = \[\{ collection: 'events'.*?records\.push\(\{ collection: 'announcements'.*?if \(!await saveRelatedRecords\(records\)\) return;/s);
  assert.doesNotMatch(absence, /saveDoc\('absences'/);
  assert.doesNotMatch(event, /setCalendarEvents\(/);
});
test('vacation writes presence, absence and notice in one commit', async () => {
  const calls = [];
  await commitAtomicRecords([
    { collection: 'presence', id: 'pres-1', data: { status: 'Férias' }, operation: 'update' },
    { collection: 'absences', id: 'abs-1', data: { reason: 'Férias' } },
    { collection: 'posts', id: 'post-abs-1', data: { authorId: 'system' } },
  ], () => ({
    update: ref => calls.push(`update:${ref}`),
    set: ref => calls.push(`set:${ref}`),
    commit: async () => calls.push('commit'),
  }), (collection, id) => `${collection}/${id}`);
  assert.deepEqual(calls, [
    'update:presence/pres-1',
    'set:absences/abs-1',
    'set:posts/post-abs-1',
    'commit',
  ]);
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const handler = source.split('const submitPresence = async (e) => {')[1].split('const submitAbsence = async')[0];
  assert.match(handler, /records\.push\([\s\S]*collection: 'absences'[\s\S]*collection: 'posts'/);
  assert.match(handler, /if \(!await saveRelatedRecords\(records,[\s\S]*?\)\) return;/);
  assert.doesNotMatch(handler, /saveDoc\('presence'|saveDoc\('absences'|saveDoc\('posts'/);
});
test('role cascade waits for one combined commit before reporting success', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const handler = source.split('const handleSaveRole = async (index) => {')[1].split('const handleDeleteRole = async')[0];
  assert.match(handler, /collection: 'roles'[\s\S]*collection: 'users'/);
  assert.match(handler, /if \(!await saveRelatedRecords\(\[/);
  assert.doesNotMatch(handler, /forEach\(async|await saveDoc\('roles'/);
});

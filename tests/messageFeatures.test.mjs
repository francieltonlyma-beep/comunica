import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { activityProductivityMetrics, activityRecurrenceLabel, createMessageActivity, findMentionedParticipantIds, isMessageActivityOverdue, messageActivityProgress, messageActivitySchedule, messageReplySnapshot, nextActivityDueDate, normalizeActivityTemplate, normalizeMessageActivity, toggleMessageUser } from '../src/messageFeatures.js';

test('message reactions are toggled without duplicate users', () => {
  assert.deepEqual(toggleMessageUser(['u1', 'u1'], 'u2'), ['u1', 'u2']);
  assert.deepEqual(toggleMessageUser(['u1', 'u2'], 'u1'), ['u2']);
});

test('mentions resolve first or full participant names', () => {
  const participants = [{ id: 'u1', name: 'Ana Souza' }, { id: 'u2', name: 'Bruno Lima' }];
  assert.deepEqual(findMentionedParticipantIds('Olá @Ana, fale com @Bruno Lima', participants), ['u1', 'u2']);
});

test('reply snapshot is compact and activity supports checklist workflow', () => {
  const reply = messageReplySnapshot({ id: 'm1', senderId: 'u1', senderName: 'Ana', content: 'x'.repeat(500) });
  assert.equal(reply.content.length, 240);
  const activity = createMessageActivity({ id: 'u1', name: 'Ana' });
  assert.equal(activity.status, 'pending');
  assert.equal(normalizeMessageActivity({ ...activity, priority: 'urgent', checklist: [{ id: 'i1', text: 'Conferir', completed: true }] }).checklist[0].completed, true);
});

test('activity exposes deadline and checklist progress to the service center', () => {
  const activity = normalizeMessageActivity({
    ...createMessageActivity({ id: 'u1', name: 'Ana' }),
    dueDate: '2026-10-22',
    checklist: [
      { id: 'i1', text: 'Conferir', completed: true },
      { id: 'i2', text: 'Responder', completed: false },
    ],
  });
  assert.equal(messageActivityProgress(activity), 50);
  assert.equal(isMessageActivityOverdue(activity, '2026-10-23'), true);
  assert.equal(isMessageActivityOverdue({ ...activity, status: 'resolved' }, '2026-10-23'), false);
  assert.equal(messageActivitySchedule(activity, '2026-10-21'), 'upcoming');
  assert.equal(messageActivitySchedule(activity, '2026-10-22'), 'today');
  assert.equal(messageActivitySchedule(activity, '2026-10-23'), 'overdue');
  assert.equal(messageActivitySchedule({ ...activity, dueDate: '' }, '2026-10-22'), 'no_due');
  assert.equal(messageActivitySchedule({ ...activity, status: 'resolved' }, '2026-10-22'), 'resolved');
});

test('recurring activity calculates the next civil due date', () => {
  assert.equal(nextActivityDueDate('2026-10-22', { frequency: 'daily', interval: 2 }), '2026-10-24');
  assert.equal(nextActivityDueDate('2026-10-22', { frequency: 'weekly', interval: 1 }), '2026-10-29');
  assert.equal(nextActivityDueDate('2026-01-31', { frequency: 'monthly', interval: 1 }), '2026-02-28');
  assert.equal(nextActivityDueDate('2026-10-22', { frequency: 'none' }), '');
  assert.equal(activityRecurrenceLabel({ frequency: 'weekly', interval: 1 }), 'Semanalmente');
});

test('checklist templates and productivity indicators use normalized activity data', () => {
  const template = normalizeActivityTemplate({ id: 't1', name: ' Fechamento ', priority: 'high', checklist: [{ text: 'Conferir' }, { text: '' }] });
  assert.equal(template.name, 'Fechamento');
  assert.equal(template.checklist.length, 1);
  const now = new Date('2026-10-22T12:00:00-03:00').getTime();
  const metrics = activityProductivityMetrics([
    { ...createMessageActivity(), createdAt: now - 7200000, resolvedAt: now, status: 'resolved', dueDate: '2026-10-22' },
    { ...createMessageActivity(), createdAt: now - 3600000, status: 'pending', dueDate: '2026-10-21', recurrence: { frequency: 'weekly', interval: 1 } },
  ], '2026-10-22', now);
  assert.equal(metrics.total, 2);
  assert.equal(metrics.completionRate, 50);
  assert.equal(metrics.onTimeRate, 100);
  assert.equal(metrics.overdue, 1);
  assert.equal(metrics.recurring, 1);
});


test('opening a conversation scrolls to its newest visible message', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const messageListRef = useRef\(null\)/);
  assert.match(source, /messageList\.scrollTop = messageList\.scrollHeight/);
  assert.match(source, /<div ref=\{messageListRef\} className="relative isolate min-h-0 flex-1 overflow-y-auto/);
});

test('push notifications request immediate Android and web delivery', () => {
  const source = readFileSync(new URL('../functions/src/index.ts', import.meta.url), 'utf8');
  assert.ok((source.match(/priority: ["']high["']/g) || []).length >= 3);
  assert.ok((source.match(/Urgency: ["']high["']/g) || []).length >= 3);
});

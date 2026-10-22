import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMessageActivity, findMentionedParticipantIds, messageReplySnapshot, normalizeMessageActivity, toggleMessageUser } from '../src/messageFeatures.js';

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

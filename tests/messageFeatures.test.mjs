import test from 'node:test';
import assert from 'node:assert/strict';
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

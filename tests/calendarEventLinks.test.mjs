import test from 'node:test';
import assert from 'node:assert/strict';
import { eventAnnouncementTitle, eventAnnouncementContent, linkedEventAnnouncementIds } from '../src/calendarEventLinks.js';
import { commitAtomicRecords } from '../src/atomicRecords.js';

const event = {
  id: 'ev-1700000000000',
  title: 'Reunião geral',
  date: '2026-10-20',
  type: 'Reunião',
  location: 'Auditório',
  description: 'Pauta da equipe',
};
const legacyAnnouncement = (id, overrides = {}) => ({
  id,
  author: 'Agenda Oficial (Sistema)',
  title: eventAnnouncementTitle(event),
  content: eventAnnouncementContent(event),
  ...overrides,
});

test('new event uses stored references even when its announcement was edited', () => {
  const current = { ...event, announcementId: 'ann-linked' };
  assert.deepEqual(linkedEventAnnouncementIds(current, [
    { id: 'ann-linked', sourceEventId: event.id, title: 'Título editado' },
    { id: 'ann-other', sourceEventId: 'ev-other' },
  ]), ['ann-linked']);
});

test('legacy event matches only its original system announcement', () => {
  assert.deepEqual(linkedEventAnnouncementIds(event, [
    legacyAnnouncement('ann-1700000000010'),
    legacyAnnouncement('ann-1700000000040'),
    legacyAnnouncement('ann-1700000000001', { author: 'Colaborador' }),
    legacyAnnouncement('ann-1700000000002', { content: 'Outro texto' }),
    legacyAnnouncement('ann-1700000100000'),
  ]), ['ann-1700000000010']);
  assert.deepEqual(linkedEventAnnouncementIds(event, [legacyAnnouncement('ann-1700000000001', { title: 'Outro evento' })]), []);
});

test('event and linked announcement are deleted in one commit', async () => {
  const calls = [];
  const ids = linkedEventAnnouncementIds({ ...event, announcementId: 'ann-linked' }, [
    { id: 'ann-linked', sourceEventId: event.id },
  ]);
  await commitAtomicRecords([
    { collection: 'events', id: event.id, operation: 'delete' },
    ...ids.map(id => ({ collection: 'announcements', id, operation: 'delete' })),
  ], () => ({
    delete: ref => calls.push(`delete:${ref}`),
    commit: async () => calls.push('commit'),
  }), (collection, id) => `${collection}/${id}`);
  assert.deepEqual(calls, [
    'delete:events/ev-1700000000000',
    'delete:announcements/ann-linked',
    'commit',
  ]);
});

test('a rejected delete commit never reports success', async () => {
  await assert.rejects(commitAtomicRecords([
    { collection: 'events', id: event.id, operation: 'delete' },
    { collection: 'announcements', id: 'ann-linked', operation: 'delete' },
  ], () => ({ delete() {}, commit: async () => { throw new Error('permission-denied'); } }),
  (collection, id) => `${collection}/${id}`), /permission-denied/);
});

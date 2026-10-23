import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { eventAnnouncementTitle, eventAnnouncementContent } from '../src/calendarEventLinks.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
function handler(name, next, context) {
  const source = app.split(`const ${name} = `)[1].split(`const ${next} = `)[0].trim().replace(/;$/, '');
  return vm.runInNewContext(`(${source})`, context);
}
const draft = { title: 'Reunião geral', date: '2026-10-23', type: 'Reunião', location: '', description: 'Alinhamento da equipe' };
function eventContext({ event = draft, saved = true, admin = true } = {}) {
  const writes = [], notifications = [], resets = [], modal = [];
  const context = {
    currentUser: { id: 'admin', isAdmin: admin }, newEvent: { ...event }, todayStr: '2026-10-23',
    eventAnnouncementTitle, eventAnnouncementContent,
    saveRelatedRecords: async records => { writes.push(records); return saved; },
    setNewEvent: value => resets.push(value),
    setShowEventModal: value => modal.push(value),
    triggerNotification: message => notifications.push(message),
  };
  return { context, writes, notifications, resets, modal };
}

test('formulário real cadastra evento e comunicado juntos sem variável externa de feriado', async () => {
  const state = eventContext();
  await handler('submitEvent', 'handleDeleteEvent', state.context)({ preventDefault() {} });
  const records = state.writes[0];
  assert.equal(records.length, 2);
  assert.equal(records[0].collection, 'events');
  assert.equal(records[0].data.location, 'Escritório');
  assert.equal(records[0].data.announcementId, records[1].id);
  assert.equal(records[1].data.sourceEventId, records[0].id);
  assert.deepEqual(state.modal, [false]);
  assert.equal(state.resets.length, 1);
  assert.match(state.notifications.at(-1), /agendado/);
});

test('formulário real marca feriado sem publicar comunicado nem guardar vínculo vazio', async () => {
  const state = eventContext({ event: { ...draft, type: 'Feriado' } });
  await handler('submitEvent', 'handleDeleteEvent', state.context)({ preventDefault() {} });
  assert.equal(state.writes[0].length, 1);
  const event = state.writes[0][0].data;
  assert.equal(event.location, 'Calendário oficial');
  assert.equal('announcementId' in event, false);
  assert.match(state.notifications.at(-1), /Feriado marcado/);
});

test('falha de gravação preserva formulário e não informa sucesso', async () => {
  const state = eventContext({ saved: false });
  await handler('submitEvent', 'handleDeleteEvent', state.context)({ preventDefault() {} });
  assert.equal(state.writes.length, 1);
  assert.equal(state.resets.length, 0);
  assert.equal(state.modal.length, 0);
  assert.equal(state.notifications.length, 0);
});

test('perfil sem autorização não publica evento', async () => {
  const state = eventContext({ admin: false });
  await handler('submitEvent', 'handleDeleteEvent', state.context)({ preventDefault() {} });
  assert.equal(state.writes.length, 0);
  assert.match(state.notifications[0], /administradores/);
});

test('marcar feriado não interfere no identificador de um aviso independente', async () => {
  const writes = [];
  const context = {
    currentUser: { id: 'admin', name: 'Admin', isAdmin: true },
    newAnn: { title: 'Aviso', content: 'Conteúdo', category: 'Aviso Geral' },
    newEvent: { type: 'Feriado' }, departmentsList: [{ id: 'rh', name: 'RH' }], getUserDepts: () => ['rh'],
    isFirebaseAvailable: true, dbUser: { uid: 'admin' },
    saveDoc: async (collection, id, data) => { writes.push({ collection, id, data }); return true; },
    setAnnouncements() {}, setNewAnn() {}, setShowAnnModal() {}, triggerNotification() {},
  };
  await handler('submitAnnouncement', 'submitSectorPost', context)({ preventDefault() {} });
  assert.match(writes[0].id, /^ann-\d+$/);
  assert.equal(writes[0].data.id, writes[0].id);
});

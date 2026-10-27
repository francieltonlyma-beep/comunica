import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildScheduleSwapRequest, canCancelSwapRequest, canRespondSwapRequest, canReviewSwapRequest, resolveScheduleSwapRequest, swapRequestPatch } from '../src/scheduleSwapRequests.js';
import { scheduleSignature } from '../src/scheduleOptimizer.js';

const work = { id: 'ana-work', userId: 'ana', userName: 'Ana', startDate: '2026-11-01', endDate: '2026-11-30', status: 'Presencial', shiftStart: '08:00', baseShiftEnd: '17:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00' };
const off = { id: 'bia-off', userId: 'bia', userName: 'Bia', startDate: '2026-11-01', endDate: '2026-11-30', status: 'Folga' };
const input = { id: 'request-1', source: work, sourceDate: '2026-11-10', target: off, targetDate: '2026-11-12', requester: { id: 'ana', name: 'Ana' }, reason: 'Combinado', history: [work, off], absences: [], rules: { restEveryDays: 7 }, existing: [], now: 10 };

test('colaborador cria pedido próprio com assinatura imutável da escala', () => {
  const request = buildScheduleSwapRequest(input);
  assert.equal(request.status, 'pending_peer'); assert.equal(request.requesterId, 'ana'); assert.equal(request.targetUserId, 'bia');
  assert.ok(request.scheduleSignature); assert.equal(request.createdAt, request.updatedAt); assert.equal(request.reason, 'Combinado');
  assert.throws(() => buildScheduleSwapRequest({ ...input, requester: { id: 'bia' } }), /própria escala/);
  assert.throws(() => buildScheduleSwapRequest({ ...input, existing: [request] }), /solicitação aberta/);
});

test('pedido só permanece aprovável enquanto os dois registros continuam iguais', () => {
  const request = buildScheduleSwapRequest(input);
  assert.equal(resolveScheduleSwapRequest(request, [work, off]).valid, true);
  const changed = { ...work, shiftStart: '09:00' };
  assert.equal(resolveScheduleSwapRequest(request, [changed, off]).valid, false);
  assert.match(resolveScheduleSwapRequest(request, [changed, off]).message, /escala mudou/);
});

test('colega aceita primeiro, solicitante pode cancelar e gestor recebe depois', () => {
  const request = buildScheduleSwapRequest(input), ana = { id: 'ana', name: 'Ana' }, bia = { id: 'bia', name: 'Bia' };
  assert.equal(canRespondSwapRequest(request, bia), true); assert.equal(canRespondSwapRequest(request, ana), false);
  const accepted = { ...request, ...swapRequestPatch(request, 'accept', bia, 20) };
  assert.equal(accepted.status, 'pending_manager'); assert.equal(canReviewSwapRequest(accepted, true), true); assert.equal(canReviewSwapRequest(request, true), false);
  assert.equal(canCancelSwapRequest(accepted, ana), true); assert.equal(swapRequestPatch(accepted, 'cancel', ana, 30).status, 'cancelled');
  assert.throws(() => swapRequestPatch(request, 'accept', ana, 20), /não pode/);
});

test('regras da nuvem limitam leitura e transições aos participantes e gestores', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /kind == 'scheduleSwapRequests'[\s\S]*requesterId[\s\S]*targetUserId/);
  assert.match(rules, /status', ''\) == 'pending_peer'[\s\S]*\['pending_manager', 'rejected'\]/);
  assert.match(rules, /scheduleManager\(app, company\)[\s\S]*canManageCalendar\(app, company\)[\s\S]*\['approved', 'rejected'\]/);
  assert.match(rules, /allow delete: if kind == 'scheduleSwapRequests' && false/);
});

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const extract = (name, next, ctx) => vm.runInNewContext('(' + app.split('const ' + name + ' = ')[1].split('const ' + next + ' = ')[0].trim().replace(/;$/, '') + ')', ctx);

test('aprovação grava as duas escalas e o pedido na mesma transação', async () => {
  for (const requestUpdatedAt of [20, 21]) {
    const writes = [], notifications = [];
    const docs = [work, off].map(item => ({ id: item.id, data: () => { const { id, ...data } = item; return data; } }));
    const transaction = {
      get: async ref => ref.collection === 'scheduleSwapRequests'
        ? { exists: () => true, data: () => ({ status: 'pending_manager', updatedAt: requestUpdatedAt }) }
        : { id: ref.id, exists: () => true, data: () => { const { id, ...data } = [work, off].find(item => item.id === ref.id); return data; } },
      delete: ref => writes.push(['delete', ref]), set: (ref, data) => writes.push(['set', ref, data]), update: (ref, data) => writes.push(['update', ref, data]),
    };
    const ctx = { isFirebaseAvailable: true, dbUser: { uid: 'manager' }, currentUser: { id: 'manager', name: 'Gestora' }, db: {}, scheduleSignature,
      scopedScheduleSource: collection => collection, scheduleScope: { allDepartments: true }, query() {}, where() {},
    getTenantCollection: name => name, getDocsFromServer: async () => ({ docs }), doc: (collection, id) => ({ collection, id }),
      runTransaction: async (_db, callback) => callback(transaction), recordAuditEvent: async () => {}, triggerNotification: message => notifications.push(message),
    };
    const save = extract('saveApprovedScheduleSwap', 'savePublishedScheduleSwap', ctx);
    const plan = { replaced: [work, off], records: [{ collection: 'schedules', id: work.id, operation: 'delete' }, { collection: 'schedules', id: 'new', data: { status: 'Folga' } }] };
    const ok = await save(plan, { requestId: 'request-1', requestUpdatedAt: 20, history: [work, off] });
    assert.equal(ok, requestUpdatedAt === 20);
    if (ok) { assert.ok(writes.some(row => row[0] === 'delete')); assert.ok(writes.some(row => row[0] === 'set')); assert.equal(writes.find(row => row[0] === 'update')[2].status, 'approved'); }
    else assert.equal(writes.length, 0);
  }
});

test('calendário mantém solicitação, aceite e aprovação dentro da mesma interface', () => {
  const calendar = readFileSync(new URL('../src/ScheduleCalendar.jsx', import.meta.url), 'utf8');
  assert.match(calendar, /Solicitar troca deste dia/); assert.match(calendar, /<ScheduleSwapRequestsPanel/);
  assert.match(app, /setupSync\('scheduleSwapRequests'/); assert.match(app, /mode="request"/); assert.match(app, /mode=\{publishedScheduleSwap\.requestId \? 'approval'/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduleDraftStore, packScheduleDraft, unpackScheduleDraft, startScheduleDraftAutosave, validateScheduleDraftScope } from '../src/scheduleDrafts.js';

const snapshot = { bulk: { userIds: ['u'], startDate: '2026-11-02', endDate: '2026-11-02', notes: 'Escala em revisão' }, rows: [{ userId: 'u', dept: 'op', date: '2026-11-02', status: 'Presencial', shiftStart: '08:00', shiftEnd: '12:00', manuallyAdjusted: true }], holidayAssignments: { '2026-11-02': { u: { status: 'Presencial', shiftStart: '08:00', shiftEnd: '12:00' } } }, proposalInput: 'private-history-signature' };

test('salvamento automático espera cinco minutos, lê a última edição e para ao fechar', () => {
  let now = 0, interval, callback, next, enabled = true;
  const clock = { setInterval(fn, delay) { callback = fn; interval = delay; next = delay; return 1; }, clearInterval() { callback = null; } };
  const advance = ms => { const end = now + ms; while (callback && next <= end) { now = next; next += interval; callback(); } now = end; };
  let state = { enabled, dirty: true, busy: false, name: 'Primeira edição' };
  const writes = [];
  const stop = startScheduleDraftAutosave(() => state, () => { writes.push(state.name); state.dirty = false; }, clock);
  advance(299999); assert.deepEqual(writes, []);
  state.name = 'Edição atual'; advance(1); assert.deepEqual(writes, ['Edição atual']);
  advance(300000); assert.equal(writes.length, 1);
  state = { ...state, dirty: true, busy: true }; advance(300000); assert.equal(writes.length, 1);
  state = { ...state, busy: false, enabled: false }; advance(300000); assert.equal(writes.length, 1);
  state.enabled = true; advance(300000); assert.equal(writes.length, 2);
  stop(); state.dirty = true; advance(300000); assert.equal(writes.length, 2);
});
function memoryApi() {
  const records = new Map();
  const read = key => ({ id: key.split('/').at(-1), exists: () => records.has(key), data: () => records.get(key) });
  return { records, db: {}, collection: (db, ...path) => path.join('/'), doc: (...path) => path.join('/'), getDoc: async key => read(key), getDocs: async root => ({ docs: [...records.keys()].filter(key => key.startsWith(root + '/') && !key.slice(root.length + 1).includes('/')).map(read) }), runTransaction: async (db, callback) => {
    const pending = [];
    await callback({ get: async key => read(key), set: (key, value) => pending.push(() => records.set(key, value)), delete: key => pending.push(() => records.delete(key)) });
    pending.forEach(write => write());
  } };
}

test('rascunho recupera horários, ajustes e feriados e armazena só hash da assinatura de origem', async () => {
  const packed = await packScheduleDraft(snapshot);
  const restored = await unpackScheduleDraft({ ...packed, partCount: packed.parts.length, revision: 'v' }, packed.parts.map(payload => ({ payload, revision: 'v' })));
  assert.deepEqual(restored.rows, snapshot.rows);
  assert.deepEqual(restored.holidayAssignments, snapshot.holidayAssignments);
  assert.equal(restored.proposalInput, undefined);
  assert.equal(restored.inputHash.length, 64);
});

test('rascunho grande é dividido abaixo do limite de documento mesmo sem compressão', async () => {
  const compress = globalThis.CompressionStream;
  try {
    globalThis.CompressionStream = undefined;
    const large = { ...snapshot, bulk: { ...snapshot.bulk, notes: 'á'.repeat(400000) } };
    const packed = await packScheduleDraft(large);
    assert.ok(packed.parts.length > 1);
    assert.ok(packed.parts.every(part => new TextEncoder().encode(part).length < 900000));
    const restored = await unpackScheduleDraft({ encoding: packed.encoding, partCount: packed.parts.length, revision: 'v' }, packed.parts.map(payload => ({ payload, revision: 'v' })));
    assert.equal(restored.bulk.notes, large.bulk.notes);
  } finally { globalThis.CompressionStream = compress; }
});

test('gravação do rascunho é atômica, separada do calendário e recusa atualização de outra sessão', async () => {
  const api = memoryApi(), context = { appId: 'app', companyId: 'company', ownerId: 'owner' }, store = createScheduleDraftStore(api, context);
  const first = await store.save('draft', null, snapshot, ['op']);
  const second = await store.save('draft', first.revision, { ...snapshot, bulk: { ...snapshot.bulk, notes: 'Atualizado' } }, ['op']);
  await assert.rejects(store.save('draft', first.revision, snapshot, ['op']), /outra sessão/);
  const restored = await store.load('draft');
  assert.equal(restored.metadata.revision, second.revision);
  assert.equal(restored.snapshot.bulk.notes, 'Atualizado');
  assert.ok([...api.records.keys()].every(key => key.includes('/users/owner/scheduleDrafts/') && !key.includes('/schedules/')));
  assert.ok(![...api.records.keys()].some(key => key.includes(first.revision)));
  assert.equal((await store.list()).length, 1);
  assert.equal((await createScheduleDraftStore(api, { ...context, ownerId: 'other' }).list()).length, 0);
  assert.equal((await createScheduleDraftStore(api, { ...context, companyId: 'other' }).list()).length, 0);
});

test('reabertura recusa partes incompletas e colaboradores fora do acesso atual', async () => {
  await assert.rejects(unpackScheduleDraft({ partCount: 1, revision: 'new', encoding: 'json' }, [{ payload: '{}', revision: 'old' }]), /incompleto/);
  const scope = { employeeIds: ['u'], departmentIds: ['op'], allDepartments: false };
  assert.doesNotThrow(() => validateScheduleDraftScope(snapshot, scope));
  assert.throws(() => validateScheduleDraftScope(snapshot, { ...scope, employeeIds: [] }), /fora do seu acesso/);
  assert.throws(() => validateScheduleDraftScope({ ...snapshot, rows: [{ ...snapshot.rows[0], dept: 'other' }] }, scope), /fora do seu acesso/);
  assert.throws(() => validateScheduleDraftScope({ ...snapshot, bulk: { ...snapshot.bulk, endDate: '2027-01-01' } }, scope), /31 dias/);
});

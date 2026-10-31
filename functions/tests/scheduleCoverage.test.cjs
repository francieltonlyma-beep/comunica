const test = require('node:test');
const assert = require('node:assert/strict');
const { saveCoverageSettings } = require('../lib/scheduleCoverage.js');

const root = 'artifacts/comunica-salvador/public/data/companies/company';
const rule = { id: 'old', department: 'op', weekdays: [1], start: '08:00', end: '12:00', minimum: 2 };
const other = { ...rule, id: 'other', department: 'adm' };
const actor = { uid: 'manager', companyId: 'company', isDeveloper: false };
function mock(profile = { name: 'Gestor', role: 'Coordenador', depts: ['op'] }) {
  const store = new Map([[root + '/users/manager', profile], [root + '/settings/schedule-rules', { version: 2, coverageRequirements: [rule, other] }]]);
  const writes = [];
  const ref = path => ({ path, collection: name => ref(path + '/' + name), doc: id => ref(path + '/' + (id || 'new-audit')) });
  const snapshot = r => ({ ref: r, exists: store.has(r.path), data: () => store.get(r.path) });
  const db = { doc: ref, runTransaction: async callback => {
    const pending = [];
    const result = await callback({ get: async r => r.path.endsWith('/departments') ? { docs: ['op','adm'].map(id => ({id})) } : snapshot(r),
      set: (r, data) => pending.push({ path: r.path, data }), create: (r, data) => pending.push({ path: r.path, data }) });
    writes.push(...pending); return result;
  } };
  return { db, store, writes };
}
test('servidor preserva outros setores e registra auditoria na mesma transação', async () => {
  const state = mock();
  const result = await saveCoverageSettings(state.db, 'company', actor, [{ ...rule, id: 'new', date: '2026-11-02', minimum: 1 }], 2);
  assert.equal(result.version, 3); assert.deepEqual(result.coverageRequirements.map(r => r.id), ['other','new']);
  assert.equal(state.writes.length, 2); assert.equal(state.writes[1].data.actorId, 'manager');
});
test('servidor recusa outro setor, empresa, perfil de consulta e versão antiga sem gravar', async () => {
  for (const variation of ['sector','company','readonly','version','no-profile']) {
    const state = mock(variation === 'readonly' ? { role: 'Coordenador', depts: ['op'], permissions: { canEdit: false } } : undefined);
    if (variation === 'no-profile') state.store.delete(root + '/users/manager');
    await assert.rejects(saveCoverageSettings(state.db, 'company', variation === 'company' ? { ...actor, companyId: 'other-company' } : actor,
      variation === 'sector' ? [other] : [rule], variation === 'version' ? 1 : 2));
    assert.equal(state.writes.length, 0, variation);
  }
});
test('suporte revogado e token de desenvolvedor de outro usuário não autorizam', async () => {
  for (const uid of ['platform-support-francielton','manager']) {
    const state = mock();
    await assert.rejects(saveCoverageSettings(state.db, 'company', { ...actor, uid, isDeveloper: true }, [rule], 2));
    assert.equal(state.writes.length, 0);
  }
});

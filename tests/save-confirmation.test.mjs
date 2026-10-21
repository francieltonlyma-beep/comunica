import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Exercise the actual guard statements from App.jsx with successful/failed writes.
const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
test('saveDoc rejects unavailable sessions instead of reporting a local-only save', async () => {
  const declaration = source.split('  const saveDoc = async (colName, docId, data) => {')[1].split('  const saveRelatedRecords = async')[0];
  const body = declaration.slice(0, declaration.lastIndexOf('};'));
  const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
  const run = new AsyncFunction('colName', 'docId', 'data', 'isFirebaseAvailable', 'dbUser', 'getTenantCollection', 'doc', 'setDoc', 'triggerNotification', 'console', body);
  for (const scenario of ['offline', 'no-user', 'no-company', 'denied', 'success']) {
    const notifications = [];
    let writes = 0;
    const result = await run('roles', 'role-fixture', { name: 'Fixture' }, scenario !== 'offline', scenario === 'no-user' ? null : { uid: 'fixture' },
      () => scenario === 'no-company' ? null : {}, () => ({}), async () => { writes++; if (scenario === 'denied') throw Error('permission-denied'); },
      (...args) => notifications.push(args), { error() {} });
    assert.equal(result, scenario === 'success');
    assert.equal(writes, ['denied', 'success'].includes(scenario) ? 1 : 0);
    assert.equal(notifications.length, scenario === 'success' ? 0 : 1);
  }
});
for (const [collection, id, payload] of [
  ['documents', 'id', 'documentData'], ['polls', 'id', 'poll'],
  ['announcements', 'annId', 'created'], ['productivity', 'editingProdId', 'updatedLog'],
  ['productivity', 'prodId', 'created'], ['messages', 'msgId', 'newMsg'],
]) {
  test(`${collection}/${id}: failed save stops before success and form clearing`, async () => {
    const guard = `if (!await saveDoc('${collection}', ${id}, ${payload})) return;`;
    assert.ok(source.includes(guard), 'UI handler must check the save result');
    const execute = new (Object.getPrototypeOf(async function() {}).constructor)('saveDoc', id, payload, `${guard}\nreturn 'confirmed';`);
    assert.equal(await execute(async () => false, 'fixture', {}), undefined);
    assert.equal(await execute(async () => true, 'fixture', {}), 'confirmed');
  });
}

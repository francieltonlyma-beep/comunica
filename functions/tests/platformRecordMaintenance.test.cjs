const {test} = require('node:test');
const assert = require('node:assert/strict');
const {initializeApp, deleteApp} = require('firebase-admin/app');
const {getFirestore, Timestamp} = require('firebase-admin/firestore');
const {maintainPlatformRecord} = require('../lib/platformRecordMaintenance');
const {SUPPORT_UID} = require('../lib/platformSupport');

test('support edits and restores with history and stale-write protection', {
  skip: !process.env.FIRESTORE_EMULATOR_HOST,
}, async () => {
  const app = initializeApp({projectId: 'demo-comunica'}, 'record-maintenance');
  try {
    const db = getFirestore(app);
    const companyId = `test-maintenance-${Date.now()}`;
    const company = db.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
    const record = company.collection('announcements').doc('example');
    const auth = {uid: SUPPORT_UID, token: {isDeveloper: true}};
    const access = db.doc(`_platformSupport/${SUPPORT_UID}`);
    const target = {companyId, collection: 'announcements', recordId: record.id};
    const call = (action, data = {}) => maintainPlatformRecord(db, auth, {...target, action, ...data});
    const apply = (action, current, fields) => call(action, {
      revision: current.history[0]?.id || '',
      version: current.version,
      reason: 'Teste de manutenção',
      fields,
    });

    await company.set({name: 'Empresa fictícia'});
    await assert.rejects(call('read'), {code: 'permission-denied'});
    await access.set({enabled: true, appId: 'comunica-salvador'});
    await assert.rejects(
      maintainPlatformRecord(db, {...auth, uid: 'other'}, {...target, action: 'read'}),
      {code: 'permission-denied'},
    );
    await assert.rejects(call('read', {collection: 'users'}), {code: 'invalid-argument'});

    await apply('create', await call('read'), '{"title":"Original"}');
    const timestamp = Timestamp.fromMillis(1700000000000);
    await record.update({createdAt: timestamp});
    const beforeUpdate = await call('read');
    await apply('update', beforeUpdate, '{"title":"Editado"}');
    await assert.rejects(apply('delete', beforeUpdate), {code: 'aborted'});
    const afterUpdate = await call('read');
    assert.equal(afterUpdate.history[0].canRestore, true);
    await apply('restore', afterUpdate);
    assert.deepEqual((await record.get()).data(), {title: 'Original', createdAt: timestamp});

    await apply('delete', await call('read'));
    assert.equal((await record.get()).exists, false);
    await apply('restore', await call('read'));
    assert.deepEqual((await record.get()).data(), {title: 'Original', createdAt: timestamp});

    await record.update({title: 'Alteração de outro usuário'});
    assert.equal((await call('read')).history[0].canRestore, false);
  } finally {
    await deleteApp(app);
  }
});

const {test} = require('node:test');
const assert = require('node:assert/strict');
const {initializeApp, deleteApp} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
const {getStorage} = require('firebase-admin/storage');
const {managePlatformLab} = require('../lib/platformLab');
const {SUPPORT_UID} = require('../lib/platformSupport');

test('laboratory is support-only and resets only its own records and files', {
  skip: !process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !process.env.FIREBASE_STORAGE_EMULATOR_HOST,
}, async () => {
  const projectId = 'demo-comunica-lab';
  const app = initializeApp({projectId, storageBucket: `${projectId}.appspot.com`});
  try {
    const db = getFirestore();
    const auth = {uid: SUPPORT_UID, token: {isDeveloper: true}};
    await assert.rejects(managePlatformLab(auth, 'open'), {code: 'permission-denied'});
    await db.doc(`_platformSupport/${SUPPORT_UID}`).set({enabled: true, appId: 'comunica-salvador'});
    await assert.rejects(managePlatformLab({uid: 'other', token: auth.token}, 'reset'), {code: 'permission-denied'});
    const lab = await managePlatformLab(auth, 'open');
    assert.equal(lab.company.platformLab, true);
    assert.equal(lab.user.companyId, lab.company.id);
    assert.ok(lab.token);
    assert.equal((await managePlatformLab(auth, 'open')).company.id, lab.company.id);
    const path = 'artifacts/comunica-salvador/public/data/companies';
    const company = db.doc(`${path}/${lab.company.id}`);
    const real = db.doc(`${path}/real`);
    await real.set({name: 'Outra empresa'});
    await company.collection('purchaseRequests').doc('test').collection('files').doc('example').set({name: 'Teste'});
    await company.collection('posts').doc('test').set({title: 'Teste Gestão'});
    await db.collection('purchaseInvitationTokens').doc('lab-link').set({companyId: lab.company.id});
    const bucket = getStorage().bucket();
    const testFile = bucket.file(`companies/${lab.company.id}/arquivo.txt`);
    const realFile = bucket.file('companies/real/arquivo.txt');
    await Promise.all([testFile.save('teste'), realFile.save('outra empresa')]);
    await managePlatformLab(auth, 'reset');
    assert.equal((await testFile.exists())[0], false);
    assert.equal((await realFile.exists())[0], true);
    assert.equal((await company.get()).exists, false);
    assert.equal((await company.collection('purchaseRequests/test/files').doc('example').get()).exists, false);
    assert.equal((await db.collection('purchaseInvitationTokens').doc('lab-link').get()).exists, false);
    assert.equal((await real.get()).exists, true);
    assert.notEqual((await managePlatformLab(auth, 'open')).company.id, lab.company.id);
  } finally {
    await deleteApp(app);
  }
});

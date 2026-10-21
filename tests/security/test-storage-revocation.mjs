import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initializeApp as initializeClient, deleteApp as deleteClient} from 'firebase/app';
import {getAuth as getClientAuth, connectAuthEmulator, signInWithCustomToken} from 'firebase/auth';
import {getStorage, connectStorageEmulator, ref, uploadBytes, getMetadata, deleteObject} from 'firebase/storage';

const requireFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));
const {initializeApp: initializeAdmin, deleteApp: deleteAdmin} = requireFunctions('firebase-admin/app');
const {getAuth: getAdminAuth} = requireFunctions('firebase-admin/auth');
const {getFirestore} = requireFunctions('firebase-admin/firestore');
const projectId = 'demo-comunica-security';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST !== '127.0.0.1:9199' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Local emulators required');

const admin = initializeAdmin({projectId});
const database = getFirestore(admin);
const supportId = 'platform-support-francielton';
const company = database.doc('artifacts/comunica-salvador/public/data/companies/company-a');
const supportAccess = database.doc(`_platformSupport/${supportId}`);
const clients = [];
async function client(uid, companyId, isDeveloper = false, isAdmin = false) {
  const app = initializeClient({apiKey: 'fake-api-key', projectId,
    storageBucket: `${projectId}.appspot.com`, authDomain: `${projectId}.firebaseapp.com`}, uid);
  clients.push(app);
  const auth = getClientAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true});
  const session = await getAdminAuth(admin).createCustomToken(uid, {companyId, isDeveloper, isAdmin});
  await signInWithCustomToken(auth, session);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  return path => ref(storage, path);
}
async function denied(action, label) {
  await assert.rejects(action, error => error?.code === 'storage/unauthorized', label);
}

try {
  await company.collection('users').doc('worker').set({id: 'worker', companyId: 'company-a'});
  await company.collection('users').doc('other').set({id: 'other', companyId: 'company-a'});
  await company.collection('users').doc('bystander').set({id: 'bystander', companyId: 'company-a'});
  await company.collection('users').doc('admin').set({id: 'admin', companyId: 'company-a', isAdmin: true});
  await supportAccess.set({enabled: true, appId: 'comunica-salvador', companyId: 'company-a'});
  const worker = await client('worker', 'company-a');
  const other = await client('other', 'company-a');
  const bystander = await client('bystander', 'company-a');
  const administrator = await client('admin', 'company-a', false, true);
  const outsider = await client('outsider', 'company-b');
  const fakeSupport = await client('pretender', 'company-a', true);
  const support = await client(supportId, 'company-a', true, true);
  const imagePath = 'companies/company-a/users/worker/images/revocation-test.png';
  const workerFile = worker(imagePath);
  const outsiderFile = outsider(imagePath);
  const fakeSupportFile = fakeSupport(imagePath);
  const supportFile = support(imagePath);

  await uploadBytes(workerFile, new TextEncoder().encode('fixture'), {
    contentType: 'image/png', customMetadata: {ownerUid: 'worker'},
  });
  await getMetadata(workerFile);
  await getMetadata(other(imagePath));
  await denied(() => getMetadata(outsiderFile), 'another company cannot read');
  await denied(() => getMetadata(fakeSupportFile), 'developer claim alone does not grant support access');
  await getMetadata(supportFile);

  const supportDocumentPath = `companies/company-a/users/${supportId}/documents/support-smoke.pdf`;
  await uploadBytes(support(supportDocumentPath), new TextEncoder().encode('%PDF-support-fixture'), {
    contentType: 'application/pdf', customMetadata: {ownerUid: supportId, documentId: 'document-support-smoke'},
  });
  await getMetadata(support(supportDocumentPath));

  await denied(() => uploadBytes(worker('companies/company-a/users/worker/images/unsafe.exe'), new TextEncoder().encode('fixture'), {
    contentType: 'application/x-msdownload', customMetadata: {ownerUid: 'worker'},
  }), 'unsafe upload type is rejected');
  await denied(() => uploadBytes(worker('companies/company-a/users/worker/avatars/profile.png'), new TextEncoder().encode('fixture'), {
    contentType: 'image/png', customMetadata: {ownerUid: 'worker'},
  }), 'profile photo upload remains restricted to administrators');
  await uploadBytes(administrator('companies/company-a/users/admin/avatars/profile.png'), new TextEncoder().encode('fixture'), {
    contentType: 'image/png', customMetadata: {ownerUid: 'admin'},
  });

  await company.collection('documents').doc('document-private').set({
    id: 'document-private', accessMode: 'people', allowedUserIds: ['worker'], authorId: 'admin',
  });
  const documentPath = 'companies/company-a/users/admin/documents/private.pdf';
  await uploadBytes(administrator(documentPath), new TextEncoder().encode('%PDF-fixture'), {
    contentType: 'application/pdf', customMetadata: {ownerUid: 'admin', documentId: 'document-private'},
  });
  await getMetadata(worker(documentPath));
  await denied(() => getMetadata(other(documentPath)), 'same-company employee outside document audience cannot read');
  await company.collection('documents').doc('document-private').update({allowedUserIds: ['worker', 'other']});
  await getMetadata(other(documentPath));

  await company.collection('messages').doc('msg-private').set({
    id: 'msg-private', senderId: 'worker', participants: ['worker', 'other'],
  });
  const attachmentPath = 'companies/company-a/users/worker/attachments/private.pdf';
  await uploadBytes(worker(attachmentPath), new TextEncoder().encode('%PDF-fixture'), {
    contentType: 'application/pdf', customMetadata: {ownerUid: 'worker', messageId: 'msg-private'},
  });
  await getMetadata(other(attachmentPath));
  await denied(() => getMetadata(bystander(attachmentPath)), 'same-company non-participant cannot read message attachment');

  await company.collection('users').doc('worker').delete();
  await denied(() => getMetadata(workerFile), 'removed employee cannot read with a stale token');
  await denied(() => uploadBytes(workerFile, new TextEncoder().encode('new')), 'removed employee cannot overwrite');
  await denied(() => deleteObject(workerFile), 'removed employee cannot delete');

  await supportAccess.update({enabled: false});
  await denied(() => getMetadata(supportFile), 'revoked support cannot read with a stale token');
  console.log('STORAGE_REVOCATION_VALIDATED');
} finally {
  await Promise.all(clients.map(deleteClient));
  await database.terminate();
  await deleteAdmin(admin);
}

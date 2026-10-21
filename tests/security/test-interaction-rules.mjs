import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {initializeApp as initializeClient, deleteApp as deleteClient} from 'firebase/app';
import {getAuth as getClientAuth, connectAuthEmulator, signInWithCustomToken} from 'firebase/auth';
import {getFirestore as getClientFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, arrayUnion, FieldPath} from 'firebase/firestore';

const requireFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));
const {initializeApp: initializeAdmin, deleteApp: deleteAdmin} = requireFunctions('firebase-admin/app');
const {getAuth: getAdminAuth} = requireFunctions('firebase-admin/auth');
const {getFirestore: getAdminFirestore} = requireFunctions('firebase-admin/firestore');
const projectId = 'demo-comunica-security';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Local emulators required');
const admin = initializeAdmin({projectId});
const database = getAdminFirestore(admin);
const companyPath = 'artifacts/comunica-salvador/public/data/companies/company-a';
const clients = [];

async function client(uid, isAdmin = false) {
  const app = initializeClient({apiKey: 'fake-api-key', projectId, authDomain: `${projectId}.firebaseapp.com`}, uid);
  clients.push(app);
  const auth = getClientAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {disableWarnings: true});
  const token = await getAdminAuth(admin).createCustomToken(uid, {companyId: 'company-a', isAdmin});
  await signInWithCustomToken(auth, token);
  const firestore = getClientFirestore(app);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  return kind => doc(firestore, companyPath, kind, 'fixture');
}
async function denied(action, label) {
  await assert.rejects(action, error => error?.code === 'permission-denied', label);
}

try {
  await database.doc(`${companyPath}/users/worker`).set({name: 'Worker', isAdmin: false});
  await database.doc(`${companyPath}/users/other`).set({name: 'Other', isAdmin: false});
  await database.doc(`${companyPath}/users/admin`).set({name: 'Admin', isAdmin: true});
  await database.doc(`${companyPath}/announcements/fixture`).set({title: 'Aviso', readBy: [], likes: 0, likedBy: [], comments: []});
  await database.doc(`${companyPath}/documents/fixture`).set({title: 'Documento', requiredRead: true, readBy: []});
  await database.doc(`${companyPath}/polls/fixture`).set({question: 'Escolha', options: ['A', 'B'], votes: {}});
  const worker = await client('worker');
  const other = await client('other');
  const manager = await client('admin', true);
  const announcement = worker('announcements');
  const document = worker('documents');
  const poll = worker('polls');

  await denied(() => updateDoc(announcement, {readBy: arrayUnion('other')}), 'cannot confirm another user');
  await Promise.all([
    updateDoc(announcement, {readBy: arrayUnion('worker')}),
    updateDoc(other('announcements'), {readBy: arrayUnion('other')}),
  ]);
  assert.deepEqual(new Set((await getDoc(announcement)).data().readBy), new Set(['worker', 'other']));
  await denied(() => updateDoc(announcement, {readBy: ['worker']}), 'cannot remove another confirmation');
  await denied(() => updateDoc(manager('announcements'), {readBy: ['admin', 'worker', 'other']}), 'admin cannot forge read confirmations');
  await updateDoc(manager('announcements'), {title: 'Aviso atualizado'});

  await Promise.all([
    updateDoc(document, {readBy: arrayUnion('worker')}),
    updateDoc(other('documents'), {readBy: arrayUnion('other')}),
  ]);
  assert.deepEqual(new Set((await getDoc(document)).data().readBy), new Set(['worker', 'other']));
  await denied(() => updateDoc(document, {readBy: ['other']}), 'cannot remove own or another document confirmation');
  await denied(() => updateDoc(manager('documents'), {readBy: ['admin']}), 'admin cannot forge document confirmations');

  await Promise.all([
    updateDoc(poll, new FieldPath('votes', 'worker'), 1),
    updateDoc(other('polls'), new FieldPath('votes', 'other'), 0),
  ]);
  assert.deepEqual((await getDoc(poll)).data().votes, {worker: 1, other: 0});
  await denied(() => updateDoc(poll, new FieldPath('votes', 'worker'), 0), 'one vote per user');
  await denied(() => updateDoc(poll, new FieldPath('votes', 'other'), 1), 'cannot alter another vote');
  await denied(() => updateDoc(manager('polls'), new FieldPath('votes', 'worker'), 0), 'admin cannot forge vote');
  await updateDoc(manager('polls'), {question: 'Escolha atualizada'});
  console.log('INTERACTION_RULES_VALIDATED');
} finally {
  await Promise.all(clients.map(deleteClient));
  await database.terminate();
  await deleteAdmin(admin);
}

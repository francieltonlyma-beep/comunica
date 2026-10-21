import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { initializeApp as initializeClient, deleteApp as deleteClient } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const requireFunctions = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = requireFunctions('firebase-admin/app');
const { getAuth: getAdminAuth } = requireFunctions('firebase-admin/auth');
const { getFirestore: getAdminFirestore } = requireFunctions('firebase-admin/firestore');
const projectId = 'demo-comunica-security';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Local emulators required');
const adminApp = initializeAdmin({ projectId });
const adminDb = getAdminFirestore(adminApp);
const company = 'artifacts/comunica-salvador/public/data/companies/company-a';
const clients = [];

async function client(uid, companyId, isAdmin = false) {
  const app = initializeClient({ apiKey: 'fake-api-key', projectId, authDomain: `${projectId}.firebaseapp.com` }, `career-${uid}`);
  clients.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  await signInWithCustomToken(auth, await getAdminAuth(adminApp).createCustomToken(uid, companyId ? { companyId, isAdmin } : {}));
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return kind => doc(db, company, kind, 'fixture');
}

const denied = (action, label) => assert.rejects(action, error => error?.code === 'permission-denied', label);
try {
  await adminDb.doc(`${company}/users/worker`).set({ name: 'Worker', isAdmin: false });
  await adminDb.doc(`${company}/users/admin`).set({ name: 'Admin', isAdmin: true });
  await adminDb.doc(`${company}/users/hr`).set({ name: 'RH', isAdmin: false, role: 'Analista de RH' });
  await adminDb.doc(`${company}/vacancies/fixture`).set({ title: 'Vaga', status: 'published' });
  await adminDb.doc(`${company}/applications/fixture`).set({ name: 'Candidato', status: 'received', resumePath: 'private' });
  const worker = await client('worker', 'company-a');
  const manager = await client('admin', 'company-a', true);
  const humanResources = await client('hr', 'company-a');
  const candidate = await client('candidate', null);
  assert.equal((await getDoc(worker('vacancies'))).data().title, 'Vaga');
  await denied(() => getDoc(worker('applications')), 'worker cannot read applications');
  await denied(() => getDoc(candidate('applications')), 'candidate cannot read applications directly');
  await denied(() => getDoc(candidate('vacancies')), 'candidate cannot read tenant vacancy documents');
  await denied(() => setDoc(worker('vacancies'), { title: 'Alterada' }), 'worker cannot edit vacancies');
  await denied(() => setDoc(candidate('applications'), { name: 'Falsa' }), 'candidate cannot forge application');
  assert.equal((await getDoc(manager('applications'))).data().name, 'Candidato');
  assert.equal((await getDoc(humanResources('applications'))).data().name, 'Candidato');
  await updateDoc(humanResources('applications'), { status: 'interview' });
  await updateDoc(humanResources('vacancies'), { status: 'closed' });
  await updateDoc(manager('applications'), { status: 'reviewing' });
  await updateDoc(manager('applications'), { aiAssessment: 'Parecer de apoio à triagem humana.', aiAssessmentAt: Date.now(), aiAssessmentBy: 'Administrador', aiAssessmentVacancyUpdatedAt: Date.now() });
  await denied(() => updateDoc(manager('applications'), { resumePath: 'alterado' }), 'admin cannot rewrite resume');
  await updateDoc(manager('vacancies'), { status: 'closed' });
  console.log('CAREER_RULES_VALIDATED');
} finally {
  await Promise.all(clients.map(deleteClient));
  await adminDb.terminate();
  await deleteAdmin(adminApp);
}

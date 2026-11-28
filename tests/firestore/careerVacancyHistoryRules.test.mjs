import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-comunica',
  firestore: {
    host: '127.0.0.1',
    port: 8088,
    rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
  },
});
const company = 'career-history';
const base = `artifacts/comunica-salvador/public/data/companies/${company}`;
const path = 'vacancies/v1';
const before = { id: 'v1', title: 'Auxiliar', status: 'published', createdAt: Date.now() - 3600000 };
const after = { ...before, title: 'Auxiliar de loja', changeId: 'rev1' };
const expiredPath = 'vacancies/expired';
const oldVacancy = { ...before, id: 'expired', createdAt: Date.now() - 8 * 86400000 };
const client = (actor, companyId = company) => env.authenticatedContext(actor, { companyId }).firestore();
const ref = (db, suffix) => doc(db, base + '/' + suffix);
const entry = (actorId, previous = before) => ({ before: previous, after, actorId, actorName: 'Recrutador', changedAt: serverTimestamp() });

function changeExpired(db, fields) {
  const batch = writeBatch(db);
  const next = { ...oldVacancy, ...fields, changeId: 'expired-revision' };
  batch.update(ref(db, expiredPath), next);
  batch.set(ref(db, expiredPath + '/history/expired-revision'), {
    ...entry('recruiter'), before: oldVacancy, after: next,
  });
  return batch.commit();
}

function change(db, actor = 'recruiter', previous = before) {
  const batch = writeBatch(db);
  batch.update(ref(db, path), after);
  batch.set(ref(db, path + '/history/rev1'), entry(actor, previous));
  return batch.commit();
}

try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, base), {}),
      setDoc(ref(db, path), before),
      setDoc(ref(db, 'departments/north'), {name:'Loja Norte'}),
      setDoc(ref(db, 'roles/cashier'), {name:'Caixa', depts:['north']}),
      setDoc(ref(db, 'roles/stock'), {name:'Estoque', depts:['south']}),
      setDoc(ref(db, 'applications/app-1'), {status:'received'}),
      setDoc(ref(db, expiredPath), oldVacancy),
      setDoc(ref(db, 'users/recruiter'), { role: 'RH', name: 'Recrutador' }),
      setDoc(ref(db, 'users/employee'), { role: 'Estoquista' }),
    ]);
  });
  const rh = client('recruiter');
  const employee = client('employee');
  await assertFails(updateDoc(ref(rh, path), { title: 'Sem histórico' }));
  await assertFails(change(rh, 'recruiter', { ...before, title: 'Versão falsa' }));
  await assertFails(change(rh, 'employee'));
  await assertFails(setDoc(ref(rh, path + '/history/rev1'), entry('recruiter')));
  await assertFails(change(employee, 'employee'));
  await assertSucceeds(setDoc(ref(rh, 'vacancies/new'), { ...before, publishedAt: serverTimestamp() }));
  await assertSucceeds(setDoc(ref(rh, 'vacancies/north'), {...before, roleId:'cashier', sectorId:'north', positions:2, publishedAt:serverTimestamp()}));
  await assertFails(setDoc(ref(rh, 'vacancies/wrong-role-sector'), {...before, roleId:'stock', sectorId:'north', publishedAt:serverTimestamp()}));
  await assertFails(setDoc(ref(rh, 'vacancies/bad-sector'), {...before, sectorId:'missing', publishedAt:serverTimestamp()}));
  await assertFails(setDoc(ref(rh, 'vacancies/bad-amount'), {...before, positions:0, publishedAt:serverTimestamp()}));
  const stageChange = {status:'reviewing', stageStart:{status:'reviewing', at:serverTimestamp(), actorName:'RH'}};
  await assertFails(updateDoc(ref(employee, 'applications/app-1'), stageChange));
  await assertFails(updateDoc(ref(rh, 'applications/app-1'), {...stageChange, stageStart:{status:'interview', at:serverTimestamp()}}));
  await assertSucceeds(updateDoc(ref(rh, 'applications/app-1'), stageChange));
  await assertFails(updateDoc(ref(rh, 'applications/app-1'), {stageStart:{status:'reviewing', at:serverTimestamp()}}));
  await assertFails(changeExpired(rh, { title: 'Prazo encerrado' }));
  await assertFails(changeExpired(rh, { closesAt: '2027-01-20' }));
  await assertFails(changeExpired(rh, { createdAt: Date.now() }));
  await assertSucceeds(changeExpired(rh, { status: 'closed' }));
  await assertSucceeds(getDoc(ref(rh, expiredPath + '/history/expired-revision')));
  await assertSucceeds(change(rh));
  await assertSucceeds(getDoc(ref(rh, path + '/history/rev1')));
  await assertFails(getDoc(ref(employee, path + '/history/rev1')));
  await assertFails(getDoc(ref(client('recruiter', 'other-company'), path + '/history/rev1')));
  await assertFails(updateDoc(ref(rh, path + '/history/rev1'), { actorName: 'Outro' }));
} finally {
  await env.cleanup();
}

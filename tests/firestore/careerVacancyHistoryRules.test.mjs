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
const before = { id: 'v1', title: 'Auxiliar', status: 'published' };
const after = { ...before, title: 'Auxiliar de loja', changeId: 'rev1' };
const client = (actor, companyId = company) => env.authenticatedContext(actor, { companyId }).firestore();
const ref = (db, suffix) => doc(db, base + '/' + suffix);
const entry = (actorId, previous = before) => ({ before: previous, after, actorId, actorName: 'Recrutador', changedAt: serverTimestamp() });

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
      setDoc(ref(db, path), before),
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
  await assertSucceeds(change(rh));
  await assertSucceeds(getDoc(ref(rh, path + '/history/rev1')));
  await assertFails(getDoc(ref(employee, path + '/history/rev1')));
  await assertFails(getDoc(ref(client('recruiter', 'other-company'), path + '/history/rev1')));
  await assertFails(updateDoc(ref(rh, path + '/history/rev1'), { actorName: 'Outro' }));
} finally {
  await env.cleanup();
}

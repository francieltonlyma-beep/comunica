import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  Bytes,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
const env = await initializeTestEnvironment({
  projectId: 'demo-comunica',
  firestore: {
    host: '127.0.0.1',
    port: 8088,
    rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
  },
});
const company = 'rh-company',
  base = 'artifacts/comunica-salvador/public/data/companies/' + company;
const client = (uid, companyId = company) => env.authenticatedContext(uid, { companyId }).firestore();
const ref = (db, path) => doc(db, base + '/' + path);
const value = {
  employeeId: 'person',
  employeeName: 'Colaborador',
  owner: 'manager',
  kind: 'exam',
  title: 'Periódico',
  due: '2026-12-10',
  effective: '',
  nextDate: '',
  status: 'A agendar',
  checks: [],
  note: 'Restrito',
  instruction: 'Liberar para compromisso',
  hasFile: true,
};
const path = 'hrConfidential/case1';
function save(uid, previous = '', revision = 'a', document = path, fields = value) {
  const db = client(uid),
    batch = writeBatch(db);
  const row = { ...fields, updatedAt: serverTimestamp(), updatedBy: uid, previous, revision };
  batch.set(ref(db, document), row);
  batch.set(ref(db, document + '/history/' + revision), row);
  batch.set(ref(db, document + '/files/' + revision), {
    pdf: Bytes.fromUint8Array(new Uint8Array([37, 80, 68, 70])),
  });
  batch.set(ref(db, 'hrAssignments/' + document.split('/')[1]), {
    source: document.split('/')[0],
    owner: 'manager',
    employeeName: 'Colaborador',
    due: value.due,
    instruction: value.instruction,
    completed: false,
  });
  return batch.commit();
}
try {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, base), {});
    for (const [id, permissions] of Object.entries({
      person: {},
      manager: {},
      general: { personnel: true },
      hr: { personnel: true, personnelPrivate: true },
      admin: {},
    })) {
      await setDoc(ref(db, 'users/' + id), { permissions, isAdmin: id === 'admin' });
    }
  });
  await assertFails(save('general'));
  await assertSucceeds(save('hr'));
  await assertSucceeds(save('hr', 'a', 'b'));
  await assertFails(save('hr', 'a', 'c'));
  await assertFails(setDoc(ref(client('hr'), path + '/history/a'), {}));
  await assertSucceeds(save('general', '', 'initial', 'hrCases/admit', { ...value, kind: 'admission' }));
  await assertFails(save('general', '', 'bad', 'hrCases/fake'));
  for (const uid of ['person', 'manager', 'general']) {
    await assertFails(getDoc(ref(client(uid), path)));
    await assertFails(getDoc(ref(client(uid), path + '/files/a')));
    await assertFails(getDocs(collection(client(uid), base + '/' + path + '/history')));
  }
  await assertFails(getDoc(ref(client('hr', 'other'), path)));
  await assertSucceeds(getDoc(ref(client('admin'), path + '/files/a')));
  const manager = client('manager');
  const assigned = await assertSucceeds(
    getDocs(query(collection(manager, base + '/hrAssignments'), where('owner', '==', 'manager'))),
  );
  assert.equal(assigned.size, 2);
  assert.equal(assigned.docs[0].data().note, undefined);
  await assertSucceeds(updateDoc(ref(manager, 'hrAssignments/case1'), { completed: true }));
  await assertFails(updateDoc(ref(manager, 'hrAssignments/case1'), { owner: 'person' }));
  await assertFails(getDoc(ref(client('person'), 'hrAssignments/case1')));
  const goalPath = 'development/person/goals/goal1';
  const goal = () => ({
    title: 'Aprimorar a operação', due: '2026-12-20', status: 'active', nextStep: 'Acompanhar treinamento',
    feedback: '', feedbackAt: null, revision: 1, updatedAt: serverTimestamp(),
  });
  await assertFails(setDoc(ref(client('person'), goalPath), goal()));
  await assertFails(setDoc(ref(client('general'), goalPath), goal()));
  await assertSucceeds(setDoc(ref(client('hr'), goalPath), goal()));
  await assertSucceeds(getDoc(ref(client('person'), goalPath)));
  await assertSucceeds(getDocs(collection(client('person'), base + '/development/person/goals')));
  await assertFails(getDoc(ref(client('person', 'other'), goalPath)));
  await assertFails(getDoc(ref(client('manager'), goalPath)));
  await assertFails(getDocs(collection(client('manager'), base + '/development/person/goals')));
  await assertFails(updateDoc(ref(client('person'), goalPath), { title: 'Tentativa de editar' }));
  await assertFails(setDoc(ref(client('hr'), goalPath), goal()));
  await assertSucceeds(updateDoc(ref(client('admin'), goalPath), {
    feedback: 'Bom progresso', feedbackAt: serverTimestamp(), revision: 2, updatedAt: serverTimestamp(),
  }));
  assert.equal((await getDoc(ref(client('person'), goalPath))).data().feedback, 'Bom progresso');
  console.log('Acesso por empresa e permissão, histórico, PDFs, concorrência e delegação validados.');
} finally {
  await env.cleanup();
}

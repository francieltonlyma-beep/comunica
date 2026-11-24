import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-comunica',
  firestore: {
    host: '127.0.0.1',
    port: 8088,
    rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
  },
});

const company = 'time-pilot-company';
const base = 'artifacts/comunica-salvador/public/data/companies/' + company;
const client = (uid, companyId = company) => env.authenticatedContext(uid, { companyId }).firestore();
const config = db => doc(db, base, 'timePilot', 'config');
const record = (db, uid, id) => doc(db, base, 'timePilotUsers', uid, 'records', id.padEnd(20, '0'));
const pilot = (uid, enabled) => ({ enabled, updatedAt: serverTimestamp(), updatedBy: uid });
const punch = () => ({ kind: 'punch', createdAt: serverTimestamp(), occurredAt: serverTimestamp() });
const adjustment = () => ({
  kind: 'adjustment', createdAt: serverTimestamp(), occurredAt: new Date('2026-01-06T14:00:00Z'),
  status: 'pending', reason: 'Esqueceu a batida',
});
const review = uid => ({ status: 'approved', reviewedAt: serverTimestamp(), reviewedBy: uid });

try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, base), {});
    for (const uid of ['admin', 'person', 'peer', 'hr']) {
      await setDoc(doc(db, base, 'users', uid), { isAdmin: uid === 'admin', permissions: { personnel: uid === 'hr' } });
    }
  });

  const person = client('person');
  const admin = client('admin');
  const hr = client('hr');
  const peer = client('peer');
  const outside = client('person', 'other-company');
  await assertSucceeds(getDoc(config(person)));
  await assertFails(getDoc(config(outside)));
  await assertFails(setDoc(config(person), pilot('person', true)));
  await assertFails(setDoc(record(person, 'person', 'mark'), punch()));

  await assertSucceeds(setDoc(config(admin), pilot('admin', true)));
  await assertFails(setDoc(record(person, 'peer', 'mark'), punch()));
  await assertFails(setDoc(record(outside, 'person', 'mark'), punch()));
  await assertFails(setDoc(record(person, 'person', 'invalid'), { ...punch(), occurredAt: new Date(0) }));
  await assertSucceeds(setDoc(record(person, 'person', 'mark'), punch()));
  await assertFails(updateDoc(record(admin, 'person', 'mark'), review('admin')));
  await assertFails(deleteDoc(record(admin, 'person', 'mark')));
  await assertFails(deleteDoc(record(person, 'person', 'mark')));
  await assertFails(getDoc(record(peer, 'person', 'mark')));
  await assertFails(getDoc(record(outside, 'person', 'mark')));

  await assertFails(setDoc(record(person, 'person', 'adjustment'), { ...adjustment(), status: 'approved' }));
  await assertSucceeds(setDoc(record(person, 'person', 'adjustment'), adjustment()));
  await assertFails(updateDoc(record(person, 'person', 'adjustment'), review('person')));
  await assertFails(updateDoc(record(hr, 'person', 'adjustment'), { ...review('hr'), reason: 'Mudou o original' }));
  await assertSucceeds(updateDoc(record(hr, 'person', 'adjustment'), review('hr')));
  await assertFails(updateDoc(record(admin, 'person', 'adjustment'), { ...review('admin'), status: 'rejected' }));
  const records = collection(hr, base, 'timePilotUsers', 'person', 'records');
  await assertSucceeds(getDocs(query(records, where('occurredAt', '>=', new Date(0)), orderBy('occurredAt', 'desc'))));

  await assertFails(setDoc(record(person, 'person', 'fakeproof'), { ...punch(), verification: 'webauthn' }));
  await assertFails(setDoc(doc(admin, '_timeDeviceKeys', 'foreign'), { credential: {} }));
  const parameters = db => doc(db, base, 'timePilot', 'parameters');
  const limits = { adjustmentDays: 7, reasonLength: 12, updatedAt: serverTimestamp(), updatedBy: 'admin' };
  await assertFails(setDoc(parameters(person), { ...limits, updatedBy: 'person' }));
  await assertFails(setDoc(parameters(admin), { ...limits, adjustmentDays: -1 }));
  await assertSucceeds(setDoc(parameters(admin), limits));
  await assertFails(getDoc(parameters(outside)));
  const recent = { ...adjustment(), occurredAt: new Date(Date.now() - 60000) };
  await assertFails(setDoc(record(person, 'person', 'short'), { ...recent, reason: 'curto' }));
  await assertFails(setDoc(record(person, 'person', 'expired'), { ...recent, occurredAt: new Date(0) }));
  await assertSucceeds(setDoc(record(person, 'person', 'recent'), recent));
  await assertSucceeds(setDoc(record(person, 'person', 'entry'), { ...punch(), punchType: 'entry' }));
  await assertFails(setDoc(record(person, 'person', 'invalidtype'), { ...punch(), punchType: 'invalid' }));
  await assertSucceeds(setDoc(config(admin), pilot('admin', false)));
  await assertFails(setDoc(record(person, 'person', 'disabled'), punch()));
  await assertSucceeds(getDoc(record(person, 'person', 'mark')));
} finally {
  await env.cleanup();
}

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-comunica',
  firestore: { host: '127.0.0.1', port: 8088, rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
});
const base = 'artifacts/comunica-salvador/public/data/companies/tenant-a';
const supplier = Object.fromEntries([
  'name','legalName','taxId','stateRegistration','activity','phone','email','address',
  'number','complement','district','postalCode','city','state',
].map(key => [key, key === 'name' ? 'Fornecedor teste' : '']));

try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, base), { name: 'Empresa teste', codeBlocked: false });
    await setDoc(doc(db, `${base}/users/admin`), { isAdmin: true });
    await setDoc(doc(db, `${base}/users/employee`), { isAdmin: false });
    await setDoc(doc(db, `${base}/settings/integra-access`), { enabled: true });
  });
  const admin = env.authenticatedContext('admin', { companyId: 'tenant-a' }).firestore();
  const employee = env.authenticatedContext('employee', { companyId: 'tenant-a' }).firestore();
  const outsider = env.authenticatedContext('outsider', { companyId: 'tenant-b' }).firestore();
  const entry = doc(admin, `${base}/purchaseSuppliers/tax-12345678901`);
  await assertSucceeds(setDoc(entry, { ...supplier, createdAt: 1, updatedAt: 1, updatedBy: 'admin' }));
  await assertSucceeds(getDocs(collection(employee, `${base}/purchaseSuppliers`)));
  await assertFails(getDocs(collection(outsider, `${base}/purchaseSuppliers`)));
  await assertFails(setDoc(doc(employee, `${base}/purchaseSuppliers/forged`), { ...supplier, createdAt: 1, updatedAt: 1, updatedBy: 'employee' }));
  await assertSucceeds(updateDoc(entry, { phone: '123', updatedAt: 2, updatedBy: 'admin' }));
  await assertFails(updateDoc(entry, { createdAt: 2, updatedAt: 3, updatedBy: 'admin' }));
  console.log('PASS: fornecedores ficam restritos à empresa e edição administrativa');
} finally { await env.cleanup(); }

import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-comunica',
  firestore: { host: '127.0.0.1', port: 8088, rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  storage: { host: '127.0.0.1', port: 9199, rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8') },
});
const companyId = 'company-a';
const purchaseId = 'purchase123';
const userId = 'employee';
const fileName = '123-photo.jpg';
const path = `companies/${companyId}/users/${userId}/attachments/${fileName}`;
const bucket = 'gs://demo-comunica.appspot.com';
try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    const base = `artifacts/comunica-salvador/public/data/companies/${companyId}`;
    await setDoc(doc(db, base), { codeBlocked: false });
    await setDoc(doc(db, `${base}/users/${userId}`), { isAdmin: false });
    await setDoc(doc(db, `${base}/purchaseRequests/${purchaseId}`), {
      requesterId: userId, participantIds: [userId], status: 'requested',
    });
  });
  const uploader = env.authenticatedContext(userId, {
    companyId, uploadAuthorized: true, uploadCompanyId: companyId, uploadFolder: 'attachments',
    uploadFileName: fileName, uploadSize: 3, uploadContentType: 'image/jpeg', uploadPurchaseId: purchaseId,
  });
  const target = ref(uploader.storage(bucket), path);
  await assertSucceeds(uploadBytes(target, new Uint8Array([1, 2, 3]), {
    contentType: 'image/jpeg', customMetadata: { ownerUid: userId, purchaseId },
  }));
  console.log('PASS: anexo da compra enviado com autorização vinculada ao pedido');

  const mismatched = env.authenticatedContext('other', {
    companyId, uploadAuthorized: true, uploadCompanyId: companyId, uploadFolder: 'attachments',
    uploadFileName: fileName, uploadSize: 3, uploadContentType: 'image/jpeg', uploadPurchaseId: 'different',
  });
  await assertFails(uploadBytes(ref(mismatched.storage(bucket), `companies/${companyId}/users/other/attachments/${fileName}`),
    new Uint8Array([1, 2, 3]), {contentType:'image/jpeg', customMetadata:{ownerUid:'other',purchaseId}}));

  const reader = env.authenticatedContext(userId, {companyId, purchaseReadId: purchaseId, purchaseReadPath: path});
  await assertSucceeds(getBytes(ref(reader.storage(bucket), path)));
  const other = env.authenticatedContext('other', {companyId, purchaseReadId: 'different', purchaseReadPath: path});
  await assertFails(getBytes(ref(other.storage(bucket), path)));
  console.log('PASS: upload e leitura exigem autorização para o pedido e arquivo exatos');
} finally {
  await env.cleanup();
}

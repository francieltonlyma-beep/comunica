import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-comunica', firestore: {
  host: '127.0.0.1', port: 8088, rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
} });
const companyId = 'sector-test';
const base = 'artifacts/comunica-salvador/public/data/companies/' + companyId;
const post = uid => doc(env.authenticatedContext(uid, { companyId }).firestore(), base, 'posts', 'fixture');
try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, base), {});
    for (const uid of ['ana', 'bia', 'outro']) {
      await setDoc(doc(db, base, 'users', uid), { isAdmin: false, depts: [uid === 'outro' ? 'compras' : 'rh'] });
    }
    await setDoc(doc(db, base, 'posts', 'fixture'), { dept: 'rh', allowComments: true, allowLikes: false });
  });
  const ana = post('ana');
  const bia = post('bia');
  await Promise.all([updateDoc(ana, {openedBy: arrayUnion('ana')}), updateDoc(bia, {openedBy: arrayUnion('bia')})]);
  await assertSucceeds(updateDoc(ana, {openedBy: arrayUnion('ana')}));
  assert.equal((await getDoc(ana)).data().openedBy.length, 2);
  assert.equal((await getDoc(ana)).data().readBy, undefined);
  await assertSucceeds(updateDoc(ana, {readBy: arrayUnion('ana')}));
  await assertFails(updateDoc(ana, {readBy: arrayUnion('bia')}));
  await assertFails(updateDoc(post('outro'), {openedBy: arrayUnion('outro')}));
  await assertFails(updateDoc(ana, {likedBy: ['ana'], likes: 1}));
  const comment = {authorId:'ana', text:'Recebido'};
  await assertSucceeds(updateDoc(ana, {comments: arrayUnion(comment)}));
  await assertFails(updateDoc(bia, {comments: []}));
  await env.withSecurityRulesDisabled(context => updateDoc(doc(context.firestore(), base, 'posts', 'fixture'), {allowComments:false, allowLikes:true}));
  await assertFails(updateDoc(ana, {comments: arrayUnion({...comment,text:'Outra mensagem'})}));
  await assertSucceeds(updateDoc(ana, {likedBy:['ana'], likes:1}));
  await assertSucceeds(updateDoc(ana, {likedBy:[], likes:0}));
} finally {
  await env.cleanup();
}

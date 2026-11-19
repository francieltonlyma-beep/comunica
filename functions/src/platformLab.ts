import {randomUUID} from 'node:crypto';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {HttpsError} from 'firebase-functions/v2/https';
import {credentialKey} from './privateCredentials';
import {SUPPORT_UID} from './platformSupport';

const APP_ID = 'comunica-salvador';

export async function managePlatformLab(auth: {uid: string; token: Record<string, unknown>} | undefined, action: unknown) {
  if (auth?.uid !== SUPPORT_UID || auth.token.isDeveloper !== true) {
    throw new HttpsError('permission-denied', 'O laboratório é reservado ao suporte.');
  }
  if (action !== 'open' && action !== 'reset') {
    throw new HttpsError('invalid-argument', 'Escolha abrir ou limpar o laboratório.');
  }
  const db = getFirestore();
  const support = db.doc(`_platformSupport/${SUPPORT_UID}`);
  const labSlot = db.doc('_platformLabs/main');
  const companyRoot = db.collection(`artifacts/${APP_ID}/public/data/companies`);
  const newId = `lab-${randomUUID()}`;

  const lab = await db.runTransaction(async tx => {
    const [authorization, slot] = await tx.getAll(support, labSlot);
    if (authorization.get('enabled') !== true || authorization.get('appId') !== APP_ID) {
      throw new HttpsError('permission-denied', 'Acesso de suporte desativado.');
    }
    const companyId = slot.get('companyId');
    const uid = slot.get('uid');
    if (slot.exists) {
      if (typeof companyId !== 'string' || !/^lab-[a-f0-9-]{36}$/.test(companyId) || uid !== `tester-${companyId}`) {
        throw new HttpsError('failed-precondition', 'Identificação do laboratório inválida.');
      }
      const company = companyRoot.doc(companyId);
      const snapshot = await tx.get(company);
      if (snapshot.exists && snapshot.get('platformLab') !== true) {
        throw new HttpsError('failed-precondition', 'Esta empresa não pertence ao laboratório.');
      }
      if (action === 'reset') {
        if (snapshot.exists) tx.update(company, {codeBlocked: true});
        tx.update(labSlot, {resetting: true});
        return {companyId, uid};
      }
      if (slot.get('resetting') || !snapshot.exists || snapshot.get('codeBlocked')) {
        throw new HttpsError('failed-precondition', 'Conclua a limpeza antes de abrir o laboratório.');
      }
      return {companyId, uid};
    }
    if (action === 'reset') throw new HttpsError('not-found', 'Nenhum laboratório criado.');
    const company = companyRoot.doc(newId);
    const testerId = `tester-${newId}`;
    const profile = {id: testerId, companyId: newId, name: 'Administrador de testes', role: 'Administrador', isAdmin: true, depts: ['lab']};
    tx.create(labSlot, {companyId: newId, uid: testerId});
    tx.create(company, {id: newId, name: 'Laboratório do Comunica', code: newId.toUpperCase(), platformLab: true, createdAt: Date.now()});
    tx.create(company.collection('users').doc(testerId), profile);
    tx.create(company.collection('userDirectory').doc(testerId), profile);
    tx.create(company.collection('departments').doc('lab'), {id: 'lab', name: 'Setor de testes', color: 'slate'});
    tx.create(company.collection('settings').doc('integra-access'), {enabled: true, userIds: []});
    return {companyId: newId, uid: testerId};
  });

  const companyRef = companyRoot.doc(lab.companyId);
  if (action === 'reset') {
    const [users, purchaseLinks] = await Promise.all([
      companyRef.collection('users').get(),
      db.collection('purchaseInvitationTokens').where('companyId', '==', lab.companyId).get(),
    ]);
    await getStorage().bucket().deleteFiles({prefix: `companies/${lab.companyId}/`});
    const writer = db.bulkWriter();
    const userIds = [...new Set([lab.uid, ...users.docs.map(user => user.id)])];
    const removals = [
      ...purchaseLinks.docs.map(link => writer.delete(link.ref)),
      ...userIds.map(userId => writer.delete(db.collection('_privateCredentials')
        .doc(credentialKey({appId: APP_ID, companyId: lab.companyId, userId})))),
    ];
    await Promise.all([writer.close(), ...removals]);
    for (let offset = 0; offset < userIds.length; offset += 100) {
      const result = await getAuth().deleteUsers(userIds.slice(offset, offset + 100));
      if (result.failureCount > 0) {
        throw new HttpsError('unavailable', 'Não foi possível limpar as contas de testes. Tente novamente.');
      }
    }
    await db.recursiveDelete(companyRef);
    await db.runTransaction(async tx => {
      const slot = await tx.get(labSlot);
      if (slot.get('companyId') === lab.companyId && slot.get('resetting')) tx.delete(labSlot);
    });
    return {reset: true};
  }
  const [company, user] = await Promise.all([
    companyRef.get(),
    companyRef.collection('users').doc(lab.uid).get(),
  ]);
  if (!company.exists || company.get('codeBlocked') || !user.exists) {
    throw new HttpsError('failed-precondition', 'O laboratório está indisponível.');
  }
  const token = await getAuth().createCustomToken(lab.uid, {companyId: lab.companyId, isAdmin: true, isDeveloper: false});
  return {company: company.data(), user: user.data(), token};
}

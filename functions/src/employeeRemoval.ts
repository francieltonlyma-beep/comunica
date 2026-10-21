import {Firestore} from 'firebase-admin/firestore';
import {credentialKey} from './privateCredentials';
import {SUPPORT_UID} from './platformSupport';

type Actor = {uid: string; companyId: string; isDeveloper: boolean};
const validId = (value: string) => /^[a-zA-Z0-9_-]+$/.test(value);
const normalizedName = (value: unknown) => String(value || '').trim().toLocaleLowerCase('pt-BR');

export async function removeEmployeeAccess(database: Firestore, appId: string, companyId: string,
  targetId: string, actor: Actor): Promise<{presenceRemoved: number}> {
  if (appId !== 'comunica-salvador' ||
      [companyId, targetId, actor.uid].some(value => !validId(value)) ||
      targetId === SUPPORT_UID || targetId === actor.uid) throw new Error('Invalid removal request');

  const company = database.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  const users = company.collection('users');
  const presence = company.collection('presence');
  const credential = database.collection('_privateCredentials').doc(credentialKey({appId, companyId, userId: targetId}));

  return database.runTransaction(async transaction => {
    const [userSnapshots, presenceSnapshots] = await Promise.all([
      transaction.get(users), transaction.get(presence),
    ]);
    const target = userSnapshots.docs.find(document => document.id === targetId);
    if (!target || target.data().isDeveloper === true) throw new Error('Employee not found');

    if (actor.uid === SUPPORT_UID && actor.isDeveloper) {
      const support = await transaction.get(database.doc(`_platformSupport/${SUPPORT_UID}`));
      if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== appId) {
        throw new Error('Support access revoked');
      }
    } else {
      const currentActor = userSnapshots.docs.find(document => document.id === actor.uid);
      if (actor.companyId !== companyId || actor.isDeveloper || !currentActor ||
          currentActor.data().isAdmin !== true) throw new Error('Not authorized');
    }

    const employees = userSnapshots.docs.filter(document => document.id !== SUPPORT_UID &&
      document.data().isDeveloper !== true);
    if (employees.length <= 1) throw new Error('Last employee');
    if (target.data().isAdmin === true && employees.filter(document => document.data().isAdmin === true).length <= 1) {
      throw new Error('Last administrator');
    }

    const name = normalizedName(target.data().name);
    const nameIsUnique = Boolean(name) && employees.filter(document => normalizedName(document.data().name) === name).length === 1;
    const linkedPresence = presenceSnapshots.docs.filter(document => {
      const data = document.data();
      return data.userId === targetId || (!data.userId && nameIsUnique && normalizedName(data.name) === name);
    });
    if (linkedPresence.length > 448) throw new Error('Too many presence records');

    transaction.delete(target.ref);
    transaction.delete(credential);
    linkedPresence.forEach(document => transaction.delete(document.ref));
    return {presenceRemoved: linkedPresence.length};
  });
}

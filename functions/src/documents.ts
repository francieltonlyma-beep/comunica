import {getFirestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

const APP_ID = 'comunica-salvador';
const validId = (value: string) => /^[A-Za-z0-9_-]{1,240}$/.test(value);

type Identity = {uid: string; token: Record<string, unknown>};

export async function listAccessibleDocuments(identity: Identity | undefined, rawCompanyId: unknown) {
  const companyId = String(rawCompanyId || '');
  if (!identity?.uid || !validId(companyId)) throw new HttpsError('unauthenticated', 'Entre novamente para acessar os documentos.');
  const database = getFirestore();
  // The immutable support UID plus the private server-side authorization record
  // are the source of truth. Custom claims can lag behind after a tenant switch.
  const isSupport = identity.uid === 'platform-support-francielton';
  let isAdmin = false;
  let departments: string[] = [];
  if (isSupport) {
    const support = await database.doc(`_platformSupport/${identity.uid}`).get();
    if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== APP_ID) throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
    isAdmin = true;
  } else {
    if (identity.token.companyId !== companyId || identity.token.isDeveloper === true) throw new HttpsError('permission-denied', 'Acesso à empresa não autorizado.');
    const profile = await database.doc(`artifacts/${APP_ID}/public/data/companies/${companyId}/users/${identity.uid}`).get();
    if (!profile.exists) throw new HttpsError('permission-denied', 'Colaborador não encontrado.');
    const data = profile.data() || {};
    // O perfil atual é a fonte de verdade. Assim, promoções e revogações passam
    // a valer imediatamente, sem depender de sair e entrar novamente.
    isAdmin = data.isAdmin === true;
    departments = Array.isArray(data.depts) ? data.depts.map(String) : [];
  }
  const snapshot = await database.collection(`artifacts/${APP_ID}/public/data/companies/${companyId}/documents`).get();
  const documents = snapshot.docs.map(item => ({id: item.id, ...item.data()})).filter((document: Record<string, unknown>) => {
    if (isAdmin) return true;
    const accessMode = String(document.accessMode || (Array.isArray(document.allowedUserIds) && document.allowedUserIds.length ? 'people' : document.dept === 'all' ? 'company' : 'department'));
    if (accessMode === 'company') return true;
    if (accessMode === 'people') return Array.isArray(document.allowedUserIds) && document.allowedUserIds.includes(identity.uid);
    return document.dept === 'all' || departments.includes(String(document.dept || ''));
  });
  return {documents};
}


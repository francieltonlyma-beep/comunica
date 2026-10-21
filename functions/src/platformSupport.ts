import {Firestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {privateCredentials} from './privateCredentials';

export const SUPPORT_UID = 'platform-support-francielton';

// Provisioned only through a controlled server migration, never from public profiles.
export async function verifyPlatformSupport(database: Firestore, appId: string, pin: string) {
  if (appId !== 'comunica-salvador') return null;
  const accessRef = database.doc(`_platformSupport/${SUPPORT_UID}`);
  const access = (await accessRef.get()).data();
  if (!access || access.enabled !== true || access.appId !== appId ||
      typeof access.companyId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(access.companyId)) return null;
  const scope = {appId, companyId: access.companyId, userId: SUPPORT_UID};
  // No public-PIN fallback: private credentials must exist before deployment.
  const verification = await privateCredentials(database).verify(scope, pin);
  if (verification === 'locked') throw new HttpsError('resource-exhausted', 'Muitas tentativas. Aguarde 30 segundos e tente novamente.');
  if (verification !== 'ok') return null;
  const latest = (await accessRef.get()).data();
  if (!latest || latest.enabled !== true || latest.companyId !== scope.companyId || latest.appId !== appId) return null;
  return scope;
}

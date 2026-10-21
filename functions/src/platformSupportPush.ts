import {FieldValue, Firestore} from 'firebase-admin/firestore';
import {SUPPORT_UID} from './platformSupport';

const APP_ID = 'comunica-salvador';
const validToken = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 20 && value.length <= 4096 &&
  /^[A-Za-z0-9:_-]+$/.test(value);

export async function registerPlatformPushToken(
  database: Firestore,
  identity: {uid: string; companyId: string; isDeveloper: boolean},
  token: unknown,
) {
  if (identity.uid !== SUPPORT_UID || !identity.isDeveloper || !validToken(token)) return false;
  const accessRef = database.doc(`_platformSupport/${SUPPORT_UID}`);
  return database.runTransaction(async transaction => {
    const snapshot = await transaction.get(accessRef);
    const access = snapshot.data();
    if (!access || access.enabled !== true || access.appId !== APP_ID ||
      access.companyId !== identity.companyId) return false;
    const previous = Array.isArray(access.pushTokens) ? access.pushTokens.filter(validToken) : [];
    const tokens = [...new Set([...previous, token])].slice(-10);
    transaction.update(accessRef, {pushTokens: tokens, pushTokensUpdatedAt: FieldValue.serverTimestamp()});
    return true;
  });
}

export async function getSupportNotificationTokens(
  database: Firestore,
  appId: string,
  participants: string[],
  senderId: string,
) {
  if (appId !== APP_ID || !participants.includes(SUPPORT_UID) || senderId === SUPPORT_UID) return [];
  const access = (await database.doc(`_platformSupport/${SUPPORT_UID}`).get()).data();
  if (!access || access.enabled !== true || access.appId !== APP_ID) return [];
  return Array.isArray(access.pushTokens) ? [...new Set(access.pushTokens.filter(validToken))] : [];
}

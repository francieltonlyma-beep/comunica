import {createHash, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {DocumentReference, FieldValue, Firestore} from 'firebase-admin/firestore';

export type CredentialScope = {appId: string; companyId: string; userId: string};
export type CredentialChangeRecords = {
  profileRef: DocumentReference;
  profileData: Record<string, unknown>;
  auditRef: DocumentReference;
  auditData: Record<string, unknown>;
};
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

export function credentialKey(scope: CredentialScope): string {
  if (Object.values(scope).some(value => typeof value !== 'string' || !value || value.length > 256)) {
    throw new Error('Invalid credential scope');
  }
  return createHash('sha256').update(JSON.stringify([scope.appId, scope.companyId, scope.userId])).digest('hex');
}

export function hashPin(pin: string) {
  if (!/^\d{4,6}$/.test(pin)) throw new Error('Invalid PIN format');
  const salt = randomBytes(16).toString('hex');
  return {algorithm: 'scrypt-v1', salt, digest: scryptSync(pin, salt, 32).toString('hex')};
}

export function matchesPin(pin: string, record: Record<string, unknown>): boolean {
  if (!/^\d{4,6}$/.test(pin) || record.algorithm !== 'scrypt-v1' ||
      typeof record.salt !== 'string' || !/^[a-f0-9]{32}$/.test(record.salt) ||
      typeof record.digest !== 'string' || !/^[a-f0-9]{64}$/.test(record.digest)) return false;
  return timingSafeEqual(scryptSync(pin, record.salt, 32), Buffer.from(record.digest, 'hex'));
}

// Server-only collection: intentionally outside the client-readable company tree.
// These primitives MUST only be called by an authorized service. Not callable endpoints.
export function privateCredentials(database: Firestore, now: () => number = Date.now) {
  const ref = (scope: CredentialScope) => database.collection('_privateCredentials').doc(credentialKey(scope));
  return {
    // actorCompanyId and actorId must come from verified authentication, never form data.
    async resetByCompanyAdmin(scope: CredentialScope, actorCompanyId: string, actorId: string, newPin: string): Promise<boolean> {
      if (actorCompanyId !== scope.companyId ||
          [scope.appId, scope.companyId, scope.userId, actorId].some(value => !/^[a-zA-Z0-9_-]+$/.test(value)) ||
          scope.userId === 'platform-support-francielton') return false;
      const replacement = hashPin(newPin);
      const users = database.collection(`artifacts/${scope.appId}/public/data/companies/${scope.companyId}/users`);
      return database.runTransaction(async tx => {
        const secretRef = ref(scope);
        const [actor, target, secret] = await Promise.all([
          tx.get(users.doc(actorId)), tx.get(users.doc(scope.userId)), tx.get(secretRef),
        ]);
        if (!actor.exists || actor.data()!.isAdmin !== true || !target.exists || target.data()!.isDeveloper === true) return false;
        tx.set(secretRef, {...replacement, failures: 0, windowStart: now(), lockedUntil: 0,
          revision: Number(secret.data()?.revision || 0) + 1,
          resetBy: actorId, resetAt: FieldValue.serverTimestamp()});
        tx.update(users.doc(scope.userId), {pin: FieldValue.delete()});
        return true;
      });
    },
    async migrateLegacy(scope: CredentialScope): Promise<boolean> {
      if ([scope.appId, scope.companyId, scope.userId].some(value => !/^[a-zA-Z0-9_-]+$/.test(value))) {
        throw new Error('Invalid legacy path');
      }
      const profile = database.doc(`artifacts/${scope.appId}/public/data/companies/${scope.companyId}/users/${scope.userId}`);
      return database.runTransaction(async tx => {
        const secretRef = ref(scope);
        const [secret, user] = await Promise.all([tx.get(secretRef), tx.get(profile)]);
        if (!user.exists) return false;
        if (!secret.exists) {
          const pin = user.data()!.pin;
          // Never silently assign a default PIN to an account without credentials.
          if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) return false;
          tx.create(secretRef, {...hashPin(pin), failures: 0, windowStart: now(), lockedUntil: 0, revision: 1});
        }
        if (Object.prototype.hasOwnProperty.call(user.data(), 'pin')) {
          tx.update(profile, {pin: FieldValue.delete()});
        }
        return true;
      });
    },
    async create(scope: CredentialScope, pin: string) {
      await ref(scope).create({...hashPin(pin), failures: 0, windowStart: now(), lockedUntil: 0, revision: 1});
    },
    async verify(scope: CredentialScope, pin: string): Promise<'ok' | 'invalid' | 'locked'> {
      return database.runTransaction(async tx => {
        const document = ref(scope);
        const snapshot = await tx.get(document);
        if (!snapshot.exists) return 'invalid';
        const data = snapshot.data()!;
        const timestamp = now();
        // Locks created before the 30-second policy had no duration marker. Do not
        // keep those accounts blocked for the former 15-minute period after deploy.
        if (Number(data.lockedUntil || 0) > timestamp && Number(data.lockDurationMs || 0) === LOCK_MS) return 'locked';
        if (matchesPin(pin, data)) {
          tx.update(document, {failures: 0, windowStart: timestamp, lockedUntil: 0, lockDurationMs: 0});
          return 'ok';
        }
        const expired = timestamp - Number(data.windowStart || 0) >= WINDOW_MS;
        const failures = expired ? 1 : Number(data.failures || 0) + 1;
        tx.update(document, {failures, windowStart: expired ? timestamp : data.windowStart,
          lockedUntil: failures >= MAX_ATTEMPTS ? timestamp + LOCK_MS : 0,
          lockDurationMs: failures >= MAX_ATTEMPTS ? LOCK_MS : 0});
        return failures >= MAX_ATTEMPTS ? 'locked' : 'invalid';
      });
    },
    async change(scope: CredentialScope, currentPin: string, newPin: string, related?: CredentialChangeRecords): Promise<'changed' | 'invalid' | 'locked' | 'conflict'> {
      // Verification consumes a rate-limited attempt. Revision prevents a stale change
      // from overwriting a simultaneous reset/change after verification.
      const document = ref(scope);
      const before = await document.get();
      if (!before.exists) return 'invalid';
      const verification = await this.verify(scope, currentPin);
      if (verification === 'locked') return 'locked';
      if (verification !== 'ok') return 'invalid';
      const replacement = hashPin(newPin);
      const changed = await database.runTransaction(async tx => {
        const snapshot = await tx.get(document);
        const data = snapshot.data();
        if (!data || data.revision !== before.data()!.revision || !matchesPin(currentPin, data)) return false;
        tx.update(document, {...replacement, failures: 0, windowStart: now(), lockedUntil: 0,
          revision: Number(data.revision) + 1});
        if (related) {
          tx.update(related.profileRef, related.profileData);
          tx.create(related.auditRef, related.auditData);
        }
        return true;
      });
      return changed ? 'changed' : 'conflict';
    },
  };
}

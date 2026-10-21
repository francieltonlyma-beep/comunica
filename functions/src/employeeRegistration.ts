import {Firestore} from 'firebase-admin/firestore';
import {credentialKey, hashPin} from './privateCredentials';

// Identity arguments are derived from verified authentication by the callable.
export async function registerEmployee(database: Firestore, appId: string, companyId: string,
  actorId: string, userId: string, input: Record<string, unknown>, pin: string) {
  if ([appId, companyId, actorId, userId].some(value => !/^[a-zA-Z0-9_-]+$/.test(value)) ||
      userId === 'platform-support-francielton') throw new Error('Invalid identity');
  const strings = ['name', 'role', 'avatar', 'birthDate', 'hireDate', 'emergencyName', 'emergencyPhone', 'emergencyRelationship', 'prodGroup', 'managerId'];
  const profile: Record<string, unknown> = {};
  for (const key of strings) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error('Invalid profile');
    const value = String(input[key] || '').trim();
    if (value.length > (key === 'avatar' ? 4096 : 250)) throw new Error('Profile too long');
    profile[key] = value;
  }
  if (!profile.name || !Array.isArray(input.depts) || !input.depts.length || input.depts.length > 50 ||
      input.depts.some(value => typeof value !== 'string' || !value || value.length > 100)) throw new Error('Invalid departments');
  const timestamp = Date.now();
  const user = {...profile, id: userId, companyId, depts: [...new Set(input.depts)],
    isAdmin: input.isAdmin === true, isDeveloper: false, isEmployee: true, mustChangePin: true,
    createdAt: timestamp, updatedAt: timestamp};
  const presence = {id: `pres-${userId}`, userId, name: profile.name, dept: user.depts[0], status: 'Presencial', notes: ''};
  const company = database.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  const secret = {...hashPin(pin), failures: 0, windowStart: timestamp, lockedUntil: 0, revision: 1};
  await database.runTransaction(async tx => {
    const actor = await tx.get(company.collection('users').doc(actorId));
    if (!actor.exists || actor.data()!.isAdmin !== true) throw new Error('Not authorized');
    tx.create(company.collection('users').doc(userId), user);
    tx.create(company.collection('presence').doc(presence.id), presence);
    tx.create(database.collection('_privateCredentials').doc(credentialKey({appId, companyId, userId})), secret);
  });
  return {user, presence};
}

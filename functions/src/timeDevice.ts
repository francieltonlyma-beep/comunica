import {createHash} from 'node:crypto';
import {FieldValue, Firestore} from 'firebase-admin/firestore';
import {CallableRequest, HttpsError} from 'firebase-functions/v2/https';
import {generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse} from '@simplewebauthn/server';

import {automaticPunchType, punchDays} from './timePunch.js';

const origins = new Set(['https://comunica-info.web.app', 'https://comunica-info.firebaseapp.com']);
const lifetime = 120000;

export async function timeDevice(db: Firestore, request: CallableRequest) {
  const {auth, data} = request;
  const uid = auth?.uid;
  const company = auth?.token.companyId;
  const origin = request.rawRequest.get('origin') || '';
  if (!uid || uid === 'platform-support-francielton' || auth?.token.isDeveloper === true ||
      typeof company !== 'string' || !company || company.includes('/') || company !== data?.company) {
    throw new HttpsError('permission-denied', 'Acesse com sua conta da empresa.');
  }
  const normalPunch = data.action === 'record';
  if (!normalPunch && !origins.has(origin)) throw new HttpsError('failed-precondition', 'Abra o ponto no endereço oficial do Comunica.');
  const rpID = normalPunch ? '' : new URL(origin).hostname;
  const tenant = db.doc('artifacts/comunica-salvador/public/data/companies/' + company);
  const owner = createHash('sha256').update(JSON.stringify([company, uid, rpID])).digest('hex');
  const state = db.collection('_timeDeviceKeys').doc(owner);
  const user = tenant.collection('timePilotUsers').doc(uid);
  const records = user.collection('records');
  if (normalPunch && (typeof data.requestId !== 'string' || !/^[A-Za-z0-9]{20}$/.test(data.requestId))) {
    throw new HttpsError('invalid-argument', 'Identificador da batida inválido.');
  }
  const record = normalPunch ? records.doc(data.requestId) : records.doc();
  return db.runTransaction(async tx => {
    const [org, profile, pilot, policy] = await tx.getAll(tenant, tenant.collection('users').doc(uid),
      tenant.collection('timePilot').doc('config'), tenant.collection('timePilot').doc('parameters'));
    if (!org.exists || org.get('codeBlocked') === true || !profile.exists || pilot.get('enabled') !== true) {
      throw new HttpsError('permission-denied', 'Registro de ponto indisponível nesta empresa.');
    }

    async function writePunch(verified: boolean) {
      // Serialize regular and verified writes for this employee, including a first punch on an empty day.
      await tx.get(user);
      if (!verified) {
        const previous = await tx.get(record);
        if (previous.exists) {
          if (previous.get('kind') === 'punch') return {recordId: record.id, punchType: previous.get('punchType')};
          throw new HttpsError('already-exists', 'Já existe um registro com esse identificador.');
        }
      }
      const now = new Date();
      const {previousStart} = punchDays(now);
      const history = await tx.get(records.where('occurredAt', '>=', previousStart).orderBy('occurredAt'));
      const marks = history.docs.flatMap(item => {
        if (item.get('kind') === 'punch') return [{at: item.get('occurredAt').toDate(), type: item.get('punchType') || 'entry'}];
        if (item.get('kind') === 'adjustment' && item.get('status') === 'approved') return [{at: item.get('occurredAt').toDate()}];
        return [];
      });
      const schedules = marks.length ? (await tx.get(tenant.collection('schedules').where('userId', '==', uid)
        .select('date', 'startDate', 'endDate', 'status', 'shiftStart', 'shiftEnd', 'breakStart', 'breakEnd', 'updatedAt', 'createdAt')))
        .docs.map(item => item.data()) : [];
      const punchType = automaticPunchType(now, marks, schedules);
      tx.set(user, {lastPunchId: record.id}, {merge: true});
      tx.create(record, {kind: 'punch', punchType, ...(verified ? {verification: 'webauthn'} : {}),
        createdAt: FieldValue.serverTimestamp(), occurredAt: FieldValue.serverTimestamp()});
      return {recordId: record.id, punchType};
    }

    if (normalPunch) return writePunch(false);
    if (policy.get('deviceVerification') !== true) {
      throw new HttpsError('permission-denied', 'Verificação pelo aparelho indisponível nesta empresa.');
    }
    const existing = await tx.get(state);
    const key = existing.data()?.credential;
    if (data.action === 'revoke') {
      tx.delete(state);
      return {revoked: true};
    }
    if (data.action === 'begin') {
      const mode = key ? 'authenticate' : 'register';
      const options = key ? await generateAuthenticationOptions({
        rpID, allowCredentials: [{id: key.id, transports: ['internal']}], userVerification: 'required', timeout: lifetime,
      }) : await generateRegistrationOptions({
        rpID, rpName: 'Comunica Gestão', userID: new Uint8Array(Buffer.from(owner, 'hex')),
        userName: String(profile.get('name') || uid), timeout: lifetime, attestationType: 'none',
        authenticatorSelection: {authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required'},
      });
      tx.set(state, {pending: {challenge: options.challenge, mode, expires: Date.now() + lifetime}}, {merge: true});
      return {mode, options};
    }
    if (data.action !== 'finish') throw new HttpsError('invalid-argument', 'Operação desconhecida.');
    const pending = existing.data()?.pending;
    if (!pending || pending.expires <= Date.now()) throw new HttpsError('failed-precondition', 'Pedido expirado. Inicie novamente.');
    const checks = {expectedOrigin: origin, expectedRPID: rpID, expectedChallenge: pending.challenge, requireUserVerification: true};
    let counter: number;
    try {
      if (pending.mode === 'register' && !key) {
        const result = await verifyRegistrationResponse({...checks, response: data.response});
        if (!result.verified || !result.registrationInfo) throw new Error();
        const credential = result.registrationInfo.credential;
        tx.set(state, {credential: {id: credential.id, publicKey: Buffer.from(credential.publicKey).toString('base64url'), counter: credential.counter}});
        return {registered: true};
      }
      if (pending.mode !== 'authenticate' || !key || data.response?.id !== key.id) throw new Error();
      const result = await verifyAuthenticationResponse({...checks, response: data.response, credential: {
        id: key.id, counter: key.counter, publicKey: new Uint8Array(Buffer.from(key.publicKey, 'base64url')),
      }});
      if (!result.verified) throw new Error();
      counter = result.authenticationInfo.newCounter;
    } catch {
      throw new HttpsError('failed-precondition', 'A verificação do aparelho não foi confirmada.');
    }
    const punch = await writePunch(true);
    tx.update(state, {'credential.counter': counter, pending: FieldValue.delete()});
    return punch;
  });
}

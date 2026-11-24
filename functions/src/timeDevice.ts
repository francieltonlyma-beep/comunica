import {createHash} from 'node:crypto';
import {FieldValue, Firestore} from 'firebase-admin/firestore';
import {CallableRequest, HttpsError} from 'firebase-functions/v2/https';
import {generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse} from '@simplewebauthn/server';

const origins = new Set(['https://comunica-info.web.app', 'https://comunica-info.firebaseapp.com']);
const types = new Set(['entry', 'breakStart', 'breakEnd', 'exit']);
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
  if (!origins.has(origin)) throw new HttpsError('failed-precondition', 'Abra o ponto no endereço oficial do Comunica.');
  const rpID = new URL(origin).hostname;
  const tenant = db.doc('artifacts/comunica-salvador/public/data/companies/' + company);
  const owner = createHash('sha256').update(JSON.stringify([company, uid, rpID])).digest('hex');
  const state = db.collection('_timeDeviceKeys').doc(owner);
  const record = tenant.collection('timePilotUsers').doc(uid).collection('records').doc();
  return db.runTransaction(async tx => {
    const [org, profile, pilot, policy, existing] = await tx.getAll(tenant, tenant.collection('users').doc(uid),
      tenant.collection('timePilot').doc('config'), tenant.collection('timePilot').doc('parameters'), state);
    if (!org.exists || org.get('codeBlocked') === true || !profile.exists || pilot.get('enabled') !== true ||
        policy.get('deviceVerification') !== true) throw new HttpsError('permission-denied', 'Verificação pelo aparelho indisponível nesta empresa.');
    const key = existing.data()?.credential;
    if (data.action === 'revoke') {
      tx.delete(state);
      return {revoked: true};
    }
    if (data.action === 'begin') {
      if (!types.has(data.punchType)) throw new HttpsError('invalid-argument', 'Tipo de batida inválido.');
      const mode = key ? 'authenticate' : 'register';
      const options = key ? await generateAuthenticationOptions({
        rpID, allowCredentials: [{id: key.id, transports: ['internal']}], userVerification: 'required', timeout: lifetime,
      }) : await generateRegistrationOptions({
        rpID, rpName: 'Comunica Gestão', userID: new Uint8Array(Buffer.from(owner, 'hex')),
        userName: String(profile.get('name') || uid), timeout: lifetime, attestationType: 'none',
        authenticatorSelection: {authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required'},
      });
      tx.set(state, {pending: {challenge: options.challenge, mode, punchType: data.punchType, expires: Date.now() + lifetime}}, {merge: true});
      return {mode, options};
    }
    if (data.action !== 'finish') throw new HttpsError('invalid-argument', 'Operação desconhecida.');
    const pending = existing.data()?.pending;
    if (!pending || pending.expires <= Date.now()) throw new HttpsError('failed-precondition', 'Pedido expirado. Inicie novamente.');
    const checks = {expectedOrigin: origin, expectedRPID: rpID, expectedChallenge: pending.challenge, requireUserVerification: true};
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
      tx.update(state, {'credential.counter': result.authenticationInfo.newCounter, pending: FieldValue.delete()});
      tx.create(record, {kind: 'punch', punchType: pending.punchType, verification: 'webauthn',
        createdAt: FieldValue.serverTimestamp(), occurredAt: FieldValue.serverTimestamp()});
      return {recordId: record.id};
    } catch {
      throw new HttpsError('failed-precondition', 'A verificação do aparelho não foi confirmada.');
    }
  });
}

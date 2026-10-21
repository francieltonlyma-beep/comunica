import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';

const APP_ID = 'comunica-salvador';
const normalize = (value: unknown) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const privateReports = (companyId: string) => getFirestore().collection('_privateWhistleblowing').doc(companyId).collection('reports');
const secretHash = (secret: string) => createHash('sha256').update(secret).digest('hex');

export async function getPublicCompany(companyId: unknown) {
  const id = String(companyId || '');
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) throw new HttpsError('invalid-argument', 'Link de empresa inválido.');
  const snapshot = await getFirestore().doc(`artifacts/${APP_ID}/public/data/companies/${id}`).get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');
  return {companyId: id, companyName: String(snapshot.data()?.name || 'Empresa'), enabled: true};
}

export async function submitPublicReport(data: Record<string, unknown>, ip: string) {
  const company = await getPublicCompany(data.companyId);
  if (String(data.website || '').trim()) throw new HttpsError('invalid-argument', 'Não foi possível receber o relato.');
  const category = String(data.category || '').trim();
  const description = String(data.description || '').trim();
  const identified = data.identified === true;
  const reporterName = String(data.reporterName || '').trim().slice(0, 120);
  const reporterEmail = String(data.reporterEmail || '').trim().slice(0, 200);
  const allowedCategories = ['Assédio moral', 'Assédio sexual', 'Discriminação', 'Fraude ou irregularidade', 'Segurança e saúde', 'Violação de políticas', 'Outro'];
  if (!allowedCategories.includes(category) || description.length < 30 || description.length > 8000 ||
      (identified && (!reporterName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)))) {
    throw new HttpsError('invalid-argument', 'Confira a categoria e o relato. O texto deve ter entre 30 e 8.000 caracteres.');
  }

  const database = getFirestore();
  const hour = Math.floor(Date.now() / 3_600_000);
  const ipHash = secretHash(`${company.companyId}:${ip || 'unknown'}`).slice(0, 48);
  const rateRef = database.collection('_privateWhistleblowingRateLimits').doc(ipHash);
  const counterRef = database.collection('_privateWhistleblowing').doc(company.companyId).collection('settings').doc('counter');
  const reportId = randomUUID();
  const reportRef = privateReports(company.companyId).doc(reportId);
  const accessKey = randomBytes(24).toString('base64url');
  const now = Date.now();
  let sequence = 0;
  await database.runTransaction(async transaction => {
    const [rate, counter] = await Promise.all([transaction.get(rateRef), transaction.get(counterRef)]);
    const submissions = rate.data()?.hour === hour ? Number(rate.data()?.submissions || 0) : 0;
    if (submissions >= 4) throw new HttpsError('resource-exhausted', 'Limite temporário atingido. Tente novamente mais tarde.');
    sequence = Number(counter.data()?.lastNumber || 0) + 1;
    transaction.set(rateRef, {hour, submissions: submissions + 1, expiresAt: now + 48 * 3_600_000});
    transaction.set(counterRef, {lastNumber: sequence, updatedAt: now}, {merge: true});
    transaction.create(reportRef, {
      id: reportId,
      protocol: `DEN-${new Date(now).getUTCFullYear()}-${String(sequence).padStart(6, '0')}`,
      accessKeyHash: secretHash(accessKey),
      category,
      description,
      identified,
      ...(identified ? {reporterName, reporterEmail} : {}),
      status: 'received',
      publicReply: '',
      createdAt: now,
      updatedAt: now,
      history: [{status: 'received', at: now, note: 'Relato recebido.'}],
    });
  });
  return {protocol: `DEN-${new Date(now).getUTCFullYear()}-${String(sequence).padStart(6, '0')}`, accessKey, companyName: company.companyName};
}

export async function getPublicReportStatus(data: Record<string, unknown>) {
  const company = await getPublicCompany(data.companyId);
  const protocol = String(data.protocol || '').trim().toUpperCase();
  const accessKey = String(data.accessKey || '');
  if (!/^DEN-\d{4}-\d{6}$/.test(protocol) || accessKey.length < 20 || accessKey.length > 100) throw new HttpsError('invalid-argument', 'Protocolo ou chave inválidos.');
  const result = await privateReports(company.companyId).where('protocol', '==', protocol).limit(1).get();
  if (result.empty || result.docs[0].data().accessKeyHash !== secretHash(accessKey)) throw new HttpsError('permission-denied', 'Protocolo ou chave não conferem.');
  const report = result.docs[0].data();
  return {protocol, status: report.status, publicReply: String(report.publicReply || ''), updatedAt: Number(report.updatedAt || report.createdAt)};
}

const authorizedProfile = async (auth: {uid: string; token: Record<string, unknown>} | undefined, companyId: string) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Entre na plataforma para acessar os relatos.');
  const snapshot = await getFirestore().doc(`artifacts/${APP_ID}/public/data/companies/${companyId}/users/${auth.uid}`).get();
  if (!snapshot.exists || String(snapshot.data()?.companyId || companyId) !== companyId || auth.token.companyId !== companyId) {
    throw new HttpsError('permission-denied', 'Acesso restrito à empresa do usuário.');
  }
  const profile = snapshot.data() || {};
  const admin = profile.isAdmin === true && auth.token.isAdmin === true;
  const hr = [profile.role, profile.department, profile.dept, ...(Array.isArray(profile.departments) ? profile.departments : []), ...(Array.isArray(profile.depts) ? profile.depts : [])]
    .some(value => /(^|\b)(rh|recursos humanos)(\b|$)/.test(normalize(value)));
  const explicitlyGranted = profile.permissions?.tabs?.whistleblowing === true;
  if (!admin && !(hr && explicitlyGranted)) throw new HttpsError('permission-denied', 'Acesso permitido apenas a administradores e RH autorizado nas permissões.');
  return profile;
};

export async function listPrivateReports(auth: {uid: string; token: Record<string, unknown>} | undefined, companyIdRaw: unknown) {
  const companyId = String(companyIdRaw || '');
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(companyId)) throw new HttpsError('invalid-argument', 'Empresa inválida.');
  await authorizedProfile(auth, companyId);
  const snapshot = await privateReports(companyId).orderBy('createdAt', 'desc').limit(200).get();
  return {reports: snapshot.docs.map(document => {
    const {accessKeyHash: _secret, ...report} = document.data();
    return report;
  })};
}

export async function updatePrivateReport(auth: {uid: string; token: Record<string, unknown>} | undefined, data: Record<string, unknown>) {
  const companyId = String(data.companyId || '');
  const reportId = String(data.reportId || '');
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(companyId) || !/^[a-f0-9-]{36}$/i.test(reportId)) throw new HttpsError('invalid-argument', 'Relato inválido.');
  const profile = await authorizedProfile(auth, companyId);
  const status = String(data.status || '');
  const publicReply = String(data.publicReply || '').trim().slice(0, 1500);
  const allowed = ['received', 'under_review', 'awaiting_information', 'resolved', 'closed'];
  if (!allowed.includes(status)) throw new HttpsError('invalid-argument', 'Status inválido.');
  const ref = privateReports(companyId).doc(reportId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Relato não encontrado.');
  const now = Date.now();
  const statusLabels: Record<string, string> = {received: 'Recebida', under_review: 'Em apuração', awaiting_information: 'Aguardando informações', resolved: 'Apurada', closed: 'Encerrada'};
  await ref.update({status, publicReply, updatedAt: now, history: FieldValue.arrayUnion({status, at: now, note: `Atualizada por ${String(profile.name || 'responsável autorizado')}.`})});
  return {updated: true};
}

export async function deletePrivateReport(auth: {uid: string; token: Record<string, unknown>} | undefined, data: Record<string, unknown>) {
  const companyId = String(data.companyId || '');
  const reportId = String(data.reportId || '');
  const protocol = String(data.protocol || '').trim().toUpperCase();
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(companyId) || !/^[a-f0-9-]{36}$/i.test(reportId) || !/^DEN-\d{4}-\d{6}$/.test(protocol)) {
    throw new HttpsError('invalid-argument', 'Confirme a empresa e o protocolo do relato.');
  }
  await authorizedProfile(auth, companyId);
  const reportRef = privateReports(companyId).doc(reportId);
  const snapshot = await reportRef.get();
  if (!snapshot.exists) throw new HttpsError('not-found', 'Relato não encontrado.');
  if (String(snapshot.data()?.protocol || '').toUpperCase() !== protocol) {
    throw new HttpsError('failed-precondition', 'O protocolo informado não corresponde ao relato selecionado.');
  }
  await reportRef.delete();
  return {deleted: true, protocol};
}

// Ação pontual confirmada pelo usuário: o suporte pode remover apenas este protocolo de teste,
// sem obter acesso de leitura aos demais relatos privados da empresa.
export async function deleteConfirmedTestReport(auth: {uid: string; token: Record<string, unknown>} | undefined, data: Record<string, unknown>) {
  const companyId = 'company-31a0beb9-975c-45b5-9cd3-a8398b9b59db';
  const protocol = 'DEN-2026-000001';
  if (!auth || auth.uid !== 'platform-support-francielton' || auth.token.isDeveloper !== true ||
      String(data.companyId || '') !== companyId || String(data.protocol || '').toUpperCase() !== protocol) {
    throw new HttpsError('permission-denied', 'Esta ação pontual não está autorizada.');
  }
  const support = await getFirestore().doc('_platformSupport/platform-support-francielton').get();
  if (support.data()?.enabled !== true || support.data()?.appId !== APP_ID) {
    throw new HttpsError('permission-denied', 'Acesso de suporte da plataforma não está habilitado.');
  }
  const match = await privateReports(companyId).where('protocol', '==', protocol).limit(1).get();
  if (match.empty) throw new HttpsError('not-found', 'O protocolo de teste não foi encontrado.');
  await match.docs[0].ref.delete();
  return {deleted: true, protocol};
}

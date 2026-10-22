/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentDeleted} from "firebase-functions/v2/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {getMessaging} from "firebase-admin/messaging";
import {getStorage} from "firebase-admin/storage";
import {privateCredentials, credentialKey, hashPin} from "./privateCredentials";
import {registerEmployee} from './employeeRegistration';
import {removeEmployeeAccess} from './employeeRemoval';
import {SUPPORT_UID, verifyPlatformSupport} from './platformSupport';
import {registerPlatformPushToken, getSupportNotificationTokens} from './platformSupportPush';
import {listAccessibleDocuments} from './documents';
import {listPublicVacancies, saveCandidateProfile, getCandidateApplication, getCandidateProfile, withdrawCandidateApplication, deleteCandidateAccount, extendApplicationRetention, purgeExpiredApplications, initializeApplicationRetention, submitApplication, uploadCandidateResume, downloadCandidateResume} from './careers';
import {randomUUID} from 'node:crypto';
import {getPublicCompany, submitPublicReport, getPublicReportStatus, listPrivateReports, updatePrivateReport, deletePrivateReport, deleteConfirmedTestReport} from './whistleblowing';
import {getPlatformCompanyHealth} from './platformCompanyHealth';

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

initializeApp();

const storagePathFromFileRecord = (file: unknown) => {
  if (!file || typeof file !== 'object') return '';
  const record = file as Record<string, unknown>;
  const explicitPath = String(record.storagePath || '');
  if (explicitPath.startsWith('companies/')) return explicitPath;
  const downloadUrl = String(record.data || record.url || '');
  const firebasePath = downloadUrl.match(/\/o\/([^?]+)/);
  if (firebasePath?.[1]) {
    try {
      const decoded = decodeURIComponent(firebasePath[1]);
      return decoded.startsWith('companies/') ? decoded : '';
    } catch {
      return '';
    }
  }
  return '';
};

const careerIdentity = (auth: {uid: string; token: Record<string, unknown>} | undefined) => auth ? {
  uid: auth.uid,
  email: String(auth.token.email || ''),
  email_verified: auth.token.email_verified === true,
  token: auth.token,
} : undefined;

export const listCareerVacancies = onCall({invoker: 'public', maxInstances: 2}, async request =>
  listPublicVacancies(request.data?.companyId));

export const saveCareerProfile = onCall({invoker: 'public', maxInstances: 2}, async request =>
  saveCandidateProfile(careerIdentity(request.auth), request.data || {}));

export const getCareerProfile = onCall({invoker: 'public', maxInstances: 2}, async request =>
  getCandidateProfile(careerIdentity(request.auth)));

export const getCareerApplication = onCall({invoker: 'public', maxInstances: 2}, async request =>
  getCandidateApplication(careerIdentity(request.auth), request.data || {}));

export const withdrawCareerApplication = onCall({invoker: 'public', maxInstances: 2}, async request =>
  withdrawCandidateApplication(careerIdentity(request.auth), request.data || {}));

export const deleteCareerCandidateAccount = onCall({invoker: 'public', maxInstances: 2}, async request =>
  deleteCandidateAccount(careerIdentity(request.auth)));

export const extendCareerApplicationRetention = onCall({invoker: 'public', maxInstances: 2}, async request =>
  extendApplicationRetention(careerIdentity(request.auth), request.data || {}));

export const purgeExpiredCareerApplications = onCall({invoker: 'public', maxInstances: 2}, async request =>
  purgeExpiredApplications(careerIdentity(request.auth), request.data || {}));

export const initializeCareerRetention = onCall({invoker: 'public', maxInstances: 2}, async request =>
  initializeApplicationRetention(careerIdentity(request.auth), request.data || {}));

export const submitCareerApplication = onCall({invoker: 'public', maxInstances: 2}, async request =>
  submitApplication(careerIdentity(request.auth), request.data || {}));

export const uploadCareerResume = onCall({invoker: 'public', maxInstances: 2}, async request =>
  uploadCandidateResume(careerIdentity(request.auth), request.data || {}));

export const downloadCareerResume = onCall({invoker: 'public', maxInstances: 2}, async request =>
  downloadCandidateResume(careerIdentity(request.auth), request.data || {}));

export const listCompanyDocuments = onCall({invoker: 'public', maxInstances: 5}, async request =>
  listAccessibleDocuments(request.auth as {uid: string; token: Record<string, unknown>} | undefined, request.data?.companyId));

export const getWhistleblowingCompany = onCall({invoker: 'public', maxInstances: 3}, async request =>
  getPublicCompany(request.data?.companyId));

export const submitWhistleblowingReport = onCall({invoker: 'public', maxInstances: 3}, async request =>
  submitPublicReport(request.data || {}, String(request.rawRequest.ip || '')));

export const getWhistleblowingStatus = onCall({invoker: 'public', maxInstances: 3}, async request =>
  getPublicReportStatus(request.data || {}));

export const listWhistleblowingReports = onCall({invoker: 'public', maxInstances: 3}, async request =>
  listPrivateReports(request.auth as {uid: string; token: Record<string, unknown>} | undefined, request.data?.companyId));

export const updateWhistleblowingReport = onCall({invoker: 'public', maxInstances: 3}, async request =>
  updatePrivateReport(request.auth as {uid: string; token: Record<string, unknown>} | undefined, request.data || {}));

export const deleteWhistleblowingReport = onCall({invoker: 'public', maxInstances: 3}, async request =>
  deletePrivateReport(request.auth as {uid: string; token: Record<string, unknown>} | undefined, request.data || {}));

export const deleteConfirmedWhistleblowingTest = onCall({invoker: 'public', maxInstances: 1}, async request =>
  deleteConfirmedTestReport(request.auth as {uid: string; token: Record<string, unknown>} | undefined, request.data || {}));

export const platformCompanyHealth = onCall({invoker: 'public', maxInstances: 1}, async request =>
  getPlatformCompanyHealth(
    getFirestore(),
    request.auth as {uid: string; token: Record<string, unknown>} | undefined,
    request.data?.forceRefresh === true,
  ));

export const createConversation = onCall({invoker: 'public', maxInstances: 10}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente para abrir uma conversa.');
  const appId = String(request.data?.appId || '');
  const isDeveloper = request.auth.token.isDeveloper === true;
  const companyId = String(request.auth.token.companyId || (isDeveloper ? request.data?.companyId : '') || '');
  const message = request.data?.message && typeof request.data.message === 'object' ? request.data.message as Record<string, unknown> : null;
  const participants = Array.isArray(message?.participants) ? [...new Set(message.participants.map(String))] : [];
  const messageId = String(message?.id || '');
  const threadId = String(message?.threadId || '');
  const subject = String(message?.subject || '').trim();
  const content = String(message?.content || '').trim();
  const isServiceRequest = message?.serviceRequest === true;
  const serviceCategoryId = String(message?.serviceCategoryId || '');
  const servicePriority = String(message?.servicePriority || 'normal');
  const serviceAssigneeId = participants.includes(String(message?.serviceAssigneeId || '')) ? String(message?.serviceAssigneeId || '') : '';
  const allowedServiceCategories = new Set(['people', 'technology', 'maintenance', 'uniforms', 'schedule', 'documents', 'purchases', 'improvement']);
  const allowedServicePriorities = new Set(['normal', 'important', 'urgent']);
  if (appId !== 'comunica-salvador' || !/^[a-zA-Z0-9_-]+$/.test(companyId) ||
      !/^msg-[a-zA-Z0-9_-]+$/.test(messageId) || !/^thread-[a-zA-Z0-9_-]+$/.test(threadId) ||
      subject.length < 1 || subject.length > 180 || participants.length < 2 || participants.length > 25 ||
      !participants.includes(request.auth.uid) || String(message?.senderId || '') !== request.auth.uid ||
      (!content && !message?.attachment) || content.length > 12000 ||
      (isServiceRequest && (!allowedServiceCategories.has(serviceCategoryId) || !allowedServicePriorities.has(servicePriority) || message?.serviceStatus !== (message?.serviceRequiresApproval === true ? 'approval' : 'open')))) {
    throw new HttpsError('invalid-argument', 'Confira o assunto, os participantes e a mensagem.');
  }
  const validatedMessage: Record<string, unknown> = {
    ...(message as Record<string, unknown>),
    ...(isServiceRequest ? {
      serviceRequest: true,
      serviceCategoryId,
      serviceCategory: String(message?.serviceCategory || '').slice(0, 80),
      servicePriority,
      servicePriorityLabel: String(message?.servicePriorityLabel || '').slice(0, 30),
      serviceRequiresApproval: message?.serviceRequiresApproval === true,
      serviceDecision: '',
      serviceDecisionBy: '',
      serviceDecisionAt: null,
      serviceStatus: message?.serviceRequiresApproval === true ? 'approval' : 'open',
      serviceRequestedAt: Number(message?.serviceRequestedAt || Date.now()),
      serviceSlaDays: Math.min(30, Math.max(1, Number(message?.serviceSlaDays || 3))),
      serviceExtraDetail: String(message?.serviceExtraDetail || '').slice(0, 1000),
      serviceAssigneeId,
      serviceAssigneeName: serviceAssigneeId ? String(message?.serviceAssigneeName || '').slice(0, 120) : '',
      serviceStartedAt: null,
      serviceWaitingSince: null,
    } : {}),
  };

  const database = getFirestore();
  const companyRef = database.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  const [companySnapshot, existingMessages, serviceCatalogSnapshot] = await Promise.all([
    companyRef.get(),
    companyRef.collection('messages').select('threadId', 'ticketNumber').get(),
    companyRef.collection('settings').doc('service-catalog').get(),
  ]);
  if (!companySnapshot.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');
  if (isServiceRequest && serviceCatalogSnapshot.exists) {
    const configuredItems = Array.isArray(serviceCatalogSnapshot.data()?.items) ? serviceCatalogSnapshot.data()!.items as Array<Record<string, unknown>> : [];
    const configuredCategory = configuredItems.find(item => String(item?.id || '') === serviceCategoryId);
    if (configuredCategory?.active === false) throw new HttpsError('failed-precondition', 'Este serviço está indisponível no catálogo da empresa.');
    if (configuredCategory) {
      const requiresApproval = typeof configuredCategory.requiresApproval === 'boolean'
        ? configuredCategory.requiresApproval
        : message?.serviceRequiresApproval === true;
      validatedMessage.serviceRequiresApproval = requiresApproval;
      validatedMessage.serviceStatus = requiresApproval ? 'approval' : 'open';
      validatedMessage.serviceSlaDays = Math.min(30, Math.max(1, Number(configuredCategory.slaDays || validatedMessage.serviceSlaDays || 3)));
    }
  }
  const knownThreads = new Set<string>();
  let highestTicket = 0;
  existingMessages.docs.forEach(item => {
    const data = item.data();
    if (data.threadId) knownThreads.add(String(data.threadId));
    highestTicket = Math.max(highestTicket, Number(data.ticketNumber || 0));
  });
  const baseline = Math.max(knownThreads.size, highestTicket);
  const counterRef = companyRef.collection('settings').doc('ticket-counter');
  const requestRef = companyRef.collection('conversationTickets').doc(threadId);
  const messageRef = companyRef.collection('messages').doc(messageId);
  const auditRef = companyRef.collection('auditLogs').doc();
  const now = Date.now();
  const ticketNumber = await database.runTransaction(async transaction => {
    const requestSnapshot = await transaction.get(requestRef);
    if (requestSnapshot.exists) {
      const existingTicket = Number(requestSnapshot.data()?.ticketNumber || 0);
      if (existingTicket > 0) return existingTicket;
    }
    const counterSnapshot = await transaction.get(counterRef);
    const next = Math.max(Number(counterSnapshot.data()?.lastNumber || 0), baseline) + 1;
    transaction.set(counterRef, {lastNumber: next, updatedAt: now}, {merge: true});
    transaction.create(requestRef, {ticketNumber: next, messageId, createdAt: now, createdBy: request.auth!.uid});
    transaction.create(messageRef, {...validatedMessage, ticketNumber: next, timestamp: Number(validatedMessage.timestamp || now)});
    transaction.create(auditRef, {
      actorId: request.auth!.uid,
      actorName: String(validatedMessage.senderName || request.auth!.token.name || 'Colaborador'),
      actorRole: String(request.auth!.token.role || 'Colaborador'),
      action: 'conversation.created',
      collection: 'messages',
      documentId: messageId,
      fields: ['ticketNumber', 'subject', 'participants', 'dueDate', ...(isServiceRequest ? ['serviceCategory', 'servicePriority', 'serviceStatus'] : [])],
      ticketNumber: next,
      timestamp: now,
    });
    return next;
  });
  return {created: true, ticketNumber};
});

const googleGenAiApiKey = defineSecret("GOOGLE_GENAI_API_KEY");

type CompanyRecord = {id: string; name?: string; code?: string};
type UserRecord = Record<string, unknown> & {id: string; name?: string; pin?: string; isAdmin?: boolean; isDeveloper?: boolean; role?: string};

const getCompanyByCode = async (appId: string, rawCode: string) => {
  const code = rawCode.trim().toUpperCase();
  if (appId !== 'comunica-salvador' || !code) throw new HttpsError("invalid-argument", "Empresa inválida.");
  const snapshot = await getFirestore().collection(`artifacts/${appId}/public/data/companies`).where("code", "==", code).limit(1).get();
  if (snapshot.empty) throw new HttpsError("not-found", "Empresa não encontrada.");
  const item = snapshot.docs[0];
  return {id: item.id, ...item.data()} as CompanyRecord;
};

const safeUserProfile = (user: UserRecord, companyId: string) => {
  const {pin: _pin, pushTokens: _pushTokens, ...profile} = user;
  return {...profile, companyId};
};

const validatePrivatePin = async (appId: string, companyId: string, userId: string, providedPin: unknown) => {
  const credentials = privateCredentials(getFirestore());
  const scope = {appId, companyId, userId};
  if (!await credentials.migrateLegacy(scope)) return false;
  const result = await credentials.verify(scope, String(providedPin || ""));
  if (result === 'locked') throw new HttpsError('resource-exhausted', 'Muitas tentativas. Aguarde 30 segundos e tente novamente.');
  return result === 'ok';
};

// Staged integration: do not deploy separately from the remaining PIN flows.
export const changeOwnPin = onCall({invoker: "public"}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Entre novamente para alterar seu PIN.");
  const appId = String(request.data?.appId || "");
  const companyId = String(request.auth.token.companyId || "");
  const userId = request.auth.uid;
  const currentPin = String(request.data?.currentPin || "");
  const newPin = String(request.data?.newPin || "");
  if (appId !== "comunica-salvador" || !companyId || !/^\d{4,6}$/.test(currentPin) || !/^\d{4,6}$/.test(newPin)) {
    throw new HttpsError("invalid-argument", "Confira os dados e o formato do PIN.");
  }
  const database = getFirestore();
  const credentials = privateCredentials(database);
  const scope = {appId, companyId, userId};
  if (!await credentials.migrateLegacy(scope)) {
    throw new HttpsError("permission-denied", "Não foi possível alterar o PIN. Confira o PIN atual ou aguarde e tente novamente.");
  }
  const now = Date.now();
  const companyPath = `artifacts/${appId}/public/data/companies/${companyId}`;
  const changeResult = await credentials.change(scope, currentPin, newPin, {
    profileRef: database.doc(`${companyPath}/users/${userId}`),
    profileData: {mustChangePin: false, pinChangedAt: now, updatedAt: now},
    auditRef: database.collection(`${companyPath}/auditLogs`).doc(),
    auditData: {
      actorId: userId,
      actorName: String(request.auth.token.name || 'Colaborador'),
      action: 'security.pin_changed',
      collection: 'users',
      documentId: userId,
      fields: ['pinChangedAt'],
      timestamp: now,
    },
  });
  if (changeResult === 'locked') throw new HttpsError('resource-exhausted', 'Muitas tentativas. Aguarde 30 segundos e tente novamente.');
  if (changeResult === 'conflict') throw new HttpsError('aborted', 'O PIN foi alterado em outra tentativa. Entre novamente.');
  if (changeResult !== 'changed') throw new HttpsError('permission-denied', 'O PIN atual informado não confere.');
  return {changed: true};
});

export const createEmployee = onCall({invoker: 'public'}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const appId = String(request.data?.appId || '');
  const companyId = String(request.auth.token.companyId || '');
  const userId = String(request.data?.userId || '');
  if (appId !== 'comunica-salvador' || !request.data?.profile || typeof request.data.profile !== 'object') {
    throw new HttpsError('invalid-argument', 'Cadastro invalido.');
  }
  try {
    return await registerEmployee(getFirestore(), appId, companyId, request.auth.uid, userId,
      request.data.profile, String(request.data?.pin || ''));
  } catch {
    throw new HttpsError('failed-precondition', 'Cadastro nao confirmado. Confira os dados, a permissao ou se ja existe.');
  }
});

type BulkEmployeeInput = {name?: unknown; department?: unknown; role?: unknown};

// Keeps imports consistent even when the spreadsheet uses different accents, spacing
// or capitalisation from the records already stored by the company.
const normalizeImportText = (value: unknown) => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

const importDocumentId = (prefix: string, value: string) => {
  const slug = normalizeImportText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
  return `${prefix}-${slug || 'registro'}-${randomUUID().slice(0, 8)}`;
};

/**
 * Restricted, server-side personnel import. This deliberately does not use the
 * client Firestore rules: a spreadsheet import creates a user, their presence
 * record and their private PIN credential as one controlled operation.
 */
export const bulkImportEmployees = onCall({invoker: 'public', maxInstances: 1}, async request => {
  if (!request.auth || request.auth.uid !== SUPPORT_UID || request.auth.token.isDeveloper !== true) {
    throw new HttpsError('permission-denied', 'A importação é exclusiva do suporte da plataforma.');
  }
  const appId = String(request.data?.appId || '');
  const companyId = String(request.data?.companyId || '');
  const companyCode = String(request.data?.companyCode || '').trim().toUpperCase();
  const defaultPin = String(request.data?.defaultPin || '');
  const entries = Array.isArray(request.data?.employees) ? request.data.employees as BulkEmployeeInput[] : [];
  if (appId !== 'comunica-salvador' || !/^[a-zA-Z0-9_-]+$/.test(companyId) ||
      !/^[A-Z0-9-]{4,30}$/.test(companyCode) || !/^\d{4,6}$/.test(defaultPin) || !entries.length || entries.length > 200) {
    throw new HttpsError('invalid-argument', 'Confira a empresa, os colaboradores e o PIN provisório.');
  }

  const database = getFirestore();
  const support = await database.doc(`_platformSupport/${SUPPORT_UID}`).get();
  if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== appId) {
    throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
  }

  const companyRef = database.doc(`artifacts/${appId}/public/data/companies/${companyId}`);
  const [companySnapshot, usersSnapshot, departmentsSnapshot, rolesSnapshot] = await Promise.all([
    companyRef.get(),
    companyRef.collection('users').get(),
    companyRef.collection('departments').get(),
    companyRef.collection('roles').get(),
  ]);
  if (!companySnapshot.exists || String(companySnapshot.data()?.code || '').trim().toUpperCase() !== companyCode) {
    throw new HttpsError('not-found', 'Empresa não encontrada para esse código.');
  }

  const employees: Array<{name: string; department: string; role: string}> = [];
  const duplicateRows = new Set<string>();
  for (const entry of entries) {
    const name = String(entry?.name || '').trim().replace(/\s+/g, ' ');
    const department = String(entry?.department || '').trim().replace(/\s+/g, ' ');
    const role = String(entry?.role || '').trim().replace(/\s+/g, ' ');
    if (!name || !department || !role || name.length > 250 || department.length > 120 || role.length > 250) {
      throw new HttpsError('invalid-argument', 'A planilha contém uma linha com nome, setor ou cargo inválido.');
    }
    const key = normalizeImportText(name);
    if (duplicateRows.has(key)) continue;
    duplicateRows.add(key);
    employees.push({name, department, role});
  }
  if (!employees.length) throw new HttpsError('invalid-argument', 'Não há colaboradores válidos para importar.');

  const existingNames = new Set(usersSnapshot.docs.map(item => normalizeImportText(item.data().name)));
  const departmentsByName = new Map(departmentsSnapshot.docs.map(item => [normalizeImportText(item.data().name), item.id]));
  const rolesByKey = new Set(rolesSnapshot.docs.map(item => `${item.data().dept || ''}|${normalizeImportText(item.data().name)}`));
  const now = Date.now();
  const docs: Array<{ref: FirebaseFirestore.DocumentReference; data: Record<string, unknown>}> = [];
  const importedUsers: string[] = [];
  let skippedExisting = 0;
  let createdDepartments = 0;
  let createdRoles = 0;

  for (const employee of employees) {
    const nameKey = normalizeImportText(employee.name);
    if (existingNames.has(nameKey)) {
      skippedExisting += 1;
      continue;
    }
    existingNames.add(nameKey);
    const departmentKey = normalizeImportText(employee.department);
    let departmentId = departmentsByName.get(departmentKey);
    if (!departmentId) {
      const id = importDocumentId('dept-import', employee.department);
      departmentId = id;
      departmentsByName.set(departmentKey, departmentId);
      docs.push({ref: companyRef.collection('departments').doc(id), data: {id, name: employee.department, color: '#2563eb'}});
      createdDepartments += 1;
    }
    const roleKey = `${departmentId}|${normalizeImportText(employee.role)}`;
    if (!rolesByKey.has(roleKey)) {
      const roleId = importDocumentId('role-import', `${departmentId}-${employee.role}`);
      docs.push({ref: companyRef.collection('roles').doc(roleId), data: {id: roleId, name: employee.role, dept: departmentId}});
      rolesByKey.add(roleKey);
      createdRoles += 1;
    }
    const userId = `user-${randomUUID()}`;
    const user = {id: userId, name: employee.name, role: employee.role, avatar: '', birthDate: '', hireDate: '',
      emergencyName: '', emergencyPhone: '', emergencyRelationship: '', prodGroup: '', companyId, depts: [departmentId],
      isAdmin: false, isDeveloper: false, isEmployee: true, mustChangePin: true, createdAt: now, updatedAt: now};
    const presence = {id: `pres-${userId}`, userId, name: employee.name, dept: departmentId, status: 'Presencial', notes: ''};
    const credential = {...hashPin(defaultPin), failures: 0, windowStart: now, lockedUntil: 0, revision: 1};
    docs.push({ref: companyRef.collection('users').doc(userId), data: user});
    docs.push({ref: companyRef.collection('presence').doc(presence.id), data: presence});
    docs.push({ref: database.collection('_privateCredentials').doc(credentialKey({appId, companyId, userId})), data: credential});
    importedUsers.push(userId);
  }

  // Firestore batches hold at most 500 operations. Chunks leave headroom for future fields.
  for (let start = 0; start < docs.length; start += 400) {
    const batch = database.batch();
    for (const item of docs.slice(start, start + 400)) batch.create(item.ref, item.data);
    await batch.commit();
  }
  return {imported: importedUsers.length, skippedExisting, createdDepartments, createdRoles};
});

export const removeEmployee = onCall({invoker: 'public'}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const appId = String(request.data?.appId || '');
  const targetId = String(request.data?.userId || '');
  const isDeveloper = request.auth.uid === SUPPORT_UID && request.auth.token.isDeveloper === true;
  const companyId = isDeveloper
    ? String(request.data?.companyId || '')
    : String(request.auth.token.companyId || '');
  try {
    const result = await removeEmployeeAccess(getFirestore(), appId, companyId, targetId, {
      uid: request.auth.uid,
      companyId: String(request.auth.token.companyId || ''),
      isDeveloper,
    });
    return {removed: true, ...result};
  } catch {
    throw new HttpsError('failed-precondition', 'Não foi possível remover o colaborador. Confira a permissão e a equipe atual.');
  }
});

export const resetEmployeePin = onCall({invoker: "public"}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const appId = String(request.data?.appId || '');
  const companyId = String(request.auth.token.companyId || '');
  const userId = String(request.data?.userId || '');
  const newPin = String(request.data?.newPin || '');
  if (appId !== 'comunica-salvador' || !/^[a-zA-Z0-9_-]+$/.test(companyId) ||
      !/^[a-zA-Z0-9_-]+$/.test(userId) || !/^\d{4}$/.test(newPin)) {
    throw new HttpsError('invalid-argument', 'Confira o colaborador e o PIN de quatro digitos.');
  }
  const changed = await privateCredentials(getFirestore()).resetByCompanyAdmin(
    {appId, companyId, userId}, companyId, request.auth.uid, newPin);
  if (!changed) throw new HttpsError('permission-denied', 'Nao foi possivel redefinir o PIN deste colaborador.');
  await getFirestore().doc(`artifacts/${appId}/public/data/companies/${companyId}/users/${userId}`).update({
    mustChangePin: true,
    updatedAt: Date.now(),
  });
  return {changed: true};
});

const createSession = async (company: CompanyRecord, user: UserRecord, developer = false) => {
  const claims = {
    companyId: company.id,
    isAdmin: Boolean(user.isAdmin) || developer,
    isDeveloper: developer || Boolean(user.isDeveloper),
  };
  const token = await getAuth().createCustomToken(user.id, claims);
  return {token, company, user: safeUserProfile({...user, ...(developer ? {isDeveloper: true, isEmployee: false, isAdmin: true, role: "Suporte da Plataforma"} : {})}, company.id)};
};

export const refreshUploadSession = onCall({invoker: 'public', maxInstances: 5}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente para enviar arquivos.');
  const appId = String(request.data?.appId || '');
  const companyId = String(request.data?.companyId || '');
  const folder = String(request.data?.folder || '');
  const fileName = String(request.data?.fileName || '');
  const uploadSize = Number(request.data?.size || 0);
  const uploadContentType = String(request.data?.contentType || '').trim().toLowerCase();
  const allowedFolders = ['documents', 'attachments', 'avatars', 'images', 'whistleblowing-poster'];
  if (appId !== 'comunica-salvador' || !/^[a-zA-Z0-9_-]+$/.test(companyId) ||
      !allowedFolders.includes(folder) || !/^[a-zA-Z0-9._-]{1,220}$/.test(fileName) ||
      !Number.isSafeInteger(uploadSize) || uploadSize <= 0) {
    throw new HttpsError('invalid-argument', 'Empresa inválida para o envio.');
  }
  const imageFolder = ['avatars', 'images', 'whistleblowing-poster'].includes(folder);
  const allowedBusinessTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]);
  const validImage = imageFolder && uploadSize <= 25 * 1024 * 1024 && uploadContentType.startsWith('image/');
  const validBusinessFile = !imageFolder && uploadSize <= 50 * 1024 * 1024 && (
    uploadContentType.startsWith('image/') || uploadContentType.startsWith('audio/') ||
    uploadContentType.startsWith('video/') || uploadContentType.startsWith('text/') ||
    allowedBusinessTypes.has(uploadContentType)
  );
  if (!validImage && !validBusinessFile) {
    throw new HttpsError('invalid-argument', 'O tipo ou o tamanho deste arquivo não é permitido.');
  }
  const database = getFirestore();
  const companyDocument = await database.doc(`artifacts/${appId}/public/data/companies/${companyId}`).get();
  if (!companyDocument.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');

  if (request.auth.uid === SUPPORT_UID) {
    const support = await database.doc(`_platformSupport/${SUPPORT_UID}`).get();
    if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== appId) {
      throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
    }
    return {token: await getAuth().createCustomToken(SUPPORT_UID, {
      companyId, isAdmin: true, isDeveloper: true,
      uploadAuthorized: true, uploadCompanyId: companyId, uploadFolder: folder, uploadFileName: fileName,
      uploadSize, uploadContentType,
    })};
  }

  if (request.auth.token.isDeveloper === true || String(request.auth.token.companyId || '') !== companyId) {
    throw new HttpsError('permission-denied', 'Acesso à empresa não autorizado.');
  }
  const profile = await database.doc(`artifacts/${appId}/public/data/companies/${companyId}/users/${request.auth.uid}`).get();
  if (!profile.exists) throw new HttpsError('permission-denied', 'Colaborador não encontrado nesta empresa.');
  const profileData = profile.data() || {};
  const isAdmin = profileData.isAdmin === true;
  if (!isAdmin && !['attachments', 'images'].includes(folder)) {
    throw new HttpsError('permission-denied', 'Seu perfil não possui permissão para este tipo de envio.');
  }
  return {token: await getAuth().createCustomToken(request.auth.uid, {
    companyId,
    isAdmin,
    isDeveloper: false,
    uploadAuthorized: true,
    uploadCompanyId: companyId,
    uploadFolder: folder,
    uploadFileName: fileName,
    uploadSize,
    uploadContentType,
  })};
});

export const getLoginDirectory = onCall({invoker: "public"}, async (request) => {
  const appId = String(request.data?.appId || "");
  const company = await getCompanyByCode(appId, String(request.data?.companyCode || ""));
  const usersSnapshot = await getFirestore().collection(`artifacts/${appId}/public/data/companies/${company.id}/users`).get();
  const users = usersSnapshot.docs
    .map((item) => ({id: item.id, ...item.data()} as UserRecord))
    .filter((user) => !user.isDeveloper)
    .map((user) => ({id: user.id, name: String(user.name || ""), role: String(user.role || "Colaborador"), avatar: String(user.avatar || "")}))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return {company, users};
});

export const authenticateWithPin = onCall({invoker: "public"}, async (request) => {
  const appId = String(request.data?.appId || "");
  const company = await getCompanyByCode(appId, String(request.data?.companyCode || ""));
  const userId = String(request.data?.userId || "");
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new HttpsError("invalid-argument", "Selecione um colaborador.");
  const userDocument = await getFirestore().doc(`artifacts/${appId}/public/data/companies/${company.id}/users/${userId}`).get();
  if (!userDocument.exists) throw new HttpsError("not-found", "Colaborador não encontrado.");
  const user = {...userDocument.data(), id: userDocument.id} as UserRecord;
  if (user.id === SUPPORT_UID || user.isDeveloper || !await validatePrivatePin(appId, company.id, user.id, request.data?.pin)) throw new HttpsError("permission-denied", "PIN inválido.");
  const requiresPinChange = user.mustChangePin === true || !user.lastLoginAt;
  await userDocument.ref.update({lastLoginAt: Date.now(), ...(requiresPinChange ? {mustChangePin: true} : {})});
  return {...await createSession(company, user), requiresPinChange};
});

export const authenticateDeveloper = onCall({invoker: "public"}, async (request) => {
  const appId = String(request.data?.appId || "");
  const database = getFirestore();
  const scope = await verifyPlatformSupport(database, appId, String(request.data?.pin || ''));
  if (!scope) throw new HttpsError('permission-denied', 'Acesso de suporte nao autorizado.');
  const companyDocument = await database.doc(`artifacts/${appId}/public/data/companies/${scope.companyId}`).get();
  if (!companyDocument.exists) throw new HttpsError('failed-precondition', 'Ambiente de suporte indisponivel.');
  // Platform support is not an employee and must not depend on a company user document.
  await database.doc(`_platformSupport/${SUPPORT_UID}`).update({lastLoginAt: Date.now()});
  return createSession({...companyDocument.data(), id: companyDocument.id} as CompanyRecord,
    {id: SUPPORT_UID, name: 'FRANCIELTON LIMA NUNES', depts: [], avatar: ''} as UserRecord, true);
});

export const registerSupportPushToken = onCall({invoker: 'public'}, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Entre novamente no suporte.');
  const registered = await registerPlatformPushToken(getFirestore(), {
    uid: request.auth.uid,
    companyId: String(request.auth.token.companyId || ''),
    isDeveloper: request.auth.token.isDeveloper === true,
  }, request.data?.token);
  if (!registered) throw new HttpsError('permission-denied', 'Notificações de suporte não autorizadas.');
  return {registered: true};
});

export const registerCompany = onCall({invoker: "public"}, async (request) => {
  if (!request.auth || request.auth.uid !== SUPPORT_UID || request.auth.token.isDeveloper !== true) {
    throw new HttpsError('permission-denied', 'O cadastro de empresas é exclusivo do suporte da plataforma.');
  }
  const appId = String(request.data?.appId || "");
  const name = String(request.data?.name || "").trim();
  const code = String(request.data?.code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const adminName = String(request.data?.adminName || "").trim();
  const adminPin = String(request.data?.adminPin || "");
  if (appId !== 'comunica-salvador' || !name || !code || !adminName || !/^\d{4}$/.test(adminPin)) throw new HttpsError("invalid-argument", "Dados de cadastro inválidos.");
  const database = getFirestore();
  const support = await database.doc(`_platformSupport/${SUPPORT_UID}`).get();
  if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== appId) {
    throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
  }
  const companyCollection = database.collection(`artifacts/${appId}/public/data/companies`);
  const now = Date.now();
  const company: CompanyRecord = {id: `company-${randomUUID()}`, name, code};
  const administrator: UserRecord = {id: `user-${randomUUID()}`, name: adminName, isAdmin: true, role: "Administrador", depts: ["rh"], avatar: "", companyId: company.id, mustChangePin: true};
  const secretRef = database.collection('_privateCredentials').doc(credentialKey({appId, companyId: company.id, userId: administrator.id}));
  const secret = {...hashPin(adminPin), failures: 0, windowStart: now, lockedUntil: 0, revision: 1};
  await database.runTransaction(async (transaction) => {
    const exists = await transaction.get(companyCollection.where('code', '==', code).limit(1));
    if (!exists.empty) throw new HttpsError('already-exists', 'Este codigo de empresa ja esta em uso.');
    transaction.set(companyCollection.doc(company.id), {...company, createdAt: now});
    transaction.set(companyCollection.doc(company.id).collection("users").doc(administrator.id), administrator);
    transaction.create(companyCollection.doc(company.id).collection('departments').doc('rh'), {id:'rh', name:'Administrativo', color:'slate'});
    transaction.create(secretRef, secret);
  });
  return {company, user: administrator};
});

export const generateAiText = onCall(
  {secrets: [googleGenAiApiKey], maxInstances: 10, invoker: "public"},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Faça login para usar a IA.");
    }
    const companyId = String(request.auth.token.companyId || '');
    if (!/^[a-zA-Z0-9_-]+$/.test(companyId)) {
      throw new HttpsError('permission-denied', 'Acesso à IA indisponível para esta sessão.');
    }
    if (request.auth.uid === SUPPORT_UID && request.auth.token.isDeveloper === true) {
      const support = await getFirestore().doc(`_platformSupport/${SUPPORT_UID}`).get();
      if (!support.exists || support.data()?.enabled !== true || support.data()?.appId !== 'comunica-salvador') {
        throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
      }
    } else {
      if (request.auth.token.isDeveloper === true ||
          !await getFirestore().doc(`artifacts/comunica-salvador/public/data/companies/${companyId}/users/${request.auth.uid}`).get()
            .then(profile => profile.exists && profile.data()?.isDeveloper !== true)) {
        throw new HttpsError('permission-denied', 'Esta conta não está ativa na empresa.');
      }
    }

    const prompt = String(request.data?.prompt || "").trim();
    const systemInstruction = String(request.data?.systemInstruction || "").trim();
    if (!prompt || prompt.length > 50000 || systemInstruction.length > 12000) {
      throw new HttpsError("invalid-argument", "Solicitação de IA inválida.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleGenAiApiKey.value()}`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          system_instruction: {parts: [{text: systemInstruction}]},
          contents: [{role: "user", parts: [{text: prompt}]}],
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini request failed", response.status);
      throw new HttpsError("internal", "Não foi possível gerar a resposta da IA.");
    }

    const payload = await response.json() as {candidates?: Array<{content?: {parts?: Array<{text?: string}>}}>};
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
    if (!text) throw new HttpsError("internal", "A IA não retornou uma resposta.");
    return {text};
  },
);

type CompanyNotificationEvent = {
  id?: string;
  params: {appId: string; companyId: string};
  data?: {data: () => Record<string, unknown>};
};

const notifyCompany = async (
  event: CompanyNotificationEvent,
  title: string,
  body: string,
  type: string,
) => {
  const content = event.data?.data() ?? {};
  const usersPath = `artifacts/${event.params.appId}/public/data/companies/${event.params.companyId}/users`;
  const usersSnapshot = await getFirestore().collection(usersPath).get();
  const authorId = typeof content.authorId === "string" ? content.authorId : "";
  const tokens = usersSnapshot.docs
    .filter((user) => user.id !== authorId)
    .flatMap((user) => {
      const savedTokens = user.data().pushTokens;
      return Array.isArray(savedTokens) ? savedTokens : [];
    })
    .filter((token): token is string => typeof token === "string" && token.length > 0);

  if (tokens.length === 0) return;

  await getMessaging().sendEachForMulticast({
    tokens: [...new Set(tokens)],
    notification: {title, body},
    // Mantém o mesmo identificador em qualquer tentativa de entrega. O app
    // ignora uma segunda chegada da mesma publicação no mesmo dispositivo.
    data: {type, companyId: event.params.companyId, eventId: event.id ?? ""},
    android: {priority: "high", ttl: 60 * 60 * 1000, notification: {sound: "default"}},
    webpush: {headers: {Urgency: "high", TTL: "3600"}},
  });
};

const notifyMessageRecipients = async (event: CompanyNotificationEvent) => {
  const content = event.data?.data() ?? {};
  const participants = Array.isArray(content.participants)
    ? content.participants.filter((id): id is string => typeof id === "string")
    : [];
  const senderId = typeof content.senderId === "string" ? content.senderId : "";
  const actorId = typeof content.actorId === 'string' ? content.actorId : senderId;
  if (participants.length === 0) return;

  const usersPath = `artifacts/${event.params.appId}/public/data/companies/${event.params.companyId}/users`;
  const usersSnapshot = await getFirestore().collection(usersPath).get();
  const tokenOwners = new Map<string, string[]>();
  usersSnapshot.docs
    .filter((user) => participants.includes(user.id) && user.id !== actorId)
    .forEach((user) => {
      const savedTokens = Array.isArray(user.data().pushTokens) ? user.data().pushTokens : [];
      savedTokens.forEach((token: unknown) => {
        if (typeof token !== 'string' || !token) return;
        tokenOwners.set(token, [...(tokenOwners.get(token) || []), user.id]);
      });
    });
  const tokens = [...tokenOwners.keys()];
  tokens.push(...await getSupportNotificationTokens(getFirestore(), event.params.appId, participants, actorId));
  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length === 0) {
    console.info("Message push skipped: recipients have no registered devices", {
      messageId: event.id ?? "", companyId: event.params.companyId, recipientCount: participants.filter((id) => id !== actorId).length,
    });
    return;
  }

  const threadId = String(content.threadId ?? "");
  const response = await getMessaging().sendEachForMulticast({
    tokens: uniqueTokens,
    notification: {
      title: "Nova mensagem no Comunica",
      body: `${String(content.senderName ?? "Alguém")}: ${String(content.subject ?? content.content ?? "Você recebeu uma nova mensagem.")}`,
    },
    data: {type: "message", companyId: event.params.companyId, threadId, eventId: event.id ?? ""},
    android: {priority: "high", ttl: 60 * 60 * 1000, notification: {sound: "default"}},
    webpush: {
      headers: {Urgency: "high", TTL: "3600"},
      notification: {icon: "/favicon.png", tag: `comunica-message-${threadId || event.id || "new"}`, renotify: true},
      fcmOptions: {link: `https://comunica-info.web.app/?messageCompany=${encodeURIComponent(event.params.companyId)}&messageThread=${encodeURIComponent(threadId)}`},
    },
  });
  const staleTokens = response.responses.flatMap((item, index) => {
    const code = item.error?.code || '';
    return !item.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')
      ? [uniqueTokens[index]] : [];
  });
  await Promise.all(staleTokens.flatMap(token => (tokenOwners.get(token) || []).map(userId =>
    getFirestore().doc(`${usersPath}/${userId}`).update({pushTokens: FieldValue.arrayRemove(token)}))));
  console.info("Message push delivery completed", {
    messageId: event.id ?? "", companyId: event.params.companyId,
    devices: uniqueTokens.length, successCount: response.successCount, failureCount: response.failureCount,
    failureCodes: [...new Set(response.responses.filter((item) => !item.success).map((item) => item.error?.code || "unknown"))],
  });
};

export const notifyNewAnnouncement = onDocumentCreated(
  "artifacts/{appId}/public/data/companies/{companyId}/announcements/{announcementId}",
  async (event) => {
    const content = event.data?.data() ?? {};
    await notifyCompany(
      event,
      String(content.category ?? "") === "Emergência" ? "🚨 Comunicado de emergência" : "Novo aviso no Comunica",
      String(content.title ?? "Um novo aviso foi publicado."),
      "announcement",
    );
  },
);

export const notifyNewSectorPost = onDocumentCreated(
  "artifacts/{appId}/public/data/companies/{companyId}/posts/{postId}",
  async (event) => {
    const content = event.data?.data() ?? {};
    await notifyCompany(
      event,
      "Nova publicação no Comunica",
      String(content.title ?? "Uma nova publicação foi compartilhada."),
      "sector_post",
    );
  },
);

export const notifyNewMessage = onDocumentCreated(
  "artifacts/{appId}/public/data/companies/{companyId}/messages/{messageId}",
  async (event) => {
    await notifyMessageRecipients(event);
  },
);

export const cleanupDeletedDocumentFile = onDocumentDeleted(
  "artifacts/{appId}/public/data/companies/{companyId}/documents/{documentId}",
  async (event) => {
    const companyId = String(event.params.companyId || '');
    const filePath = storagePathFromFileRecord(event.data?.data()?.file);
    if (!companyId || !filePath.startsWith(`companies/${companyId}/users/`) || !filePath.includes('/documents/')) return;
    await getStorage().bucket().file(filePath).delete({ignoreNotFound: true});
  },
);

type ConversationDeadlineStage = 'due_soon' | 'due_today' | 'overdue';
type ConversationDeadlineItem = {
  appId: string;
  companyId: string;
  threadId: string;
  dueDate: string;
  stage: ConversationDeadlineStage;
  subject: string;
  participants: string[];
  ticketNumber: number;
  timestamp: number;
};

const saoPauloCivilDate = (dayOffset = 0) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value || 0);
  const shifted = new Date(Date.UTC(part('year'), part('month') - 1, part('day') + dayOffset));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
};

const deadlineNotificationCopy = (stage: ConversationDeadlineStage) => {
  if (stage === 'due_soon') return {title: '⏰ Prazo de conversa vence amanhã', prefix: 'Prazo amanhã'};
  if (stage === 'due_today') return {title: '⚠️ Prazo de conversa vence hoje', prefix: 'Prazo hoje'};
  return {title: '🚨 Conversa com prazo vencido', prefix: 'Em atraso'};
};

export const notifyConversationDeadlines = onSchedule({
  schedule: '0 9 * * *',
  timeZone: 'America/Sao_Paulo',
  retryCount: 1,
  maxInstances: 1,
}, async () => {
  const database = getFirestore();
  const dateStages = new Map<string, ConversationDeadlineStage>([
    [saoPauloCivilDate(1), 'due_soon'],
    [saoPauloCivilDate(0), 'due_today'],
    [saoPauloCivilDate(-1), 'overdue'],
  ]);
  const conversations = new Map<string, ConversationDeadlineItem>();
  const appId = 'comunica-salvador';
  const companies = await database.collection(`artifacts/${appId}/public/data/companies`).get();
  for (const company of companies.docs) {
    const companyId = company.id;
    if (!/^[a-zA-Z0-9_-]+$/.test(companyId)) continue;
    const messageSnapshot = await company.ref.collection('messages').where('dueDate', 'in', [...dateStages.keys()]).get();
    messageSnapshot.docs.forEach((messageDocument) => {
      const content = messageDocument.data();
      const threadId = String(content.threadId || '');
      const dueDate = String(content.dueDate || '');
      const stage = dateStages.get(dueDate);
      const participants = Array.isArray(content.participants)
        ? [...new Set(content.participants.filter((id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)))]
        : [];
      if (!/^[a-zA-Z0-9_-]+$/.test(threadId) || !stage || participants.length === 0 || content.completedAt) return;
      const key = `${appId}/${companyId}/${threadId}`;
      const timestamp = Number(content.timestamp || 0);
      const previous = conversations.get(key);
      if (!previous || timestamp >= previous.timestamp) {
        conversations.set(key, {
          appId, companyId, threadId, dueDate, stage,
          subject: String(content.subject || 'Conversa sem assunto').slice(0, 140),
          participants,
          ticketNumber: Number(content.ticketNumber || 0),
          timestamp,
        });
      }
    });
  }

  const companyUsers = new Map<string, Map<string, string[]>>();
  for (const conversation of conversations.values()) {
    const companyKey = `${conversation.appId}/${conversation.companyId}`;
    if (!companyUsers.has(companyKey)) {
      const users = await database.collection(`artifacts/${conversation.appId}/public/data/companies/${conversation.companyId}/users`).get();
      companyUsers.set(companyKey, new Map(users.docs.map((user) => [
        user.id,
        Array.isArray(user.data().pushTokens)
          ? user.data().pushTokens.filter((token: unknown): token is string => typeof token === 'string' && token.length > 0)
          : [],
      ])));
    }
    const receiptId = `deadline-${conversation.threadId}-${conversation.dueDate}-${conversation.stage}`;
    const receiptRef = database.doc(`artifacts/${conversation.appId}/public/data/companies/${conversation.companyId}/notificationReceipts/${receiptId}`);
    const acquired = await database.runTransaction(async (transaction) => {
      if ((await transaction.get(receiptRef)).exists) return false;
      transaction.create(receiptRef, {
        type: 'conversation_deadline', threadId: conversation.threadId, dueDate: conversation.dueDate,
        stage: conversation.stage, status: 'processing', createdAt: Date.now(),
      });
      return true;
    });
    if (!acquired) continue;

    try {
      const users = companyUsers.get(companyKey)!;
      const tokens = conversation.participants.flatMap((participantId) => users.get(participantId) || []);
      tokens.push(...await getSupportNotificationTokens(database, conversation.appId, conversation.participants, ''));
      const uniqueTokens = [...new Set(tokens)];
      if (uniqueTokens.length === 0) {
        await receiptRef.set({status: 'no_registered_devices', completedAt: Date.now()}, {merge: true});
        continue;
      }
      const copy = deadlineNotificationCopy(conversation.stage);
      const ticket = conversation.ticketNumber > 0 ? `#${String(conversation.ticketNumber).padStart(6, '0')} · ` : '';
      const body = `${copy.prefix}: ${ticket}${conversation.subject}`.slice(0, 220);
      let successCount = 0;
      let failureCount = 0;
      for (let index = 0; index < uniqueTokens.length; index += 500) {
        const response = await getMessaging().sendEachForMulticast({
          tokens: uniqueTokens.slice(index, index + 500),
          notification: {title: copy.title, body},
          data: {
            type: 'message_deadline', companyId: conversation.companyId, threadId: conversation.threadId,
            dueDate: conversation.dueDate, stage: conversation.stage, eventId: receiptId,
          },
          webpush: {
            headers: {Urgency: 'high', TTL: '3600'},
            notification: {icon: '/pwa/icon-192.png', tag: receiptId, renotify: false},
            fcmOptions: {link: `https://comunica-info.web.app/?messageCompany=${encodeURIComponent(conversation.companyId)}&messageThread=${encodeURIComponent(conversation.threadId)}`},
          },
          android: {priority: 'high', ttl: 60 * 60 * 1000, notification: {tag: receiptId, sound: 'default'}},
        });
        successCount += response.successCount;
        failureCount += response.failureCount;
      }
      await receiptRef.set({status: 'delivered', successCount, failureCount, completedAt: Date.now()}, {merge: true});
    } catch (error) {
      console.error('Conversation deadline notification failed', {
        companyId: conversation.companyId, threadId: conversation.threadId, stage: conversation.stage, error,
      });
      await receiptRef.delete();
      throw error;
    }
  }
});

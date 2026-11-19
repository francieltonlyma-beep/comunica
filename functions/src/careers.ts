import {getFirestore, FieldPath, FieldValue, Timestamp} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {getAuth} from 'firebase-admin/auth';
import {HttpsError} from 'firebase-functions/v2/https';
import {extractResumeText} from './resumeExtraction';
import {careerDateInBrazil, isCareerVacancyOpen} from './careerVacancyAvailability.mjs';
import {SUPPORT_UID} from './platformSupport';

const APP_ID = 'comunica-salvador';
const tenant = (companyId: string) => getFirestore().doc(`artifacts/${APP_ID}/public/data/companies/${companyId}`);

type CandidateIdentity = {uid: string; email?: string; email_verified?: boolean};
type Vacancy = {title?: string; status?: string; skills?: string[]; quiz?: {question: string; options: string[]}[]; closesAt?: string; source?: string; roleId?: string; description?: string};
const MAX_RESUME_BYTES = 4 * 1024 * 1024;
const CAREER_PRIVACY_VERSION = '2026-10-12';
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const validId = (value: string) => /^[A-Za-z0-9_-]{1,240}$/.test(value);
const TALENT_POOL_PREFIX = 'talent-pool--';
const talentPoolRoleId = (vacancyId: string) => vacancyId.startsWith(TALENT_POOL_PREFIX) ? vacancyId.slice(TALENT_POOL_PREFIX.length) : '';

const cleanText = (value: unknown, max: number) => String(value || '').trim().slice(0, max);
const cleanSkills = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.map(skill => cleanText(skill, 60)).filter(Boolean))].slice(0, 30)
  : [];
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
const competencyAliases: Record<string, string[]> = {
  'experiencia com operacao de caixa': ['operador de caixa', 'operadora de caixa', 'funcao caixa', 'cargo caixa', 'experiencia como caixa'],
  'ensino medio completo': ['segundo grau completo', '2 grau completo', 'colegial completo'],
  'trabalho em equipe': ['trabalhar em equipe', 'facilidade em trabalhar em equipe', 'facilidade para trabalhar em equipe', 'facilidade de trabalhar em equipe'],
  'disponibilidade de horario': ['disponibilidade total de horario', 'flexibilidade de horario', 'horarios flexiveis'],
  proatividade: ['proativa', 'proativo', 'iniciativa'],
  'boa comunicacao': ['comunicativa', 'comunicativo', 'facilidade de comunicacao', 'comunicacao clara'],
  'bom relacionamento interpessoal': ['bom relacionamento', 'facilidade de relacionamento', 'relacionamento interpessoal'],
};

const searchableText = (value: string) => ` ${normalized(value).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const containsPhrase = (text: string, phrase: string) => text.includes(` ${phrase} `);

type SkillEvidence = {skill: string; source: string; excerpt: string};

function evidenceFor(skill: string, sources: {label: string; text: string}[]): SkillEvidence | null {
  const canonical = searchableText(skill).trim();
  const aliases = competencyAliases[canonical] || [];
  for (const source of sources) {
    const lines = source.text.split(/[\n.!?;]+/).map(line => line.trim()).filter(Boolean);
    for (const line of lines) {
      const searchableLine = searchableText(line);
      const matchedTerm = [canonical, ...aliases].find(alias => containsPhrase(searchableLine, alias));
      if (matchedTerm) return {skill, source: source.label, excerpt: line.slice(0, 220)};
    }
  }
  return null;
}

export function isHumanResourcesProfile(profile: Record<string, unknown>) {
  const values = [
    profile.role,
    profile.department,
    profile.dept,
    ...(Array.isArray(profile.departments) ? profile.departments : []),
    ...(Array.isArray(profile.depts) ? profile.depts : []),
  ].map(value => normalized(String(value || '')));
  return values.some(value => value === 'rh' || value.includes('recursos humanos') || /(^|[^a-z])rh([^a-z]|$)/.test(value));
}

async function verifyCompanyRecruiter(identity: CandidateIdentity | undefined, companyId: string) {
  if (!identity?.uid || !validId(companyId)) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const token = (identity as CandidateIdentity & {token?: Record<string, unknown>}).token || {};
  if (identity.uid === SUPPORT_UID && token.isDeveloper === true) {
    const support = await getFirestore().doc(`_platformSupport/${SUPPORT_UID}`).get();
    const supportData = support.data();
    if (support.exists && supportData?.enabled === true && supportData.appId === APP_ID) return identity;
  }
  const profile = await tenant(companyId).collection('users').doc(identity.uid).get();
  const profileData = profile.data() || {};
  if (token.companyId !== companyId || !profile.exists || !((token.isAdmin === true && profileData.isAdmin === true) || isHumanResourcesProfile(profileData))) {
    throw new HttpsError('permission-denied', 'Apenas administradores e profissionais de RH podem realizar esta ação.');
  }
  return identity;
}

export function matchCandidateSkills(required: string[], declared: string[], resumeText = '', profileSummary = '') {
  const candidate = new Set(declared.map(normalized));
  const sources = [
    {label: 'Currículo anexado', text: resumeText},
    {label: 'Resumo profissional', text: profileSummary},
  ].filter(source => source.text.trim());
  const matchedDeclared = required.filter(skill => candidate.has(normalized(skill)));
  const evidenceFromCv = required.map(skill => evidenceFor(skill, sources))
    .filter((item): item is SkillEvidence => item !== null);
  const matchedFromCv = evidenceFromCv.map(item => item.skill);
  const matched = required.filter(skill => matchedDeclared.includes(skill) || matchedFromCv.includes(skill));
  const missing = required.filter(skill => !matched.includes(skill));
  return {version: 2, matched, matchedDeclared, matchedFromCv, evidenceFromCv, missing, percentage: required.length ? Math.round(matched.length / required.length * 100) : null};
}

async function listOpenVacancies(companyId: string) {
  const pageSize = 50;
  const query = tenant(companyId).collection('vacancies').where('status', '==', 'published')
    .orderBy(FieldPath.documentId(), 'desc').limit(pageSize);
  const today = careerDateInBrazil();
  const jobs: ({id: string} & FirebaseFirestore.DocumentData)[] = [];
  let page = await query.get();
  for (;;) {
    for (const document of page.docs) {
      if (isCareerVacancyOpen(document.data(), today)) jobs.push({...document.data(), id: document.id});
      if (jobs.length === pageSize) return jobs;
    }
    if (page.size < pageSize) return jobs;
    page = await query.startAfter(page.docs[page.docs.length - 1]).get();
  }
}

export async function listPublicVacancies(rawCompanyId: unknown) {
  const companyId = cleanText(rawCompanyId, 120);
  if (!validId(companyId)) throw new HttpsError('invalid-argument', 'Informe o link de carreiras da empresa.');
  const company = await tenant(companyId).get();
  if (!company.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');
  const [jobs, roles] = await Promise.all([
    listOpenVacancies(companyId),
    tenant(companyId).collection('roles').limit(100).get(),
  ]);
  return {companyId, companyName: cleanText(company.data()?.name, 120), jobs, talentPoolRoles: roles.docs.map(document => {
      const role = document.data() || {};
      return {
        id: document.id,
        name: cleanText(role.name, 120),
        description: cleanText(role.description, 2000),
        departments: Array.isArray(role.depts) ? role.depts.map((value: unknown) => cleanText(value, 120)).filter(Boolean).slice(0, 20) : [],
      };
    }).filter(role => role.name)};
}

async function publicOpportunity(companyId: string, vacancyId: string) {
  const roleId = talentPoolRoleId(vacancyId);
  if (roleId) {
    if (!validId(roleId)) return null;
    const role = await tenant(companyId).collection('roles').doc(roleId).get();
    if (!role.exists) return null;
    const data = role.data() || {};
    return {title: cleanText(data.name, 120), status: 'published', skills: [], quiz: [], source: 'talent_pool', roleId, description: cleanText(data.description, 2000)} as Vacancy;
  }
  const vacancy = await tenant(companyId).collection('vacancies').doc(vacancyId).get();
  return vacancy.exists ? vacancy.data() as Vacancy : null;
}

function verifiedCandidate(identity?: CandidateIdentity) {
  if (!identity?.uid || !identity.email || identity.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Confirme seu e-mail antes de continuar.');
  }
  return identity;
}

export async function saveCandidateProfile(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const candidate = verifiedCandidate(identity);
  const profile = {
    name: cleanText(input.name, 120),
    phone: cleanText(input.phone, 30),
    city: cleanText(input.city, 120),
    skills: cleanSkills(input.skills),
    resumeText: cleanText(input.resumeText, 12000),
    email: candidate.email,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (profile.name.length < 3 || profile.resumeText.length < 50) {
    throw new HttpsError('invalid-argument', 'Informe seu nome e um currículo com pelo menos 50 caracteres.');
  }
  await getFirestore().collection('_candidateProfiles').doc(candidate.uid).set(profile, {merge: true});
  return {saved: true};
}

export async function getCandidateProfile(identity?: CandidateIdentity) {
  const candidate = verifiedCandidate(identity);
  const snapshot = await getFirestore().collection('_candidateProfiles').doc(candidate.uid).get();
  if (!snapshot.exists) return {profile: null};
  const data = snapshot.data() || {};
  return {profile: {name: data.name || '', phone: data.phone || '', city: data.city || '', skills: data.skills || [], resumeText: data.resumeText || ''}};
}

export async function getCandidateApplication(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const candidate = verifiedCandidate(identity);
  const companyId = cleanText(input.companyId, 100);
  const vacancyId = cleanText(input.vacancyId, 100);
  if (!validId(companyId) || !validId(vacancyId)) throw new HttpsError('invalid-argument', 'Vaga inválida.');
  const snapshot = await tenant(companyId).collection('applications').doc(`${vacancyId}_${candidate.uid}`).get();
  if (!snapshot.exists) return {application: null};
  const data = snapshot.data() || {};
  if (data.candidateUid !== candidate.uid) throw new HttpsError('permission-denied', 'Acesso não autorizado.');
  return {application: {
    status: data.status || 'received',
    createdAt: data.createdAt?.toMillis?.() || null,
    retentionUntil: Number(data.retentionUntil || 0) || null,
    quizAnswers: Array.isArray(data.quizAnswers) ? data.quizAnswers : [],
    candidateUpdatedAt: data.candidateUpdatedAt?.toMillis?.() || null,
    recruitmentUpdate: data.recruitmentUpdate || null,
    interview: data.interview || null,
  }};
}

export async function withdrawCandidateApplication(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const candidate = verifiedCandidate(identity);
  const companyId = cleanText(input.companyId, 100);
  const vacancyId = cleanText(input.vacancyId, 100);
  if (!validId(companyId) || !validId(vacancyId)) throw new HttpsError('invalid-argument', 'Vaga inválida.');
  const applicationRef = tenant(companyId).collection('applications').doc(`${vacancyId}_${candidate.uid}`);
  const analysisRef = getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidate.uid}`);
  const snapshot = await applicationRef.get();
  if (!snapshot.exists) return {withdrawn: true};
  if (snapshot.data()?.candidateUid !== candidate.uid) throw new HttpsError('permission-denied', 'Acesso não autorizado.');
  const resumePath = `career-resumes/${companyId}/${vacancyId}/${candidate.uid}/resume`;
  await getStorage().bucket().file(resumePath).delete({ignoreNotFound: true});
  const batch = getFirestore().batch();
  batch.delete(applicationRef);
  batch.delete(analysisRef);
  await batch.commit();
  return {withdrawn: true};
}

export async function deleteCandidateAccount(identity?: CandidateIdentity) {
  const candidate = verifiedCandidate(identity);
  const applications = await getFirestore().collectionGroup('applications').where('candidateUid', '==', candidate.uid).limit(101).get();
  if (applications.size > 100) throw new HttpsError('resource-exhausted', 'Há muitas candidaturas vinculadas. Solicite atendimento para concluir a exclusão.');
  await Promise.all(applications.docs.map(async document => {
    const data = document.data();
    const companyId = document.ref.parent.parent?.id || '';
    const vacancyId = cleanText(data.vacancyId, 100);
    if (!validId(companyId) || !validId(vacancyId)) throw new HttpsError('failed-precondition', 'Uma candidatura possui dados inválidos.');
    await getStorage().bucket().file(`career-resumes/${companyId}/${vacancyId}/${candidate.uid}/resume`).delete({ignoreNotFound: true});
  }));
  const batch = getFirestore().batch();
  applications.docs.forEach(document => {
    const data = document.data();
    const companyId = document.ref.parent.parent?.id || '';
    const vacancyId = cleanText(data.vacancyId, 100);
    batch.delete(document.ref);
    batch.delete(getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidate.uid}`));
    batch.delete(getFirestore().collection('_candidateUploadLimits').doc(`${companyId}_${vacancyId}_${candidate.uid}`));
  });
  batch.delete(getFirestore().collection('_candidateProfiles').doc(candidate.uid));
  await batch.commit();
  await getAuth().deleteUser(candidate.uid);
  return {deleted: true};
}

export async function extendApplicationRetention(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const companyId = cleanText(input.companyId, 100);
  const applicationId = cleanText(input.applicationId, 220);
  const admin = await verifyCompanyRecruiter(identity, companyId);
  if (!validId(applicationId)) throw new HttpsError('invalid-argument', 'Candidatura inválida.');
  const reference = tenant(companyId).collection('applications').doc(applicationId);
  return getFirestore().runTransaction(async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Candidatura não encontrada.');
    const data = snapshot.data() || {};
    if (Number(data.retentionExtendedCount || 0) >= 1) throw new HttpsError('failed-precondition', 'O prazo desta candidatura já foi prorrogado uma vez.');
    const previous = Number(data.retentionUntil || 0) || Date.now();
    const next = Math.max(previous, Date.now()) + RETENTION_MS;
    transaction.update(reference, {
      retentionUntil: next,
      retentionExtendedCount: 1,
      retentionHistory: FieldValue.arrayUnion({previous, next, extendedBy: admin.uid, extendedAt: Timestamp.now(), reason: 'Continuidade do processo seletivo'}),
    });
    return {extended: true, retentionUntil: next};
  });
}

export async function purgeExpiredApplications(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const companyId = cleanText(input.companyId, 100);
  await verifyCompanyRecruiter(identity, companyId);
  const expired = await tenant(companyId).collection('applications').where('retentionUntil', '<=', Date.now()).limit(100).get();
  await Promise.all(expired.docs.map(async document => {
    const data = document.data();
    const vacancyId = cleanText(data.vacancyId, 100);
    const candidateUid = cleanText(data.candidateUid, 240);
    if (!validId(vacancyId) || !validId(candidateUid)) throw new HttpsError('failed-precondition', 'Uma candidatura vencida possui dados inválidos.');
    await getStorage().bucket().file(`career-resumes/${companyId}/${vacancyId}/${candidateUid}/resume`).delete({ignoreNotFound: true});
  }));
  const batch = getFirestore().batch();
  expired.docs.forEach(document => {
    const data = document.data();
    const vacancyId = cleanText(data.vacancyId, 100);
    const candidateUid = cleanText(data.candidateUid, 240);
    batch.delete(document.ref);
    batch.delete(getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidateUid}`));
    batch.delete(getFirestore().collection('_candidateUploadLimits').doc(`${companyId}_${vacancyId}_${candidateUid}`));
  });
  await batch.commit();
  return {deleted: expired.size, hasMore: expired.size === 100};
}

export async function initializeApplicationRetention(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const companyId = cleanText(input.companyId, 100);
  await verifyCompanyRecruiter(identity, companyId);
  const applications = await tenant(companyId).collection('applications').limit(200).get();
  const missing = applications.docs.filter(document => !Number(document.data().retentionUntil || 0));
  if (!missing.length) return {updated: 0, hasMore: applications.size === 200};
  const batch = getFirestore().batch();
  missing.forEach(document => {
    const createdAt = document.data().createdAt?.toMillis?.() || Date.now();
    batch.update(document.ref, {retentionUntil: createdAt + RETENTION_MS, retentionExtendedCount: 0, retentionHistory: []});
  });
  await batch.commit();
  return {updated: missing.length, hasMore: applications.size === 200};
}

export function resumeFormat(name: string, buffer: Buffer) {
  const extension = name.toLocaleLowerCase('pt-BR').split('.').pop();
  if (extension === 'pdf' && buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (extension === 'docx' && buffer.subarray(0, 4).toString('hex') === '504b0304') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  throw new HttpsError('invalid-argument', 'Envie um arquivo PDF ou Word válido (.pdf ou .docx).');
}

export async function uploadCandidateResume(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const candidate = verifiedCandidate(identity);
  const companyId = cleanText(input.companyId, 100);
  const vacancyId = cleanText(input.vacancyId, 100);
  const fileName = cleanText(input.fileName, 180);
  const base64 = String(input.base64 || '');
  if (!validId(companyId) || !validId(vacancyId) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length > MAX_RESUME_BYTES * 1.4) {
    throw new HttpsError('invalid-argument', 'Arquivo inválido ou maior que 4 MB.');
  }
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > MAX_RESUME_BYTES) throw new HttpsError('invalid-argument', 'O currículo deve ter até 4 MB.');
  const contentType = resumeFormat(fileName, bytes);
  const [vacancy, previous] = await Promise.all([
    publicOpportunity(companyId, vacancyId),
    tenant(companyId).collection('applications').doc(`${vacancyId}_${candidate.uid}`).get(),
  ]);
  if (!vacancy || !isCareerVacancyOpen(vacancy)) {
    throw new HttpsError('failed-precondition', 'Esta vaga não está aberta.');
  }
  if (previous.exists && previous.data()?.status === 'closed') throw new HttpsError('failed-precondition', 'Esta candidatura já foi encerrada pela empresa.');
  const limitRef = getFirestore().collection('_candidateUploadLimits').doc(`${companyId}_${vacancyId}_${candidate.uid}`);
  await getFirestore().runTransaction(async tx => {
    const limit = await tx.get(limitRef);
    const count = Number(limit.data()?.count || 0);
    const lastAt = Number(limit.data()?.lastAt || 0);
    if (count >= 3 || Date.now() - lastAt < 60000) throw new HttpsError('resource-exhausted', 'Aguarde um minuto antes de reenviar o currículo.');
    tx.set(limitRef, {count: count + 1, lastAt: Date.now()}, {merge: true});
  });
  const path = `career-resumes/${companyId}/${vacancyId}/${candidate.uid}/resume`;
  await getStorage().bucket().file(path).save(bytes, {
    resumable: false,
    contentType,
    metadata: {cacheControl: 'private, no-store', metadata: {ownerUid: candidate.uid, fileName, companyId, vacancyId}},
  });
  const extracted = await extractResumeText(bytes, contentType);
  await getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidate.uid}`).set({
    text: extracted.text,
    readable: extracted.readable,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return {uploaded: true, fileName};
}

export async function downloadCandidateResume(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  if (!identity?.uid) throw new HttpsError('unauthenticated', 'Entre novamente.');
  const companyId = cleanText(input.companyId, 100);
  const applicationId = cleanText(input.applicationId, 220);
  if (!validId(companyId) || !validId(applicationId)) throw new HttpsError('invalid-argument', 'Candidatura inválida.');
  const application = await tenant(companyId).collection('applications').doc(applicationId).get();
  if (!application.exists) throw new HttpsError('not-found', 'Candidatura não encontrada.');
  const data = application.data() || {};
  const adminProfile = await tenant(companyId).collection('users').doc(identity.uid).get();
  const token = (identity as CandidateIdentity & {token?: Record<string, unknown>}).token || {};
  const profileData = adminProfile.data() || {};
  const isCompanyRecruiter = token.companyId === companyId && adminProfile.exists && ((token.isAdmin === true && profileData.isAdmin === true) || isHumanResourcesProfile(profileData));
  if (!isCompanyRecruiter && data.candidateUid !== identity.uid) throw new HttpsError('permission-denied', 'Acesso não autorizado ao currículo.');
  const path = cleanText(data.resumePath, 500);
  if (!path.startsWith(`career-resumes/${companyId}/${data.vacancyId}/${data.candidateUid}/`)) {
    throw new HttpsError('failed-precondition', 'Arquivo indisponível.');
  }
  const [bytes] = await getStorage().bucket().file(path).download();
  if (bytes.length > MAX_RESUME_BYTES) throw new HttpsError('resource-exhausted', 'Arquivo fora do limite permitido.');
  return {base64: bytes.toString('base64'), fileName: data.resumeFileName || 'curriculo', contentType: data.resumeContentType || 'application/octet-stream'};
}

export async function refreshCandidateFit(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const companyId = cleanText(input.companyId, 100);
  const applicationId = cleanText(input.applicationId, 220);
  await verifyCompanyRecruiter(identity, companyId);
  if (!validId(applicationId)) throw new HttpsError('invalid-argument', 'Candidatura inválida.');

  const applicationRef = tenant(companyId).collection('applications').doc(applicationId);
  const applicationSnapshot = await applicationRef.get();
  if (!applicationSnapshot.exists) throw new HttpsError('not-found', 'Candidatura não encontrada.');
  const application = applicationSnapshot.data() || {};
  const vacancyId = cleanText(application.vacancyId, 120);
  const candidateUid = cleanText(application.candidateUid, 240);
  if (!validId(vacancyId) || !validId(candidateUid)) throw new HttpsError('failed-precondition', 'A candidatura não possui os dados necessários para atualizar a análise.');

  const [vacancy, analysisSnapshot] = await Promise.all([
    publicOpportunity(companyId, vacancyId),
    getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidateUid}`).get(),
  ]);
  if (!vacancy) throw new HttpsError('not-found', 'A vaga desta candidatura não foi encontrada.');
  const analysis = analysisSnapshot.data() || {};
  const fit = matchCandidateSkills(
    Array.isArray(vacancy.skills) ? vacancy.skills : [],
    Array.isArray(application.skills) ? application.skills : [],
    String(analysis.text || ''),
    String(application.resumeText || ''),
  );
  await applicationRef.update({fit, resumeReadable: analysis.readable === true});
  return {fit};
}

export async function submitApplication(identity: CandidateIdentity | undefined, input: Record<string, unknown>) {
  const candidate = verifiedCandidate(identity);
  const companyId = cleanText(input.companyId, 100);
  const vacancyId = cleanText(input.vacancyId, 100);
  const answers = input.answers;
  if (!validId(companyId) || !validId(vacancyId) || !Array.isArray(answers) || input.consent !== true) {
    throw new HttpsError('invalid-argument', 'Revise a vaga, as respostas e o consentimento.');
  }
  const profileRef = getFirestore().collection('_candidateProfiles').doc(candidate.uid);
  const analysisRef = getFirestore().collection('_candidateResumeAnalyses').doc(`${companyId}_${vacancyId}_${candidate.uid}`);
  const applicationRef = tenant(companyId).collection('applications').doc(`${vacancyId}_${candidate.uid}`);
  const resumePath = `career-resumes/${companyId}/${vacancyId}/${candidate.uid}/resume`;
  const [fileExists] = await getStorage().bucket().file(resumePath).exists();
  if (!fileExists) throw new HttpsError('failed-precondition', 'Anexe seu currículo em PDF ou Word antes de enviar.');
  const [resumeMetadata] = await getStorage().bucket().file(resumePath).getMetadata();
  if (resumeMetadata.metadata?.ownerUid !== candidate.uid || resumeMetadata.metadata?.vacancyId !== vacancyId) {
    throw new HttpsError('permission-denied', 'Currículo inválido para esta vaga.');
  }
  const vacancy = await publicOpportunity(companyId, vacancyId);
  if (!vacancy || !isCareerVacancyOpen(vacancy)) {
    throw new HttpsError('failed-precondition', 'Esta oportunidade não está aberta.');
  }
  return getFirestore().runTransaction(async tx => {
    const [profileSnapshot, previous, analysisSnapshot] = await Promise.all([tx.get(profileRef), tx.get(applicationRef), tx.get(analysisRef)]);
    const profile = profileSnapshot.data();
    if (!profile) throw new HttpsError('failed-precondition', 'Complete seu cadastro antes de se candidatar.');
    const quiz = Array.isArray(vacancy.quiz) ? vacancy.quiz : [];
    if (quiz.length !== answers.length || quiz.some((question, index) =>
      !Number.isInteger(answers[index]) || answers[index] < 0 || answers[index] >= (question.options || []).length)) {
      throw new HttpsError('invalid-argument', 'Responda todas as perguntas do questionário.');
    }
    const extracted = analysisSnapshot.data();
    const fit = matchCandidateSkills(
      Array.isArray(vacancy.skills) ? vacancy.skills : [],
      Array.isArray(profile.skills) ? profile.skills : [],
      extracted?.text || '',
      profile.resumeText || '',
    );
    const applicationData = {
      id: applicationRef.id,
      candidateUid: candidate.uid,
      vacancyId,
      vacancyTitle: vacancy.title || '',
      source: vacancy.source || 'vacancy',
      roleId: vacancy.roleId || '',
      name: profile.name,
      email: candidate.email,
      phone: profile.phone || '',
      city: profile.city || '',
      skills: profile.skills || [],
      resumeText: profile.resumeText || '',
      resumePath,
      resumeFileName: resumeMetadata.metadata?.fileName || 'curriculo',
      resumeContentType: resumeMetadata.contentType || 'application/octet-stream',
      quizAnswers: answers,
      quizQuestions: quiz,
      fit,
      resumeReadable: extracted?.readable === true,
      privacyVersion: CAREER_PRIVACY_VERSION,
      consentAt: FieldValue.serverTimestamp(),
    };
    if (previous.exists) {
      tx.update(applicationRef, {
        ...applicationData,
        candidateUpdatedAt: FieldValue.serverTimestamp(),
        candidateUpdatePending: true,
        candidateUpdateVersion: Number(previous.data()?.candidateUpdateVersion || 0) + 1,
      });
      return {submitted: false, updated: true, fit};
    }
    tx.create(applicationRef, {
      ...applicationData,
      status: 'received',
      retentionUntil: Date.now() + RETENTION_MS,
      retentionExtendedCount: 0,
      retentionHistory: [],
      candidateUpdatePending: false,
      candidateUpdateVersion: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
    return {submitted: true, updated: false, fit};
  });
}

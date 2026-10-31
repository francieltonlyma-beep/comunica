import {Firestore} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {SUPPORT_UID} from './platformSupport';

type Actor = {uid: string; companyId: string; isDeveloper: boolean};

// The server merges only the caller's sectors against the latest settings.
// Client-side filtering alone cannot protect another sector's rules.
export async function saveCoverageSettings(database: Firestore, companyId: string, actor: Actor,
  requirements: unknown, expectedVersion: number) {
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(companyId) || !actor.uid) throw new HttpsError('invalid-argument', 'Empresa inválida.');
  const core = await import('./scheduleCoverageCore.mjs');
  const company = database.doc(`artifacts/comunica-salvador/public/data/companies/${companyId}`);
  return database.runTransaction(async transaction => {
    const [profile, support, departments, settings] = await Promise.all([
      transaction.get(company.collection('users').doc(actor.uid)),
      actor.uid === SUPPORT_UID && actor.isDeveloper ? transaction.get(database.doc(`_platformSupport/${SUPPORT_UID}`)) : Promise.resolve(null),
      transaction.get(company.collection('departments')),
      transaction.get(company.collection('settings').doc('schedule-rules')),
    ]);
    const isSupport = actor.uid === SUPPORT_UID && actor.isDeveloper && support?.data()?.enabled === true
      && support.data()?.appId === 'comunica-salvador';
    const user = profile.data();
    if (!isSupport && (actor.isDeveloper || actor.companyId !== companyId || !user)) throw new HttpsError('permission-denied', 'Acesso à empresa recusado.');
    const allDepartments = isSupport || user?.isAdmin === true;
    if (!allDepartments && (!/(coordenador|encarregado|supervis|diretor|gestor|gest[aã]o|rh)/i.test(user?.role || '')
      || user?.permissions?.canEdit === false || user?.permissions?.canManageCalendar === false
      || user?.permissions?.canManageScheduleRules === false)) throw new HttpsError('permission-denied', 'Seu perfil não pode configurar a cobertura.');
    const departmentIds = [...new Set([...(user?.departments || []), ...(user?.depts || []), user?.department, user?.dept].filter(Boolean).map(String))];
    const saved = settings.data() || {};
    if (Number(saved.version || 1) !== expectedVersion) throw new HttpsError('failed-precondition', 'As regras mudaram durante a edição. Reabra a necessidade e revise antes de salvar.');
    let coverageRequirements;
    try {
      coverageRequirements = core.mergeCoverageRequirements(saved.coverageRequirements || [], requirements,
        departments.docs.map(item => ({id: item.id})), {allDepartments, departmentIds});
    } catch (error) { throw new HttpsError('invalid-argument', error instanceof Error ? error.message : 'Cobertura inválida.'); }
    const version = Number(saved.version || 1) + 1;
    const updatedAt = Date.now();
    const updatedBy = isSupport ? 'Suporte Comunica' : String(user?.name || actor.uid);
    const versionHistory = [...(saved.versionHistory || []), {version, savedAt: updatedAt, savedBy: updatedBy,
      summary: `${coverageRequirements.length} faixa(s) e exceção(ões) de cobertura`}].slice(-12);
    transaction.set(settings.ref, {coverageRequirements, version, versionHistory, updatedAt, updatedBy}, {merge: true});
    transaction.create(company.collection('auditLogs').doc(), {actorId: actor.uid, actorName: updatedBy,
      action: 'schedule.coverage_configured', collection: 'settings', documentId: 'schedule-rules',
      fields: ['coverageRequirements'], timestamp: updatedAt, version});
    return {coverageRequirements, version};
  });
}

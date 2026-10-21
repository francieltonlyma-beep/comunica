import {Firestore, Timestamp} from 'firebase-admin/firestore';
import {HttpsError} from 'firebase-functions/v2/https';
import {SUPPORT_UID} from './platformSupport';

const APP_ID = 'comunica-salvador';
const CACHE_MS = 5 * 60 * 1000;
let cachedHealth: {expiresAt: number; data: PlatformCompanyHealthResponse} | null = null;

type SupportIdentity = {uid: string; token: Record<string, unknown>} | undefined;
type ChecklistItem = {id: string; complete: boolean};

export type PlatformCompanyHealth = {
  companyId: string;
  name: string;
  code: string;
  score: number;
  implementationScore: number;
  adoptionRate: number;
  notificationRate: number;
  level: 'ready' | 'progressing' | 'attention';
  employees: number;
  active30Days: number;
  neverAccessed: number;
  notificationUsers: number;
  lastAccessAt: number;
  departments: number;
  roles: number;
  documents: number;
  announcements: number;
  checklist: ChecklistItem[];
};

export type PlatformCompanyHealthResponse = {
  generatedAt: number;
  companies: PlatformCompanyHealth[];
  cacheTtlMinutes: number;
};

const timestampValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (value && typeof value === 'object' && 'toMillis' in value && typeof (value as {toMillis?: unknown}).toMillis === 'function') {
    return (value as {toMillis: () => number}).toMillis();
  }
  return 0;
};

const requireSupport = async (database: Firestore, auth: SupportIdentity) => {
  if (!auth || auth.uid !== SUPPORT_UID || auth.token.isDeveloper !== true) {
    throw new HttpsError('permission-denied', 'Indicadores disponíveis somente para o suporte da plataforma.');
  }
  const access = await database.doc(`_platformSupport/${SUPPORT_UID}`).get();
  if (!access.exists || access.data()?.enabled !== true || access.data()?.appId !== APP_ID) {
    throw new HttpsError('permission-denied', 'Acesso de suporte não autorizado.');
  }
};

const collectionCount = async (database: Firestore, path: string) => {
  const snapshot = await database.collection(path).count().get();
  return Number(snapshot.data().count || 0);
};

export async function getPlatformCompanyHealth(
  database: Firestore,
  auth: SupportIdentity,
  forceRefresh = false,
): Promise<PlatformCompanyHealthResponse> {
  await requireSupport(database, auth);
  const now = Date.now();
  if (!forceRefresh && cachedHealth && cachedHealth.expiresAt > now) return cachedHealth.data;

  const companiesSnapshot = await database.collection(`artifacts/${APP_ID}/public/data/companies`).limit(100).get();
  const companies: PlatformCompanyHealth[] = [];

  // Processamento sequencial mantém a quantidade de consultas simultâneas baixa,
  // mesmo quando a plataforma crescer para dezenas de empresas.
  for (const companyDocument of companiesSnapshot.docs) {
    const company = companyDocument.data();
    const root = `artifacts/${APP_ID}/public/data/companies/${companyDocument.id}`;
    const [usersSnapshot, departments, roles, documents, announcements, accessSettings] = await Promise.all([
      database.collection(`${root}/users`).get(),
      collectionCount(database, `${root}/departments`),
      collectionCount(database, `${root}/roles`),
      collectionCount(database, `${root}/documents`),
      collectionCount(database, `${root}/announcements`),
      database.doc(`${root}/settings/access-control`).get(),
    ]);

    const employees = usersSnapshot.docs
      .filter(item => item.id !== SUPPORT_UID && item.data().isDeveloper !== true && item.data().isEmployee !== false)
      .map(item => item.data());
    const lastAccessValues = employees.map(item => timestampValue(item.lastLoginAt)).filter(Boolean);
    const active30Days = lastAccessValues.filter(value => value >= now - 30 * 24 * 60 * 60 * 1000).length;
    const notificationUsers = employees.filter(item => Array.isArray(item.pushTokens) && item.pushTokens.length > 0).length;
    const checklist: ChecklistItem[] = [
      {id: 'team', complete: employees.length > 0},
      {id: 'departments', complete: departments > 0},
      {id: 'roles', complete: roles > 0},
      {id: 'firstAccess', complete: lastAccessValues.length > 0},
      {id: 'permissions', complete: accessSettings.exists},
      {id: 'communication', complete: announcements > 0},
      {id: 'documents', complete: documents > 0},
      {id: 'notifications', complete: notificationUsers > 0},
    ];
    const implementationScore = Math.round((checklist.filter(item => item.complete).length / checklist.length) * 100);
    const adoptionRate = employees.length ? Math.round((active30Days / employees.length) * 100) : 0;
    const notificationRate = employees.length ? Math.round((notificationUsers / employees.length) * 100) : 0;
    // Saúde combina preparo do ambiente (60%), uso recente (30%) e alcance de
    // notificações (10%). Os três componentes também são exibidos separadamente.
    const score = Math.round(implementationScore * 0.6 + adoptionRate * 0.3 + notificationRate * 0.1);
    companies.push({
      companyId: companyDocument.id,
      name: String(company.name || 'Empresa sem nome'),
      code: String(company.code || ''),
      score,
      implementationScore,
      adoptionRate,
      notificationRate,
      level: score >= 80 ? 'ready' : score >= 55 ? 'progressing' : 'attention',
      employees: employees.length,
      active30Days,
      neverAccessed: employees.length - lastAccessValues.length,
      notificationUsers,
      lastAccessAt: lastAccessValues.length ? Math.max(...lastAccessValues) : 0,
      departments,
      roles,
      documents,
      announcements,
      checklist,
    });
  }

  companies.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'pt-BR'));
  const data = {generatedAt: now, companies, cacheTtlMinutes: CACHE_MS / 60000};
  cachedHealth = {expiresAt: now + CACHE_MS, data};
  return data;
}

// Dados de trabalho permanecem apenas na memória durante a sessão autenticada.
// Versões antigas guardavam coleções inteiras sem separar empresa e usuário.
export const legacyCompanyCacheKeys = [
  'comunica_departments', 'comunica_users', 'comunica_roles', 'comunica_announcements',
  'comunica_sector_posts', 'comunica_productivity', 'comunica_messages',
  'comunica_presence', 'comunica_calendar_events', 'comunica_absences',
  'comunica_work_schedules', 'comunica_schedule_swap_requests',
  'comunica_documents', 'comunica_polls',
];

export function clearLegacyCompanyCache(storage) {
  if (!storage) return;
  for (const key of legacyCompanyCacheKeys) storage.removeItem(key);
}

const sessionKeys = [
  'id', 'name', 'role', 'avatar', 'isAdmin', 'isDeveloper', 'isEmployee',
  'companyId', 'depts', 'dept', 'department', 'prodGroup', 'managerId', 'mustChangePin',
];

export function sessionIdentity(user) {
  if (!user?.id) return null;
  return Object.fromEntries(sessionKeys.filter(key => user[key] !== undefined).map(key => [key, user[key]]));
}

export function readSessionIdentity(storage) {
  try { return sessionIdentity(JSON.parse(storage?.getItem('comunica_current_user') || 'null')); }
  catch { return null; }
}

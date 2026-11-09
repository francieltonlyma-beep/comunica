// Somente informações necessárias para localizar pessoas e organizar o trabalho.
export const directoryFields = [
  'name', 'role', 'avatar', 'depts', 'dept', 'department', 'prodGroup',
  'managerId', 'isAdmin', 'isEmployee', 'birthMonthDay',
];

export function publicDirectoryProfile(user) {
  const entry = {id: String(user?.id || '')};
  for (const key of directoryFields) {
    if (user?.[key] !== undefined) entry[key] = user[key];
  }
  if (Object.prototype.hasOwnProperty.call(user || {}, 'birthDate')) entry.birthMonthDay = String(user.birthDate || '').slice(5);
  return entry;
}

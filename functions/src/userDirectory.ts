export const directoryFields = [
  'name', 'role', 'avatar', 'depts', 'dept', 'department', 'prodGroup',
  'managerId', 'isAdmin', 'isEmployee', 'birthMonthDay',
] as const;

export function publicDirectoryProfile(user: Record<string, unknown>) {
  const profile: Record<string, unknown> = {id: String(user.id || '')};
  for (const key of directoryFields) if (user[key] !== undefined) profile[key] = user[key];
  if (Object.prototype.hasOwnProperty.call(user, 'birthDate')) {
    profile.birthMonthDay = String(user.birthDate || '').slice(5);
  }
  return profile;
}

import { isCompanyEmployee } from './teamMembership.js';

export const normalizeLoginName = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

export function loginDirectoryUsers(directory, company, code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode || directory?.code !== normalizedCode || !company?.id || directory.companyId !== company.id) return [];
  return Array.isArray(directory.users) ? directory.users.filter(user => isCompanyEmployee(user) && user.id && String(user.name || '').trim()) : [];
}

export function filterLoginEmployees(users, search) {
  const query = normalizeLoginName(search);
  return users.filter(user => normalizeLoginName(user.name).includes(query))
    .slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));
}

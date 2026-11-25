import { isCompanyEmployee } from './teamMembership.js';

export const roleNameKey = (name) => String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

export function getRoleDepts(role) {
  const departments = Array.isArray(role?.depts) ? role.depts.filter(Boolean) : [];
  return [...new Set(departments.length ? departments : [role?.dept].filter(Boolean))];
}

export function matchingRoles(roles, name, departments = []) {
  const key = roleNameKey(name);
  return roles.filter(role => !role.mergedIntoRoleId && roleNameKey(role.name) === key).sort((a, b) => {
    const aDepartments = getRoleDepts(a);
    const bDepartments = getRoleDepts(b);
    const overlap = ids => ids.filter(id => departments.includes(id)).length;
    return overlap(bDepartments) - overlap(aDepartments) || bDepartments.length - aDepartments.length || a.id.localeCompare(b.id);
  });
}

export function employeeRoleOptions(roles, departments, currentName) {
  const keys = new Set(roles.map(role => roleNameKey(role.name)).filter(Boolean));
  return [...keys].map(key => {
    const matches = matchingRoles(roles, key, departments);
    return matches.find(role => role.name === currentName) || matches[0];
  }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function getRoleUsers(role, roles, users, getUserDepts) {
  const matches = matchingRoles(roles, role.name);
  const roleDepartments = getRoleDepts(role);
  return users.filter(user => isCompanyEmployee(user) && roleNameKey(user.role) === roleNameKey(role.name)
    && (matches.length <= 1 || getUserDepts(user).some(id => roleDepartments.includes(id))));
}

export function mergeRoleFields(source, target) {
  const depts = [...new Set([...getRoleDepts(target), ...getRoleDepts(source)])];
  const descriptions = [...new Set([target.description, source.description].map(value => (value || '').trim()).filter(Boolean))];
  const description = descriptions.join('\n\n');
  if (description.length > 2000) throw new Error('Os descritivos juntos passam de 2.000 caracteres. Ajuste os textos antes de unificar.');

  const approvedHeadcountByDept = { ...target.approvedHeadcountByDept };
  for (const [dept, planned] of Object.entries(source.approvedHeadcountByDept || {})) {
    if (approvedHeadcountByDept[dept] != null && approvedHeadcountByDept[dept] !== planned) {
      throw new Error('Há dois quadros previstos diferentes para o mesmo setor. Revise o quadro previsto antes de unificar.');
    }
    approvedHeadcountByDept[dept] = planned;
  }
  return { depts, dept: depts[0] || '', description, approvedHeadcountByDept };
}

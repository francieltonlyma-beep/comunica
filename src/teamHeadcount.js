import { isCareerVacancyOpen } from '../functions/src/careerVacancyAvailability.mjs';
import { getRoleDepts, resolveEmployeeRole } from './roleCatalog.js';

export function teamHeadcount({ activeEmployees, departmentsList, rolesList, vacanciesList, getUserDepts, employeeStatusDay, mgmtSectorFilter }) {
  const headcountKey = (roleId, departmentId) => `${roleId}:${departmentId}`;
  const occupantsByRoleAndSector = new Map();
  const openVacanciesByRole = new Map();
  for (const employee of activeEmployees) {
    const role = resolveEmployeeRole(employee, rolesList);
    if (!role) continue;
    for (const departmentId of new Set(getUserDepts(employee))) {
      const key = headcountKey(role.id, departmentId);
      const occupants = occupantsByRoleAndSector.get(key) || [];
      occupants.push(employee);
      occupantsByRoleAndSector.set(key, occupants);
    }
  }
  for (const vacancy of vacanciesList) {
    if (vacancy.roleId && isCareerVacancyOpen(vacancy, employeeStatusDay)) {
      openVacanciesByRole.set(vacancy.roleId, (openVacanciesByRole.get(vacancy.roleId) || 0) + 1);
    }
  }
  const headcountRows = departmentsList
    .filter(department => mgmtSectorFilter === 'all' || department.id === mgmtSectorFilter)
    .flatMap(department => rolesList
      .filter(role => !role.mergedIntoRoleId && getRoleDepts(role).includes(department.id))
      .map(role => {
        const key = headcountKey(role.id || role.name, department.id);
        const occupants = occupantsByRoleAndSector.get(key) || [];
        const current = occupants.length;
        const plannedValue = role.approvedHeadcountByDept?.[department.id];
        const planned = plannedValue === '' || plannedValue === undefined || plannedValue === null ? null : Math.max(0, Number(plannedValue) || 0);
        return {
          key, role, department, current, occupants, planned,
          activeRecruitment: openVacanciesByRole.get(role.id) || 0,
          vacancies: planned === null ? 0 : Math.max(planned - current, 0),
          excess: planned === null ? 0 : Math.max(current - planned, 0),
          configured: planned !== null,
        };
      }));
  const headcountMetrics = headcountRows.reduce((totals, row) => {
    if (row.configured) {
      totals.planned += row.planned;
      totals.vacancies += row.vacancies;
      totals.excess += row.excess;
      totals.configuredRoles += 1;
    }
    return totals;
  }, { planned: 0, vacancies: 0, excess: 0, configuredRoles: 0 });
  return {headcountRows, headcountMetrics};
}

import { useMemo } from 'react';
import { scheduleRecordInScope, scheduleScopeForUser } from './scheduleScope.js';

// Keep scoped inputs stable between unrelated page updates. Access changes still
// invalidate the scope immediately; no company or permission data is cached globally.
export function useScheduleWorkspace(currentUser, employees, departments, schedules, absences, requirements, getDepartments) {
  const scheduleScope = useMemo(() => scheduleScopeForUser(currentUser, employees, departments, getDepartments),
    [currentUser, employees, departments, getDepartments]);
  const scheduleScopedSchedules = useMemo(() => schedules.filter(record => scheduleRecordInScope(record, scheduleScope, employees, getDepartments)),
    [schedules, scheduleScope, employees, getDepartments]);
  const scheduleScopedAbsences = useMemo(() => absences.filter(record => scheduleRecordInScope(record, scheduleScope, employees, getDepartments)),
    [absences, scheduleScope, employees, getDepartments]);
  const scheduleScopedCoverageRequirements = useMemo(() => (requirements || []).filter(rule => scheduleScope.allDepartments || scheduleScope.departmentIds.includes(String(rule.department))),
    [requirements, scheduleScope]);
  return { scheduleScope, scheduleScopedSchedules, scheduleScopedAbsences, scheduleScopedCoverageRequirements };
}

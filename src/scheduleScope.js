const ids = values => [...new Set((values || []).filter(Boolean).map(String))];

export function scheduleScopeForUser(currentUser, employees, departments, getDepartments) {
  const allDepartments = Boolean(currentUser?.isAdmin || currentUser?.isDeveloper);
  const departmentIds = allDepartments ? ids(departments.map(item => item.id)) : ids(getDepartments(currentUser));
  const allowed = new Set(departmentIds);
  const scopedEmployees = allDepartments
    ? employees
    : employees.filter(user => ids(getDepartments(user)).some(departmentId => allowed.has(departmentId)));
  return {
    allDepartments,
    departmentIds,
    departments: allDepartments ? departments : departments.filter(item => allowed.has(String(item.id))),
    employees: scopedEmployees,
    employeeIds: ids(scopedEmployees.map(user => user.id)),
  };
}

export function scheduleRecordInScope(record, scope, employees, getDepartments) {
  if (scope.allDepartments) return true;
  const allowed = new Set(scope.departmentIds);
  if (record?.dept) return allowed.has(String(record.dept));
  const employee = employees.find(user => String(user.id) === String(record?.userId));
  return Boolean(employee && ids(getDepartments(employee)).some(departmentId => allowed.has(departmentId)));
}

export function scheduleDepartmentForEmployee(employee, scope, getDepartments) {
  const employeeDepartments = ids(getDepartments(employee));
  if (scope.allDepartments) return employeeDepartments[0] || '';
  const allowed = new Set(scope.departmentIds);
  return employeeDepartments.find(departmentId => allowed.has(departmentId)) || '';
}

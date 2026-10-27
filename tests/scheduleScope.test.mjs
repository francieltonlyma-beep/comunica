import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scheduleDepartmentForEmployee, scheduleRecordInScope, scheduleScopeForUser } from '../src/scheduleScope.js';

const departments = [{ id: 'sales' }, { id: 'plant' }, { id: 'finance' }];
const employees = [
  { id: 'manager', depts: ['plant'] },
  { id: 'worker', depts: ['plant'] },
  { id: 'shared', depts: ['sales', 'plant'] },
  { id: 'seller', depts: ['sales'] },
];
const getDepartments = user => user?.depts || [];

test('gestor comum vê somente setores e colaboradores vinculados a ele', () => {
  const scope = scheduleScopeForUser(employees[0], employees, departments, getDepartments);
  assert.deepEqual(scope.departmentIds, ['plant']);
  assert.deepEqual(scope.departments.map(item => item.id), ['plant']);
  assert.deepEqual(scope.employees.map(item => item.id), ['manager', 'worker', 'shared']);
});

test('administrador mantém visão de toda a empresa', () => {
  const scope = scheduleScopeForUser({ id: 'admin', isAdmin: true }, employees, departments, getDepartments);
  assert.equal(scope.allDepartments, true);
  assert.equal(scope.employees.length, employees.length);
  assert.equal(scope.departments.length, departments.length);
});

test('registro e novo lançamento usam somente um setor permitido', () => {
  const scope = scheduleScopeForUser(employees[0], employees, departments, getDepartments);
  assert.equal(scheduleRecordInScope({ userId: 'shared', dept: 'plant' }, scope, employees, getDepartments), true);
  assert.equal(scheduleRecordInScope({ userId: 'shared', dept: 'sales' }, scope, employees, getDepartments), false);
  assert.equal(scheduleDepartmentForEmployee(employees[2], scope, getDepartments), 'plant');
});

test('Firebase limita leitura e escrita de escalas ao setor do gestor', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /function scheduleDepartmentInScope/);
  assert.match(rules, /kind == 'schedules'[\s\S]*scheduleDepartmentInScope\(app, company, resource\.data\)/);
  assert.match(rules, /scheduleDepartmentInScope\(app, company, request\.resource\.data\)/);
});

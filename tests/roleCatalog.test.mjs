import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeRoleOptions, getRoleUsers, matchingRoles, mergeRoleFields } from '../src/roleCatalog.js';

const main = { id: 'analista', name: 'ANALISTA FINANCEIRO', depts: ['vila-a', 'ceasa'] };
const duplicate = { id: 'analista-importado', name: 'Analista  Financeiro', dept: 'ceasa' };
const departments = user => user.depts;

test('reconhece o mesmo cargo com variações de acento, espaços e caixa e reaproveita o vínculo de setor', () => {
  const catalog = [main, duplicate, { id: 'rh', name: 'OPERADOR DE CAIXA', dept: 'rh' }];
  assert.deepEqual(matchingRoles(catalog, ' analista fínanceiro '), [main, duplicate]);
  assert.deepEqual(employeeRoleOptions(catalog, ['ceasa'], '').map(role => role.id), ['analista', 'rh']);
  assert.deepEqual(employeeRoleOptions(catalog, ['ceasa'], duplicate.name).map(role => role.id), [duplicate.id, 'rh']);
});

test('mostra os colaboradores que explicam a contagem de cada duplicado', () => {
  const shared = { id: 'u1', role: 'Analista Financeiro', depts: ['ceasa'] };
  const anotherSector = { id: 'u2', role: main.name, depts: ['vila-a'] };
  const outside = { id: 'u3', role: main.name, depts: ['outro'] };
  const support = { id: 'u4', role: main.name, depts: ['ceasa'], isEmployee: false };
  const users = [shared, anotherSector, outside, support];
  assert.deepEqual(getRoleUsers(duplicate, [main, duplicate], users, departments), [shared]);
  assert.deepEqual(getRoleUsers(main, [main, duplicate], users, departments), [shared, anotherSector]);
  assert.deepEqual(getRoleUsers(main, [main, { ...duplicate, mergedIntoRoleId: main.id }], users, departments), [shared, anotherSector, outside]);
});

test('unifica setores, descrições e quadro previsto e exige revisão se houver dois valores para o mesmo setor', () => {
  const source = { ...duplicate, dept: 'comercial', description: 'Conferir notas', approvedHeadcountByDept: { comercial: 0 } };
  const target = { ...main, description: 'Conferir pagamentos', approvedHeadcountByDept: { ceasa: 2 } };
  assert.deepEqual(mergeRoleFields(source, target), {
    depts: ['vila-a', 'ceasa', 'comercial'],
    dept: 'vila-a',
    description: 'Conferir pagamentos\n\nConferir notas',
    approvedHeadcountByDept: { ceasa: 2, comercial: 0 },
  });
  assert.throws(() => mergeRoleFields({ ...source, approvedHeadcountByDept: { ceasa: 1 } }, target), /quadros previstos diferentes/);
});

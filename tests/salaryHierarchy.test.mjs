import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalaryHierarchy, directReportChanges } from '../src/salaryHierarchy.js';

const role = id => ({ id, name: id });
const plan = (supervisor, active = true) => ({ plan: { supervisor, active } });

test('hierarchy orders superiors before reports and retains the entire reporting chain', () => {
  const { rows, nodes } = buildSalaryHierarchy(['Auxiliar', 'Gerente', 'Supervisor'].map(role), {
    Auxiliar: plan('Supervisor'), Supervisor: plan('Gerente'), Gerente: plan(''),
  });
  assert.deepEqual(rows.map(node => [node.id, node.depth]), [['Gerente', 0], ['Supervisor', 1], ['Auxiliar', 2]]);
  assert.deepEqual(nodes.get('Auxiliar').chain.map(node => node.id), ['Gerente', 'Supervisor']);
  assert.deepEqual(nodes.get('Gerente').reports.map(node => node.id), ['Supervisor']);
});

test('merged or missing superiors and cycles stay visible as links to review', () => {
  const { rows, nodes } = buildSalaryHierarchy([...['A', 'B', 'C', 'D', 'E'].map(role), { ...role('F'), mergedIntoRoleId: 'D' }], {
    A: plan('B'), B: plan('A'), C: plan('A'), D: plan('F', false),
  });
  assert.equal(nodes.has('F'), false);
  assert.deepEqual(rows.map(node => [node.id, node.issue]), [['D', 'missing'], ['E', ''], ['A', 'cycle'], ['B', 'cycle'], ['C', 'cycle']]);
  assert.equal(nodes.get('D').plan.active, false);
  assert.equal(nodes.get('E').plan, undefined);
});

test('bulk selection changes only direct links and preserves other branches', () => {
  const { nodes } = buildSalaryHierarchy(['Gerente', 'Supervisor', 'Antigo', 'Novo', 'Outro'].map(role), {
    Supervisor: plan('Gerente'), Antigo: plan('Gerente'), Novo: plan('Supervisor'), Outro: plan('Supervisor'),
  });
  assert.deepEqual(directReportChanges('Gerente', [...nodes.values()], new Set(['Gerente', 'Supervisor', 'Novo'])), [
    { id: 'Antigo', previous: 'Gerente', supervisor: '' },
    { id: 'Novo', previous: 'Supervisor', supervisor: 'Gerente' },
  ]);
});

test('an unconfigured role can be linked and a role cannot be its own subordinate', () => {
  const { nodes } = buildSalaryHierarchy(['Gerente', 'Novo'].map(role), {});
  assert.deepEqual(directReportChanges('Gerente', [...nodes.values()], new Set(['Gerente', 'Novo'])), [
    { id: 'Novo', previous: '', supervisor: 'Gerente' },
  ]);
});

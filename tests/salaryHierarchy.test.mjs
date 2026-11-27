import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalaryHierarchy } from '../src/salaryHierarchy.js';

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

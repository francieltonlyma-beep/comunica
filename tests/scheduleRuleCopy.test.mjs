import test from 'node:test';
import assert from 'node:assert/strict';
import {copyGroupRules} from '../src/scheduleRuleCopy.js';

test('copia regras gerais para várias turmas sem transferir pessoas ou exceções individuais', () => {
  let next = 0;
  const source = {id: 'a', name: 'A', userIds: ['ana'], shiftId: 'turno-1', weekdays: [1, 2], policy: {hoursPerWeek: 40}, dayRules: [
    {id: 'geral', name: 'Domingo', userIds: [], weekdays: [0]},
    {id: 'ana', name: 'Exceção Ana', userIds: ['ana']},
  ]};
  const targets = ['b', 'c'].map(id => ({id, name: id, userIds: [id], dayRules: [
    {id: `${id}-geral`, userIds: [], name: 'Antiga'},
    {id: `${id}-pessoal`, userIds: [id], name: 'Pessoal'},
  ]}));
  const result = copyGroupRules([source, ...targets], 'a', ['b', 'c'], () => ++next);
  assert.equal(result[0], source);
  for (const target of result.slice(1)) {
    assert.deepEqual(target.userIds, [target.id]);
    assert.equal(target.shiftId, 'turno-1');
    assert.deepEqual(target.weekdays, [1, 2]);
    assert.deepEqual(target.dayRules.map(rule => rule.name), ['Pessoal', 'Domingo']);
    assert.equal(target.dayRules[1].id.startsWith('day-'), true);
    assert.notEqual(target.dayRules[1].id, 'geral');
  }
  result[1].policy.hoursPerWeek = 30;
  result[1].dayRules[1].weekdays.push(6);
  assert.equal(result[2].policy.hoursPerWeek, 40);
  assert.deepEqual(result[2].dayRules[1].weekdays, [0]);
});

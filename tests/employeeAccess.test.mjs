import test from 'node:test';
import assert from 'node:assert/strict';
import {employeeAccessMillis, employeeAccessLabel} from '../src/employeeAccess.js';

test('último acesso aceita registros numéricos e timestamps antigos no horário do Brasil', () => {
  const millis = Date.parse('2026-11-10T01:30:00Z');
  assert.equal(employeeAccessMillis({seconds: millis / 1000, nanoseconds: 0}), millis);
  assert.equal(employeeAccessMillis({toMillis: () => millis}), millis);
  assert.deepEqual(employeeAccessLabel(millis), {date: '09/11/2026', time: '22:30'});
  assert.deepEqual(employeeAccessLabel({seconds: millis / 1000}), {date: '09/11/2026', time: '22:30'});
  assert.equal(employeeAccessLabel('valor inválido'), null);
});

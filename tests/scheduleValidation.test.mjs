import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleRowFieldIssues, scheduleIssueTarget } from '../src/scheduleValidation.js';
import { scheduleRuleIssues } from '../src/scheduleDayRules.js';

const row = { key: 'a-day', userId: 'a', userName: 'Ana', date: '2026-11-01', status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', breakMinutes: 60, extraHours: 0, restEveryDays: 7, minRestHours: 11, maxDailyHours: 12, maxExtraHoursPerDay: 2 };

test('validação identifica campo, colaborador, data e orientação para entrada, saída e intervalo', () => {
  for (const [change, field] of [[{ shiftStart: '' }, 'shiftStart'], [{ shiftEnd: '08:00' }, 'shiftEnd'], [{ breakEnd: '' }, 'breakEnd'], [{ breakStart: '' }, 'breakStart'], [{ shiftEnd: '10:09' }, 'breakEnd']]) {
    const issue = scheduleRowFieldIssues({ ...row, ...change }).find(item => item.field === field);
    assert.ok(issue); assert.equal(issue.rowKey, row.key); assert.equal(issue.userId, 'a'); assert.ok(issue.hint.length > 10);
  }
  assert.deepEqual(scheduleRowFieldIssues(row), []);
  assert.deepEqual(scheduleRowFieldIssues({ ...row, shiftStart: '22:00', shiftEnd: '06:00', breakStart: '02:00', breakEnd: '03:00' }), []);
});

test('limite diário, horas extras e descanso entre jornadas apontam os campos corrigíveis', () => {
  const over = scheduleRuleIssues([{ ...row, extraHours: 3, maxDailyHours: 10 }]);
  assert.ok(over.some(issue => issue.code === 'daily-limit' && issue.field === 'extraHours'));
  assert.ok(over.some(issue => issue.code === 'overtime-limit' && issue.field === 'extraHours'));
  const next = { ...row, key: 'next', date: '2026-11-02', shiftStart: '02:00', shiftEnd: '11:00', breakStart: '06:00', breakEnd: '07:00' };
  const rest = scheduleRuleIssues([row, next]).find(issue => issue.code === 'between-shifts');
  assert.equal(rest.rowKey, 'next'); assert.equal(rest.field, 'shiftStart');
});

test('não bloqueia marcação preservada e aponta excesso ou valor inválido de hora extra', () => {
  assert.deepEqual(scheduleRowFieldIssues({ ...row, preservedExisting: true, shiftStart: '' }), []);
  assert.equal(scheduleRowFieldIssues({ ...row, extraHours: -1 })[0].field, 'extraHours');
  assert.equal(scheduleRowFieldIssues({ ...row, extraHours: 16 })[0].code, 'long-shift');
});

test('navegação usa a linha exata mesmo se o aviso semanal se refere ao início de outra data', () => {
  const issue = { rowKey: row.key, userId: 'a', date: '2026-10-26', field: 'extraHours', message: 'Carga semanal excedida', hint: 'Revise as horas extras' };
  assert.equal(scheduleIssueTarget(issue, [row]).date, row.date);
  assert.equal(scheduleIssueTarget(issue, [row]).field, 'extraHours');
  assert.equal(scheduleIssueTarget({ date: '2030-01-01' }, [row]), null);
});

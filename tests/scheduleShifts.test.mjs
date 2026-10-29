import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScheduleShifts, validateScheduleShifts } from '../src/scheduleShifts.js';
import { buildRuleSchedule, normalizeRuleGroups, isWorking, shiftDate } from '../src/scheduleDayRules.js';
import { buildCoverageFirstProposal, prepareScheduleProposal } from '../src/scheduleOptimizer.js';

const shift = { id: 'morning', name: 'Manhã', shiftStart: '06:00', shiftEnd: '14:00', breakStart: '10:00', breakEnd: '11:00' };
const rules = { shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', allowedWeekdays: [0, 1, 2, 3, 4, 5, 6], workDaysPerWeek: 5, hoursPerWeek: 35, restEveryDays: 7, holidaysCountAsRest: true, shifts: [shift], ruleGroups: [{ id: 'crew', name: 'Turma A', shiftId: 'morning', userIds: ['u'], weekdays: [1, 2, 3, 4, 5], policy: {}, dayRules: [] }] };
const dates = Array.from({ length: 7 }, (_, index) => shiftDate('2026-11-02', index));
const build = config => buildRuleSchedule({ dates, users: [{ id: 'u', name: 'Ana' }], holidays: [], rules: config, getDepartment: () => 'op' });

test('turno e dias da turma sobrevivem à normalização e são usados na geração', () => {
  assert.equal(normalizeRuleGroups(rules.ruleGroups)[0].shiftId, 'morning');
  assert.equal(normalizeScheduleShifts([shift])[0].shiftStart, '06:00');
  const rows = build(rules);
  assert.equal(rows.filter(isWorking).length, 5);
  assert.ok(rows.filter(isWorking).every(row => row.shiftStart === '06:00' && row.shiftEnd === '14:00'));
  assert.ok(rows.slice(5).every(row => row.status === 'Folga'));
});

test('dias antigos salvos como texto continuam compatíveis após normalização', () => {
  assert.deepEqual(normalizeRuleGroups([{ ...rules.ruleGroups[0], weekdays: ['1', '2', '2', '9'] }])[0].weekdays, [1, 2]);
});

test('turno sem intervalo não herda intervalo de uma jornada anterior', () => {
  const rows = build({ ...rules, shifts: [{ ...shift, breakStart: '', breakEnd: '' }] });
  assert.ok(rows.filter(isWorking).every(row => row.breakStart === '' && row.breakEnd === ''));
});

test('exceção individual prevalece sobre turno e perfil da turma é preservado', () => {
  const config = { ...rules, employeeOverrides: { u: { shiftStart: '07:00' } }, ruleGroups: [{ ...rules.ruleGroups[0], policy: { workDaysPerWeek: 4, restEveryDays: 6 } }] };
  const rows = prepareScheduleProposal(build(config), { rules: config });
  assert.equal(rows.filter(isWorking).length, 4);
  assert.ok(rows.filter(isWorking).every(row => row.shiftStart === '07:00'));
  assert.ok(rows.every(row => row.workDaysPerWeek === 4 && row.restEveryDays === 6));
});

test('valida vínculo de turno, horários e intervalos inclusive noturnos', () => {
  assert.equal(validateScheduleShifts([shift], rules.ruleGroups), '');
  assert.ok(validateScheduleShifts([], rules.ruleGroups));
  assert.ok(validateScheduleShifts([{ ...shift, shiftEnd: '06:00' }]));
  assert.ok(validateScheduleShifts([{ ...shift, breakStart: '20:00', breakEnd: '21:00' }]));
  assert.equal(validateScheduleShifts([{ ...shift, shiftStart: '22:00', shiftEnd: '06:00', breakStart: '02:00', breakEnd: '03:00' }]), '');
});

const crewRows = () => ['a', 'b', 'c', 'd'].flatMap(userId => dates.map((date, i) => ({ key: `${userId}-${date}`, userId, userName: userId, dept: 'op', date, weekKey: dates[0], status: i < 5 ? 'Presencial' : 'Folga', shiftStart: i < 5 ? '08:00' : '', shiftEnd: i < 5 ? '17:00' : '', breakStart: i < 5 ? '12:00' : '', breakEnd: i < 5 ? '13:00' : '', breakMinutes: i < 5 ? 60 : 0, extraHours: 0, restEveryDays: 7, workDaysPerWeek: 5, allowed: true })));
const need = [{ id: 'daily', department: 'op', start: '08:00', end: '12:00', minimum: 2, weekdays: [0, 1, 2, 3, 4, 5, 6] }];

test('cobertura orienta folgas para eliminar dias vazios sem aumentar jornadas', () => {
  const input = crewRows();
  const result = buildCoverageFirstProposal(input, need, {});
  assert.ok(result.before.missingMinutes > 0);
  assert.equal(result.after.missingMinutes, 0);
  for (const userId of ['a', 'b', 'c', 'd']) assert.equal(result.rows.filter(row => row.userId === userId && isWorking(row)).length, 5);
  assert.equal(input.filter(row => row.date === dates[6] && isWorking(row)).length, 0);
});

test('regras fixas e falta de capacidade são preservadas e sinalizadas', () => {
  const rows = crewRows().filter(row => row.userId === 'a').map(row => ({ ...row, locked: true }));
  const result = buildCoverageFirstProposal(rows, need, {});
  assert.deepEqual(result.rows, rows);
  assert.ok(result.after.missingMinutes > 0);
});

test('limite de busca não deixa uma semana com dias extras', () => {
  const input = crewRows();
  const result = buildCoverageFirstProposal(input, need, {}, { maxEvaluations: 1 });
  for (const userId of ['a', 'b', 'c', 'd']) assert.equal(result.rows.filter(row => row.userId === userId && isWorking(row)).length, 5);
  assert.ok(result.after.missingMinutes <= result.before.missingMinutes);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { compareScheduleRules } from '../src/scheduleRuleImpact.js';

const base = { shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', allowedWeekdays: [1, 2, 3, 4, 5], workDaysPerWeek: 5, hoursPerWeek: 40, restEveryDays: 7, employeeOverrides: {}, ruleGroups: [] };
const users = [{ id: '1', name: 'Ana' }, { id: '2', name: 'Bia' }];
const dates = ['2026-11-09', '2026-11-10', '2026-11-11'];

test('prévia de mudança individual identifica apenas a pessoa e a data afetadas', () => {
  const draftRules = { ...base, ruleGroups: [{ id: 'team', name: 'Equipe', userIds: ['1'], dayRules: [{ id: 'tuesday', name: 'Terça curta', kind: 'weekday', weekdays: [2], action: 'work', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '', enabled: true }] }] };
  const impact = compareScheduleRules({ savedRules: base, draftRules, dates, users });
  assert.equal(impact.people, 1);
  assert.equal(impact.days, 1);
  assert.deepEqual(impact.changes.map(change => [change.userName, change.date, change.after.shiftEnd]), [['Ana', '2026-11-10', '12:00']]);
});

test('prévia sem diferença operacional não indica pessoas afetadas', () => {
  const impact = compareScheduleRules({ savedRules: base, draftRules: { ...base, name: 'Nova descrição' }, dates, users });
  assert.equal(impact.changes.length, 0);
});

test('mudança só no mínimo aparece na cobertura mesmo sem alterar jornadas', () => {
  const requirement = { id: 'morning', department: 'loja', weekdays: [1], start: '08:00', end: '12:00', minimum: 2 };
  const impact = compareScheduleRules({
    savedRules: { ...base, coverageRequirements: [requirement] },
    draftRules: { ...base, coverageRequirements: [{ ...requirement, minimum: 3 }] },
    dates, users, getDepartment: () => 'loja',
    coverageContext: { employees: users, getDepartments: () => ['loja'] },
  });
  assert.equal(impact.changes.length, 0);
  const monday = impact.coverageDays[0];
  assert.equal(monday.before.rules[0].segments[0].missing, 0);
  assert.equal(monday.after.rules[0].segments[0].missing, 1);
});

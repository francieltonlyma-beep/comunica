import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageForDay, normalizeCoverageRequirements, validateCoverageRequirements } from '../src/scheduleCoverage.js';

const date = '2026-10-23'; // sexta-feira
const rule = { id: 'r', department: 'op', start: '08:00', end: '12:00', minimum: 2, weekdays: [5], includeRemote: false };
const person = (id, changes = {}) => ({ id: String(id), name: 'Pessoa ' + id, depts: ['op'], ...changes });
const shift = (id, changes = {}) => ({ id: 's' + id, userId: String(id), userName: 'Pessoa ' + id, dept: 'op', startDate: date, endDate: date, status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', ...changes });
const data = (schedules, changes = {}) => ({ schedules, employees: [person(1), person(2), person(3)], absences: [], ...changes });

test('desconta intervalos com precisão e aponta a faixa exata de falta', () => {
  const result = coverageForDay(date, [rule], data([shift(1, { breakStart: '10:00', breakEnd: '10:15' }), shift(2)]));
  assert.equal(result.status, 'shortage');
  assert.deepEqual(result.rules[0].segments, [
    { start: '08:00', end: '10:00', available: 2, missing: 0 },
    { start: '10:00', end: '10:15', available: 1, missing: 1 },
    { start: '10:15', end: '12:00', available: 2, missing: 0 },
  ]);
});

test('conta pessoas distintas e um registro duplicado não cobre seu próprio intervalo', () => {
  const result = coverageForDay(date, [{ ...rule, minimum: 1 }], data([shift(1, { breakStart: '09:00', breakEnd: '10:00' }), shift(1, { id: 'duplicate' })]));
  assert.equal(result.rules[0].segments.find(item => item.start === '09:00').available, 0);
  assert.equal(result.missingMax, 1);
});

test('ausência parcial e férias sobrepostas retiram a pessoa da cobertura', () => {
  const result = coverageForDay(date, [rule], data([shift(1), shift(2), shift(3), shift(3, { id: 'vac', status: 'Férias' })], {
    absences: [{ userId: '1', date, startTime: '09:10', endTime: '09:40' }],
  }));
  assert.equal(result.rules[0].segments.find(item => item.start === '09:10').available, 1);
  assert.equal(result.rules[0].segments[0].available, 2);
});

test('home office só entra quando autorizado na necessidade', () => {
  const records = data([shift(1), shift(2, { status: 'Home Office' })]);
  assert.equal(coverageForDay(date, [rule], records).status, 'shortage');
  assert.equal(coverageForDay(date, [{ ...rule, includeRemote: true }], records).status, 'sufficient');
});

test('dias sem necessidade ficam neutros e filtros por setor não misturam equipes', () => {
  assert.equal(coverageForDay('2026-10-24', [rule], data([])).status, 'none');
  assert.equal(coverageForDay(date, [rule], data([]), 'adm').status, 'none');
  assert.equal(coverageForDay(date, [rule], data([])).missingMax, 2);
});

test('setor da escala prevalece e vínculo secundário não duplica o trabalhador entre setores', () => {
  const records = data([shift(1, { dept: 'adm' }), shift(2, { dept: undefined })], {
    employees: [person(1), person(2, { depts: ['op', 'adm'] })],
  });
  assert.equal(coverageForDay(date, [{ ...rule, minimum: 1 }], records).rules[0].segments[0].available, 1);
  const admRule = { ...rule, department: 'adm', minimum: 2 };
  assert.equal(coverageForDay(date, [admRule], records).rules[0].segments[0].available, 1);
});

test('horários e intervalos incompletos não geram cobertura suficiente', () => {
  for (const changes of [{ shiftStart: '', shiftEnd: '' }, { breakMinutes: 60 }, { breakStart: '10:00' }, { breakStart: '07:00', breakEnd: '08:00' }]) {
    const result = coverageForDay(date, [{ ...rule, minimum: 1 }], data([shift(1, changes)]));
    assert.equal(result.status, 'unknown');
    assert.equal(result.rules[0].unknown, 1);
    assert.equal(result.rules[0].segments[0].available, 0);
  }
});

test('um turno noturno do dia anterior cobre a madrugada e respeita o intervalo', () => {
  const nightRule = { ...rule, start: '00:00', end: '06:00', minimum: 1 };
  const records = data([shift(1, { startDate: '2026-10-22', endDate: '2026-10-22', shiftStart: '22:00', shiftEnd: '06:00', breakStart: '01:00', breakEnd: '02:00' })]);
  const result = coverageForDay(date, [nightRule], records);
  assert.deepEqual(result.rules[0].segments.map(item => [item.start, item.end, item.available]), [['00:00', '01:00', 1], ['01:00', '02:00', 0], ['02:00', '06:00', 1]]);
});

test('ausência que atravessa a meia-noite afeta também a madrugada seguinte', () => {
  const result = coverageForDay(date, [{ ...rule, start: '00:00', end: '04:00', minimum: 1 }], data([shift(1, { shiftStart: '00:00', shiftEnd: '06:00' })], {
    absences: [{ userId: '1', date: '2026-10-22', startTime: '22:00', endTime: '02:00' }],
  }));
  assert.equal(result.rules[0].segments[0].end, '02:00');
  assert.equal(result.rules[0].segments[0].available, 0);
});

test('validação rejeita setor inválido, mínimo fracionário, dias vazios e faixa invertida', () => {
  const departments = [{ id: 'op' }];
  assert.equal(validateCoverageRequirements([rule], departments), '');
  for (const changes of [{ department: 'other' }, { minimum: 1.5 }, { weekdays: [] }, { end: '07:00' }, { start: '25:00' }]) {
    assert.ok(validateCoverageRequirements([{ ...rule, ...changes }], departments));
  }
  assert.ok(validateCoverageRequirements([rule, rule], departments));
  assert.deepEqual(normalizeCoverageRequirements(null), []);
});

test('máximo é opcional, precisa respeitar o mínimo e aponta concentração', () => {
  const departments = [{ id: 'op' }];
  assert.equal(validateCoverageRequirements([{ ...rule, maximum: null }], departments), '');
  assert.equal(validateCoverageRequirements([{ ...rule, maximum: 1 }], departments), 'Informe um máximo inteiro entre o mínimo e 500 pessoas, ou deixe o campo vazio.');
  const normalized = normalizeCoverageRequirements([{ ...rule, maximum: '' }, { ...rule, id: 'r2', maximum: '3' }]);
  assert.equal(normalized[0].maximum, null);
  assert.equal(normalized[1].maximum, 3);
  const result = coverageForDay(date, [{ ...rule, minimum: 1, maximum: 2 }], data([shift(1), shift(2), shift(3)]));
  assert.equal(result.rules[0].segments[0].excess, 1);
  assert.equal(result.excessMax, 1);
});


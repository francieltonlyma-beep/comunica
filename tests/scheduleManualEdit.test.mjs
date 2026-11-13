import test from 'node:test';
import assert from 'node:assert/strict';
import { planManualScheduleEdit } from '../src/scheduleManualEdit.js';
import { coverageChangesForDates, coverageChangeError } from '../src/scheduleCoverageChange.js';

const rules = { shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', ruleGroups: [] };
const form = { status: 'Presencial', shift: 'Integral', notes: '' };
const date = '2026-11-17';
const run = (changes = {}) => planManualScheduleEdit({ targets: [{ id: 'a', name: 'Ana' }], periods: [{ startDate: date, endDate: date }], form, rules, history: [], publicationId: 'test', now: 1, actor: { name: 'Gestor' }, getDepartment: () => 'Loja', ...changes });

test('Integral salva entrada, saída e intervalo e passa na cobertura do caso relatado', () => {
  const plan = run();
  assert.equal(plan.edited[0].shiftStart, '08:00');
  assert.equal(plan.edited[0].shiftEnd, '17:00');
  assert.equal(plan.edited[0].breakMinutes, 60);
  const requirements = [{ id: 'loja', department: 'Loja', weekdays: [2], start: '08:00', end: '12:00', minimum: 1 }];
  const changes = coverageChangesForDates([date], [], plan.schedules, requirements);
  assert.equal(coverageChangeError(changes), '');
  assert.equal(changes[0].after.rules[0].unknown, 0);
});

test('respeita turno da turma e regras diferentes por dia', () => {
  const plan = run({ periods: [{ startDate: '2026-11-20', endDate: '2026-11-21' }], rules: { ...rules, shifts: [{ id: 'cedo', shiftStart: '06:00', shiftEnd: '14:00', breakStart: '10:00', breakEnd: '11:00' }], ruleGroups: [{ id: 'g', userIds: ['a'], shiftId: 'cedo', dayRules: [{ id: 'sab', kind: 'weekday', weekdays: [6], action: 'hours', shiftStart: '06:00', shiftEnd: '10:00', breakStart: '', breakEnd: '' }] }] } });
  assert.equal(plan.edited[0].shiftStart, '06:00');
  assert.equal(plan.edited[0].shiftEnd, '14:00');
  assert.equal(plan.edited[1].shiftEnd, '10:00');
  assert.equal(plan.edited[1].breakMinutes, 0);
});

test('substitui só os dias selecionados e mantém dias entre repetições', () => {
  const history = [{ id: 'old', userId: 'a', startDate: '2026-11-01', endDate: '2026-11-30', status: 'Folga', locked: true }, { id: 'other', userId: 'b', startDate: date, endDate: date, status: 'Folga' }];
  const plan = run({ history, periods: [{ startDate: date, endDate: date }, { startDate: '2026-11-24', endDate: '2026-11-24' }] });
  assert.deepEqual(plan.deletedIds, ['old']);
  assert.deepEqual(plan.schedules.filter(row => row.status === 'Folga').map(row => [row.startDate, row.endDate]), [['2026-11-01', '2026-11-16'], ['2026-11-18', '2026-11-23'], ['2026-11-25', '2026-11-30']]);
});

test('preserva jornada existente com hora extra ao mudar modalidade', () => {
  const plan = run({ history: [{ id: 'old', userId: 'a', startDate: date, endDate: date, status: 'Presencial', shiftStart: '07:00', baseShiftEnd: '15:00', shiftEnd: '16:00', extraHours: 1 }], form: { ...form, status: 'Home Office' } });
  assert.equal(plan.edited[0].baseShiftEnd, '15:00');
  assert.equal(plan.edited[0].shiftEnd, '16:00');
});

test('folga limpa horários e não aumenta desconhecidos', () => {
  const row = run({ form: { ...form, status: 'Folga' } }).edited[0];
  assert.equal(row.shiftStart, ''); assert.equal(row.shiftEnd, ''); assert.equal(row.plannedHours, 0);
});

test('turnos com nome exigem horários explícitos e validam intervalo', () => {
  assert.throws(() => run({ form: { ...form, shift: 'Manhã' } }), /entrada inválido/);
  assert.throws(() => run({ form: { ...form, shift: 'Personalizado', customShiftStart: '08:00', customShiftEnd: '12:00', customBreakStart: '13:00', customBreakEnd: '14:00' } }), /intervalo fora/);
  assert.equal(run({ form: { ...form, shift: 'Manhã', customShiftStart: '08:00', customShiftEnd: '12:00' } }).edited[0].plannedHours, 4);
});

test('erro em qualquer pessoa impede um plano parcial e sobreposições não são apagadas', () => {
  const row = { userId: 'a', startDate: date, endDate: date, status: 'Folga' };
  assert.throws(() => run({ history: [{ ...row, id: 'one' }, { ...row, id: 'two' }] }), /sobrepostas/);
  assert.throws(() => run({ rules: {} }), /entrada inválido/);
});

test('a proteção contra perda de cobertura continua bloqueando folga que cria déficit', () => {
  const history = run().edited;
  const plan = run({ history, form: { ...form, status: 'Folga' } });
  const requirements = [{ id: 'loja', department: 'Loja', weekdays: [2], start: '08:00', end: '12:00', minimum: 1 }];
  assert.match(coverageChangeError(coverageChangesForDates([date], history, plan.schedules, requirements)), /aumenta a falta/);
});

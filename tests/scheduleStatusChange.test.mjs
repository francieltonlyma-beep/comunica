import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleStatusChange } from '../src/scheduleStatusChange.js';
import { previousScheduleForDate, buildRuleSchedule } from '../src/scheduleDayRules.js';

const rules = { shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', workDaysPerWeek: 5, hoursPerWeek: 40, restEveryDays: 7, allowedWeekdays: [0,1,2,3,4,5,6], reuseLastSchedule: true };
const sunday = { key: 'a-2026-11-01', date: '2026-11-01', userId: 'a', status: 'Folga', weekHoursTarget: 40 / 7, workDaysPerWeek: 5 };
const group = { id: 'g', userIds: ['a'], dayRules: [{ id: 'sun', name: 'Domingos', kind: 'weekday', weekdays: [0], action: 'hours', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '' }] };

test('trocar folga por trabalho no domingo usa a regra do dia e não inventa saída pela meta parcial', () => {
  const result = scheduleStatusChange(sunday, 'Presencial', { ...rules, ruleGroups: [group] });
  assert.equal(result.shiftStart, '08:00'); assert.equal(result.shiftEnd, '12:00');
  assert.equal(result.breakStart, ''); assert.equal(result.breakEnd, ''); assert.equal(result.extraHours, 0);
  assert.notEqual(result.shiftEnd, '10:09');
});

test('horário de trabalho já editado e intervalo vazio são preservados ao trocar a modalidade', () => {
  const row = { ...sunday, status: 'Presencial', shiftStart: '07:00', shiftEnd: '11:00', breakStart: '', breakEnd: '', breakMinutes: 0, extraHours: 0.5 };
  const result = scheduleStatusChange(row, 'Home Office', rules);
  assert.equal(result.shiftStart, '07:00'); assert.equal(result.shiftEnd, '11:00'); assert.equal(result.breakStart, ''); assert.equal(result.extraHours, 0.5);
});

test('folga distribuída guarda o turno original para uma futura volta ao trabalho', () => {
  const template = { status: 'Presencial', shiftStart: '06:00', shiftEnd: '14:00', breakStart: '10:00', breakEnd: '11:00', breakMinutes: 60 };
  const result = scheduleStatusChange({ ...sunday, workTemplate: template }, 'Presencial', rules);
  assert.equal(result.shiftStart, '06:00'); assert.equal(result.shiftEnd, '14:00'); assert.equal(result.breakMinutes, 60);
});

test('histórico reaproveita o mesmo dia da semana e nunca a última jornada de sábado no domingo', () => {
  const history = [
    { id: 'sun', userId: 'a', startDate: '2026-10-25', endDate: '2026-10-25', status: 'Presencial', shiftStart: '09:00', baseShiftEnd: '15:00', shiftEnd: '17:00', extraHours: 2 },
    { id: 'sat', userId: 'a', startDate: '2026-10-31', endDate: '2026-10-31', status: 'Presencial', shiftStart: '07:00', shiftEnd: '11:00' },
  ];
  assert.equal(previousScheduleForDate('a', sunday.date, history).id, 'sun');
  assert.equal(previousScheduleForDate('a', '2026-11-02', history), null);
  const result = scheduleStatusChange(sunday, 'Presencial', rules, history);
  assert.equal(result.shiftStart, '09:00'); assert.equal(result.shiftEnd, '15:00'); assert.equal(result.extraHours, 0);
});

test('reutilização limita o histórico ao período anterior e reconhece blocos de vários dias', () => {
  const history = [{ id: 'week', userId: 'a', startDate: '2026-10-26', endDate: '2026-11-10', status: 'Presencial', shiftStart: '09:00', shiftEnd: '17:00' }];
  assert.equal(previousScheduleForDate('a', '2026-11-08', history, '2026-11-02').id, 'week');
  assert.equal(previousScheduleForDate('a', '2026-11-01', [{ ...history[0], startDate: '2026-11-02' }]), null);
});

test('regras conflitantes no domingo exigem preencher horário em vez de escolher um arbitrariamente', () => {
  const conflicting = { ...group, dayRules: [...group.dayRules, { ...group.dayRules[0], id: 'second', name: 'Outro domingo', shiftEnd: '13:00' }] };
  const result = scheduleStatusChange(sunday, 'Presencial', { ...rules, ruleGroups: [conflicting] });
  assert.equal(result.shiftStart, ''); assert.equal(result.shiftEnd, '');
});

test('geração mantém jornada própria de domingo e seu modelo mesmo em período de um só dia', () => {
  const rows = buildRuleSchedule({ dates: [sunday.date], users: [{ id: 'a', name: 'Ana' }], rules: { ...rules, ruleGroups: [{ ...group, dayRules: [{ ...group.dayRules[0], action: 'work' }] }] }, holidays: [] });
  assert.equal(rows[0].shiftStart, '08:00'); assert.equal(rows[0].shiftEnd, '12:00');
  assert.equal(rows[0].workTemplate.shiftEnd, '12:00');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarRecordsForDay, scheduleCalendarDates, shiftCalendarPeriod } from '../src/scheduleCalendarModel.js';

test('mês completa semanas e inclui fevereiro bissexto', () => {
  const dates = scheduleCalendarDates('2024-02-29');
  assert.equal(dates[0], '2024-01-28');
  assert.equal(dates.at(-1), '2024-03-02');
  assert.ok(dates.includes('2024-02-29'));
  assert.equal(dates.length % 7, 0);
});

test('navegação mensal não pula fevereiro e semana atravessa o ano', () => {
  assert.equal(shiftCalendarPeriod('2026-01-31', 1, 'month'), '2026-02-01');
  assert.equal(shiftCalendarPeriod('2026-12-31', 1, 'month'), '2027-01-01');
  assert.deepEqual(scheduleCalendarDates('2026-12-31', 'week'), [
    '2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02',
  ]);
});

const data = {
  employees: [{ id: 1, name: 'João', role: 'Operador', depts: ['caixa', 'apoio'] }, { id: 2, name: 'Maria', role: 'Gerente', depts: ['loja'] }],
  schedules: [
    { id: 'one', userId: 1, userName: 'João', startDate: '2026-10-22', endDate: '2026-10-24', status: 'Presencial' },
    { id: 'two', userId: 2, userName: 'Maria', startDate: '2026-10-23', endDate: '2026-10-23', status: 'Folga' },
  ],
  absences: [
    { id: 'a', userId: 1, userName: 'João', startDate: '2026-10-23', endDate: '2026-10-24', reason: 'Consulta' },
    { id: 'duplicate', userId: 1, userName: 'João', startDate: '2026-10-23', endDate: '2026-10-24', reason: 'Consulta' },
    { id: 'legacy', userId: 2, userName: 'Maria', date: '2026-10-23', reason: 'Consulta' },
  ],
  events: [{ id: 'event', title: 'Feriado', date: '2026-10-23' }],
};

test('dia inclui limites do período e elimina ausências duplicadas', () => {
  assert.equal(calendarRecordsForDay('2026-10-22', data).schedules.length, 1);
  assert.equal(calendarRecordsForDay('2026-10-24', data).schedules.length, 1);
  assert.equal(calendarRecordsForDay('2026-10-25', data).schedules.length, 0);
  assert.equal(calendarRecordsForDay('2026-10-23', data).absences.length, 2);
});

test('filtros combinam setor secundário, id e nome sem acentos', () => {
  const result = calendarRecordsForDay('2026-10-23', data, { department: 'apoio', employee: '1', search: 'joao', status: 'Presencial' });
  assert.equal(result.schedules[0].id, 'one');
  assert.equal(result.absences.length, 1);
  assert.equal(result.events.length, 1); // Eventos gerais não pertencem a um colaborador.
  assert.equal(calendarRecordsForDay('2026-10-23', data, { department: 'apoio', status: 'Folga' }).schedules.length, 0);
});

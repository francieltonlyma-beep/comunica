import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarRecordsForDay, scheduleCalendarDates } from '../src/scheduleCalendarModel.js';
import { teamDaySummary, teamMonthRows } from '../src/scheduleTeamMonth.js';
const employees = [{ id: 1, name: 'João Costa', role: 'Operador', depts: ['op'] }, { id: '2', name: 'Maria Lima', depts: ['apoio'] }, { id: '3', name: 'Ana Costa', depts: ['op'] }];
const schedules = [
  { id: 'work', userId: '1', userName: 'João Costa', dept: 'op', startDate: '2024-02-01', endDate: '2024-02-29', status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', locked: true },
  { id: 'off', userId: 2, userName: 'Maria Lima', dept: 'op', startDate: '2024-02-03', endDate: '2024-02-03', status: 'Folga' },
  { id: 'old', userId: 'removed', userName: 'Antigo Cadastro', dept: 'op', date: '2024-02-01', status: 'Home Office' },
];
const data = { employees, schedules, absences: [] };
const build = (filters = {}, absences = [], showAbsences = true) => {
  const days = scheduleCalendarDates('2024-02-01').filter(date => date.startsWith('2024-02')).map(date => calendarRecordsForDay(date, { ...data, absences }, filters));
  return teamMonthRows(days, employees, { filters, showAbsences });
};

test('equipe mensal inclui todo fevereiro bissexto e pessoas sem marcação', () => {
  const rows = build();
  assert.equal(rows.length, 4); assert.equal(rows[0].name, 'Ana Costa');
  for (const row of rows) assert.equal(row.cells.length, 29);
  assert.equal(teamDaySummary(rows.find(row => row.userId === '3').cells[0]).code, '—');
  assert.equal(teamDaySummary(rows.find(row => row.userId === '2').cells[2]).code, 'F');
  assert.equal(rows.find(row => row.userId === 'removed').name, 'Antigo Cadastro');
  assert.equal(teamDaySummary(rows.find(row => row.userId === '1').cells[28]).fixed, true);
});

test('setor atribuído na marcação não desaparece por ter vínculo em outro setor', () => {
  const rows = build({ department: 'op' });
  assert.ok(rows.some(row => row.userId === '2'));
  assert.equal(build({ department: 'apoio' }).find(row => row.userId === '2').cells[2].schedules.length, 1);
  assert.deepEqual(build({ search: 'joao' }).map(row => row.userId), ['1']);
  assert.deepEqual(build({ employee: '2' }).map(row => row.userId), ['2']);
  assert.deepEqual(build({ status: 'Folga' }).map(row => row.userId), ['2']);
});

test('ausência integral e férias são visíveis sem transformar dia vazio em folga', () => {
  const absences = [{ id: 'leave', userId: '1', date: '2024-02-01', reason: 'Férias' }, { id: 'partial', userId: '1', date: '2024-02-02', reason: 'Consulta', startTime: '10:00', endTime: '11:00' }, { id: 'solo', userId: '3', date: '2024-02-01', reason: 'Consulta', startTime: '10:00', endTime: '11:00' }];
  const cells = build({}, absences).find(row => row.userId === '1').cells;
  assert.equal(teamDaySummary(cells[0]).code, 'V'); assert.equal(teamDaySummary(cells[0]).hours, '');
  assert.match(teamDaySummary(cells[0]).description, /Presencial.*Férias/);
  assert.equal(teamDaySummary(cells[1]).code, 'P'); assert.equal(teamDaySummary(cells[1]).partial, true);
  assert.equal(teamDaySummary(build({}, absences).find(row => row.userId === '3').cells[0]).tone, 'absence');
  assert.equal(teamDaySummary(build({}, absences, false).find(row => row.userId === '1').cells[0]).code, 'P');
});

test('múltiplos registros são informados, horários e feriado não são ocultados', () => {
  const cell = { date: '2024-02-01', schedules: [schedules[0], { ...schedules[0], id: 'second', shiftStart: '18:00' }], absences: [] };
  assert.equal(teamDaySummary(cell).code, '2 reg.'); assert.equal(teamDaySummary(cell).hours, '');
  assert.match(teamDaySummary(cell).description, /18:00/);
  assert.equal(teamDaySummary({ ...cell, schedules: [{ status: 'Feriado' }] }).code, 'FE');
  assert.equal(teamDaySummary({ ...cell, schedules: [schedules[0]] }).hours, '08:00–17:00');
  assert.equal(teamDaySummary({ ...cell, schedules: [{ ...schedules[0], status: 'Folga' }] }).hours, '');
});

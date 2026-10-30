import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarRecordsForDay, scheduleCalendarDates } from '../src/scheduleCalendarModel.js';
import { nextTeamCoverageDate, teamCoverageSummary, teamDaySummary, teamMonthRows } from '../src/scheduleTeamMonth.js';
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

test('filtro de escalados mostra somente pessoas com marcação publicada no mês', () => {
  const days = scheduleCalendarDates('2024-02-01').filter(date => date.startsWith('2024-02')).map(date => calendarRecordsForDay(date, data));
  const rows = teamMonthRows(days, employees, { onlyScheduled: true });
  assert.deepEqual(rows.map(row => row.userId), ['removed', '1', '2']);
  const absenceOnly = [{ id: 'absence', userId: '3', date: '2024-02-01', reason: 'Consulta' }];
  const withAbsence = days.map(day => calendarRecordsForDay(day.date, { ...data, absences: absenceOnly }));
  assert.equal(teamMonthRows(withAbsence, employees, { onlyScheduled: true }).some(row => row.userId === '3'), false);
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


const requirement = (changes = {}) => ({ id: 'r', department: 'op', minimum: 4, unknown: 0,
  segments: [{ start: '08:00', end: '12:00', available: 3, missing: 1 }], ...changes });
const coverage = (rules, status = 'shortage') => ({ rules, status });

test('resumo mensal mostra um intervalo real e explica setores e déficits sem somar equipes', () => {
  const summary = teamCoverageSummary(coverage([
    requirement(), requirement({ id: 'r2', department: 'adm', minimum: 2, segments: [{ start: '13:00', end: '17:00', available: 0, missing: 2 }] }),
  ]), [{ id: 'op', name: 'Operação' }]);
  assert.equal(summary.code, '0/2'); assert.equal(summary.department, 'adm');
  assert.equal(summary.tone, 'shortage'); assert.equal(summary.actionable, true);
  assert.match(summary.details, /Operação: 08:00–12:00: 3 disponível.*mínimo 4; faltam 1/);
  assert.match(summary.details, /adm: 13:00–17:00: 0 disponível.*mínimo 2; faltam 2/);
});

test('intervalos que se alternam não viram cobertura simultânea no resumo', () => {
  const summary = teamCoverageSummary(coverage([requirement({ minimum: 2, segments: [
    { start: '08:00', end: '12:00', available: 1, missing: 1 },
    { start: '12:00', end: '18:00', available: 1, missing: 1 },
  ] })]));
  assert.equal(summary.code, '1/2'); assert.equal(summary.tone, 'shortage');
});

test('cobertura incompleta, excesso e dados indisponíveis não aparecem como OK', () => {
  const unknown = teamCoverageSummary(coverage([requirement({ unknown: 1 })], 'unknown'));
  assert.equal(unknown.tone, 'unknown'); assert.match(unknown.details, /horário ou intervalo incompleto/);
  const excess = teamCoverageSummary(coverage([requirement({ minimum: 2, maximum: 3, segments: [
    { start: '08:00', end: '10:00', available: 2, missing: 0, excess: 0 },
    { start: '10:00', end: '12:00', available: 4, missing: 0, excess: 1 },
  ] })], 'sufficient'));
  assert.equal(excess.tone, 'excess'); assert.equal(excess.code, '4/2'); assert.match(excess.details, /máximo 3; excesso de 1/);
  for (const options of [{ ready: false }, { error: 'Falha de conexão' }]) {
    const summary = teamCoverageSummary(coverage([requirement()]), [], options);
    assert.equal(summary.code, '?'); assert.equal(summary.actionable, false); assert.equal(summary.details, '');
  }
  const empty = teamCoverageSummary(coverage([], 'none'));
  assert.equal(empty.code, '—'); assert.equal(empty.actionable, false);
});

test('próxima pendência percorre dias com falta, dados incompletos ou excesso e volta ao início', () => {
  const make = (date, rules, status) => ({ date, coverage: coverage(rules, status) });
  const days = [
    make('2026-11-01', [], 'none'),
    make('2026-11-02', [requirement()], 'shortage'),
    make('2026-11-03', [requirement({ unknown: 1 })], 'unknown'),
    make('2026-11-04', [requirement({ minimum: 1, segments: [{ start: '08:00', end: '12:00', available: 1, missing: 0 }] })], 'sufficient'),
  ];
  assert.equal(nextTeamCoverageDate(days, '2026-11-01'), '2026-11-02');
  assert.equal(nextTeamCoverageDate(days, '2026-11-02'), '2026-11-03');
  assert.equal(nextTeamCoverageDate(days, '2026-11-03'), '2026-11-02');
  assert.equal(nextTeamCoverageDate([days[0], days[3]], '2026-11-01'), '');
});

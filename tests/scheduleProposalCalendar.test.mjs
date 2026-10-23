import test from 'node:test';
import assert from 'node:assert/strict';
import { proposalCalendarDays } from '../src/scheduleProposalCalendar.js';

const rows = [
  { userId: '1', date: '2026-11-01', status: 'Folga', locked: true },
  { userId: 2, date: '2026-11-01', status: 'Home Office', holiday: true },
  { userId: '3', date: '2026-11-01', status: 'Férias', preservedAbsence: true },
  { userId: '1', date: '2026-10-31', status: 'Presencial', ruleApplied: true },
];

test('prévia ordena meses, separa ausência de folga e sinaliza dias preservados', () => {
  const days = proposalCalendarDays(rows);
  assert.deepEqual(days.map(day => day.date), ['2026-10-31', '2026-11-01']);
  const day = days[1];
  assert.equal(day.working, 1); assert.equal(day.off, 1); assert.equal(day.absent, 1);
  assert.equal(day.fixed, 2); assert.equal(day.holiday, true); assert.equal(day.coverage, 'none');
  assert.equal(days[0].fixed, 1);
});

test('filtro de pessoa preserva as datas e a cobertura global do setor', () => {
  const coverage = [{ date: '2026-11-01', rules: [{ unknown: 0, segments: [{ missing: 1 }] }] }];
  const days = proposalCalendarDays(rows, coverage, [], '2');
  assert.equal(days[0].rows.length, 0);
  assert.equal(days[1].rows.length, 1); assert.equal(days[1].working, 1);
  assert.equal(days[1].off, 0); assert.equal(days[1].coverage, 'gap');
});

test('distingue cobertura atendida de dados incompletos e conta bloqueios por data', () => {
  const coverage = [
    { date: '2026-10-31', rules: [{ unknown: 1, segments: [{ missing: 0 }] }] },
    { date: '2026-11-01', rules: [{ unknown: 0, segments: [{ missing: 0 }] }] },
  ];
  const issues = [{ date: '2026-11-01', blocking: true }, { date: '2026-11-01', blocking: false }];
  const days = proposalCalendarDays(rows, coverage, issues);
  assert.equal(days[0].coverage, 'unknown'); assert.equal(days[1].coverage, 'covered');
  assert.equal(days[0].blocking, 0); assert.equal(days[1].blocking, 1);
  assert.deepEqual(proposalCalendarDays([]), []);
});

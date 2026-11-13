import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleOperationIssue, scheduleOperationDraft } from '../src/scheduleOperationIssue.js';
import { coverageRequirementsForDate, normalizeCoverageRequirements, validateCoverageRequirements } from '../src/scheduleCoverage.js';

const sunday = '2026-11-15', holiday = '2026-11-20';
const weekly = { id: 'week', department: 'op', weekdays: [1,2,3,4,5,6], start: '08:00', end: '18:00', minimum: 2 };
const row = (date, changes = {}) => ({ userId: 'a', dept: 'op', startDate: date, endDate: date, status: 'Presencial', ...changes });
const events = [{ date: holiday, type: 'Feriado' }];

test('identifica data e setor exatos sem confundir funcionamento ausente com fechamento', () => {
  assert.deepEqual(scheduleOperationIssue([row(sunday)], [weekly]), { date: sunday, department: 'op', closed: false });
  const closed = { id: 'closed', department: 'op', weekdays: [0], closed: true };
  assert.deepEqual(scheduleOperationIssue([row(sunday)], [weekly, closed]), { date: sunday, department: 'op', closed: true });
  assert.equal(scheduleOperationIssue([row(sunday, { status: 'Folga' })], [closed]), null);
});

test('domingos abertos por regra semanal e exceções de feriado permitem marcação manual', () => {
  assert.equal(scheduleOperationIssue([row(sunday)], [{ ...weekly, weekdays: [0] }]), null);
  assert.deepEqual(scheduleOperationIssue([row(holiday)], [weekly], { events }), { date: holiday, department: 'op', closed: false });
  assert.equal(scheduleOperationIssue([row(holiday)], [weekly, { ...weekly, id: 'exception', date: holiday, weekdays: [] }], { events }), null);
});

test('abrir uma data mantém o fechamento dos outros domingos e não inventa horários ou mínimo', () => {
  const closed = { id: 'sundays', department: 'op', weekdays: [0], closed: true };
  const draft = scheduleOperationDraft({ date: sunday, department: 'op', closed: true }, [closed]);
  assert.equal(draft.id, ''); assert.equal(draft.scope, 'date'); assert.equal(draft.start, ''); assert.equal(draft.minimum, '');
  const open = normalizeCoverageRequirements([{ ...draft, id: 'new', start: '08:00', end: '12:00', minimum: 2 }])[0];
  const requirements = [closed, open];
  assert.equal(validateCoverageRequirements(requirements, [{ id: 'op' }]), '');
  assert.equal(scheduleOperationIssue([row(sunday)], requirements), null);
  assert.equal(coverageRequirementsForDate('2026-11-22', requirements, 'op')[0].closed, true);
});

test('exceção fechada é editada pelo mesmo id sem criar regra aberta e fechada na mesma data', () => {
  const closed = { id: 'closed-date', department: 'op', date: holiday, weekdays: [], closed: true };
  const other = { ...weekly, id: 'other-sector', department: 'admin' };
  const draft = scheduleOperationDraft({ date: holiday, department: 'op', closed: true }, [weekly, closed, other]);
  assert.equal(draft.id, closed.id);
  const open = normalizeCoverageRequirements([{ ...draft, start: '08:00', end: '12:00', minimum: 2 }])[0];
  const next = [weekly, closed, other].map(rule => rule.id === open.id ? open : rule);
  assert.equal(validateCoverageRequirements(next, [{ id: 'op' }, { id: 'admin' }]), '');
  assert.equal(scheduleOperationIssue([row(holiday)], next, { events }), null);
  assert.deepEqual(next[2], other);
});

test('aponta a primeira ocorrência bloqueada sem alterar regras ou gravações', () => {
  const rows = [row('2026-11-16'), row(sunday, { dept: 'admin' }), row(holiday)];
  const requirements = [weekly, { ...weekly, id: 'admin', department: 'admin', weekdays: [0] }];
  const before = structuredClone(requirements);
  assert.equal(scheduleOperationIssue(rows, requirements, { events }).date, holiday);
  assert.deepEqual(requirements, before);
});

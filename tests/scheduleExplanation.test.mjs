import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDayRules, buildRuleSchedule, scheduleRuleIssues, shiftDate } from '../src/scheduleDayRules.js';
import { appendScheduleTrace, initialScheduleTrace, explainScheduleRecord, canReviewScheduleOrigin, SCHEDULE_TRACE_LIMIT } from '../src/scheduleExplanation.js';
import { prepareScheduleProposal, optimizeScheduleCoverage, planSchedulePublication } from '../src/scheduleOptimizer.js';
import { planPublishedDayEdit } from '../src/publishedScheduleEdit.js';
import { packScheduleDraft, unpackScheduleDraft } from '../src/scheduleDrafts.js';

const base = { status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', breakMinutes: 60 };
const rule = (id, changes = {}) => ({ id, name: id, kind: 'weekday', weekdays: [0], action: 'work', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '', userIds: [], priority: 0, enabled: true, ...changes });
const group = dayRules => ({ id: 'g', name: 'Turma A', userIds: ['u'], dayRules });

test('origem registra a data vencedora e a regra individual substituída sem alterar a entrada', () => {
  const g = group([rule('recorrente'), rule('individual', { userIds: ['u'], action: 'rest' }), rule('data', { kind: 'date', startDate: '2026-11-01', endDate: '2026-11-01' })]);
  const before = JSON.stringify(g);
  const result = resolveDayRules(g, '2026-11-01', false, 'u', base);
  assert.equal(result.status, 'Presencial');
  assert.equal(JSON.stringify(g), before);
  const trace = explainScheduleRecord(result);
  assert.equal(trace.missing, false);
  assert.equal(trace.changed, false);
  assert.equal(trace.entries.find(e => e.ruleId === 'data').decision, 'applied');
  assert.equal(trace.entries.find(e => e.ruleId === 'individual').decision, 'superseded');
});

test('empate incompatível permanece impeditivo e as duas regras aparecem como conflito', () => {
  const result = resolveDayRules(group([rule('trabalho'), rule('folga', { action: 'rest' })]), '2026-11-01', false, 'u', base);
  assert.deepEqual(explainScheduleRecord(result).entries.filter(e => e.decision === 'conflict').map(e => e.ruleId), ['trabalho', 'folga']);
  assert.ok(scheduleRuleIssues([{ ...result, key: 'u-date', userId: 'u', userName: 'Ana', date: '2026-11-01' }]).some(i => i.code === 'rule-conflict' && i.blocking));
});

test('regra apenas de horário em folga é explicada como sem efeito', () => {
  const result = resolveDayRules(group([rule('horario', { action: 'hours' })]), '2026-11-01', false, 'u', { ...base, status: 'Folga' });
  const entry = explainScheduleRecord(result).entries.find(e => e.ruleId === 'horario');
  assert.equal(entry.decision, 'ignored');
  assert.match(entry.detail, /Sem efeito/);
  assert.equal(result.status, 'Folga');
});

test('atribuição individual de feriado fica registrada depois da regra por data', () => {
  const rows = buildRuleSchedule({ dates: ['2026-11-01'], users: [{ id: 'u', name: 'Ana' }], holidays: ['2026-11-01'],
    getDepartment: () => 'a',
    rules: { ...base, version: 7, workDaysPerWeek: 5, restEveryDays: 7, hoursPerWeek: 40, allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      ruleGroups: [group([rule('data', { kind: 'date', startDate: '2026-11-01', endDate: '2026-11-01', action: 'rest' })])],
      holidayAssignments: { '2026-11-01': { u: { ...base, shiftEnd: '12:00', breakStart: '', breakEnd: '' } } } } });
  const explanation = explainScheduleRecord(rows[0]);
  assert.equal(explanation.entries.at(-1).source, 'holiday-assignment');
  assert.equal(explanation.entries.at(-1).decision, 'applied');
  assert.equal(explanation.changed, false);
  assert.equal(rows[0].rulesVersion, 7);
});

test('ausência integral vence a geração; histórico antigo não recebe origem inventada', () => {
  const row = { ...base, key: 'u-2026-11-02', userId: 'u', date: '2026-11-02', ruleTrace: initialScheduleTrace(base) };
  const absent = prepareScheduleProposal([row], { absences: [{ userId: 'u', date: row.date, reason: 'Férias' }] })[0];
  assert.equal(absent.status, 'Férias');
  assert.equal(explainScheduleRecord(absent).entries.at(-1).source, 'absence');
  const old = prepareScheduleProposal([row], { history: [{ ...base, id: 'old', userId: 'u', startDate: row.date, endDate: row.date }] })[0];
  assert.equal(explainScheduleRecord(old).missing, true);
  assert.equal(explainScheduleRecord(old).entries.some(e => e.source === 'base'), false);
  assert.equal(row.ruleTrace.entries.length, 1);
});

test('otimização aceita registra a transferência nos dois dias e preserva o original', () => {
  const start = '2026-11-02';
  const rows = Array.from({ length: 7 }, (_, index) => {
    const working = ![1, 6].includes(index);
    const row = { ...base, status: working ? 'Presencial' : 'Folga', key: 'u-' + index, date: shiftDate(start, index),
      userId: 'u', userName: 'Ana', dept: 'a', weekKey: start, extraHours: 0, restEveryDays: 7, workDaysPerWeek: 5, weekHoursTarget: 40 };
    return { ...row, ruleTrace: initialScheduleTrace(row) };
  });
  const optimized = optimizeScheduleCoverage(rows, [{ id: 'need', department: 'a', start: '08:00', end: '12:00', minimum: 1, weekdays: [2] }],
    { employees: [{ id: 'u', depts: ['a'] }], history: [], absences: [] });
  assert.ok(optimized.swaps > 0);
  const changed = optimized.rows.filter(row => row.coverageAdjusted);
  assert.equal(changed.length, 2);
  assert.ok(changed.every(row => explainScheduleRecord(row).entries.at(-1).source === 'coverage'));
  assert.ok(changed.every(row => !explainScheduleRecord(row).changed));
  assert.ok(rows.every(row => row.ruleTrace.entries.length === 1));
});

test('edição publicada registra somente o dia alterado e conserva origem nos extremos', () => {
  const source = { ...base, id: 's', userId: 'u', userName: 'Ana', dept: 'a', startDate: '2026-11-02', endDate: '2026-11-04',
    autoGenerated: true, ruleTrace: initialScheduleTrace(base) };
  const plan = planPublishedDayEdit(source, { ...base, shiftStart: '09:00', extraHours: 0, reason: 'Entrada autorizada' }, '2026-11-03',
    { publicationId: 'p', actor: { id: 'manager', name: 'Gestor A' }, now: 1, history: [source], rules: {} });
  const edited = plan.schedules.find(row => row.startDate === '2026-11-03');
  assert.equal(explainScheduleRecord(edited).entries.at(-1).source, 'manual');
  assert.match(explainScheduleRecord(edited).entries.at(-1).detail, /Gestor A.*Entrada autorizada/);
  assert.equal(explainScheduleRecord(edited).changed, false);
  assert.ok(plan.schedules.filter(row => row !== edited).every(row => row.ruleTrace.entries.length === 1));
  assert.equal(source.ruleTrace.entries.length, 1);
});

test('rascunho e publicação conservam a origem mesmo depois da configuração mudar', async () => {
  const row = { ...base, userId: 'u', userName: 'Ana', dept: 'a', key: 'u-date', date: '2026-11-02', rulesVersion: 2, ruleTrace: initialScheduleTrace(base, 'Turno antigo') };
  const draft = { rows: [row], bulk: { userIds: ['u'] }, proposalInput: 'version-2', rules: { version: 2 } };
  const packed = await packScheduleDraft(draft);
  const restored = await unpackScheduleDraft({ revision: 'r', partCount: packed.parts.length, encoding: packed.encoding },
    packed.parts.map(payload => ({ payload, revision: 'r' })));
  assert.deepEqual(restored.rows[0].ruleTrace, row.ruleTrace);
  const published = planSchedulePublication([row], [], [{ ...row, id: 's', startDate: row.date, endDate: row.date }], 'p');
  assert.deepEqual(published.records[0].data.ruleTrace, row.ruleTrace);
  assert.match(explainScheduleRecord(published.schedules[0]).entries[0].detail, /Turno antigo/);
});

test('origem tem tamanho limitado e informa etapas omitidas e alterações sem rastreio', () => {
  let row = { ...base, ruleTrace: initialScheduleTrace(base) };
  for (let i = 0; i < 80; i++) row = { ...row, ruleTrace: appendScheduleTrace(row, { source: 'manual', label: 'Edição ' + i }) };
  assert.equal(row.ruleTrace.entries.length, SCHEDULE_TRACE_LIMIT);
  assert.equal(explainScheduleRecord(row).omitted, 81 - SCHEDULE_TRACE_LIMIT);
  assert.equal(explainScheduleRecord({ ...row, shiftStart: '09:00' }).changed, true);
  assert.equal(explainScheduleRecord({ ...base, ruleReason: 'Motivo antigo' }).missing, true);
});

test('atalho recusa colaborador ou setor fora do vínculo inclusive em pessoa com dois setores', () => {
  const scope = { employeeIds: ['u'], departmentIds: ['a'], allDepartments: false };
  assert.equal(canReviewScheduleOrigin({ userId: 'u', dept: 'a' }, scope, false), false);
  assert.equal(canReviewScheduleOrigin({ userId: 'u', dept: 'a' }, scope, true), true);
  assert.equal(canReviewScheduleOrigin({ userId: 'u', dept: 'b' }, scope, true), false);
  assert.equal(canReviewScheduleOrigin({ userId: 'other', dept: 'a' }, scope, true), false);
  assert.equal(canReviewScheduleOrigin({ userId: 'u' }, scope, true), false);
  assert.equal(canReviewScheduleOrigin({ userId: 'u', dept: 'b' }, { ...scope, allDepartments: true }, true), true);
});


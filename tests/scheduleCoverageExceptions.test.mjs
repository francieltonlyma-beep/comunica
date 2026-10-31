import { planPublishedDayEdit } from '../src/publishedScheduleEdit.js';
import { planPublishedScheduleSwap } from '../src/publishedScheduleSwap.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageForDay, normalizeCoverageRequirements, validateCoverageRequirements } from '../src/scheduleCoverage.js';
import { mergeCoverageRequirements } from '../functions/src/scheduleCoverageCore.mjs';
import { buildCoverageApproval } from '../src/scheduleCoverageApproval.js';
import { buildRuleSchedule } from '../src/scheduleDayRules.js';
import { analyzeProposalCoverage, optimizeScheduleCoverage } from '../src/scheduleOptimizer.js';
import { teamCoverageSummary } from '../src/scheduleTeamMonth.js';

const date = '2026-11-02';
const rule = { id: 'weekly', department: 'op', weekdays: [1,2,3,4,5], start: '08:00', end: '12:00', minimum: 4, includeRemote: false };
const special = { ...rule, id: 'special', date, weekdays: [], minimum: 2 };
const closed = { id: 'closed', department: 'op', date, weekdays: [], closed: true };
const shift = (userId, change = {}) => ({ id: userId, userId, dept: 'op', date, status: 'Presencial', shiftStart: '08:00', shiftEnd: '12:00', ...change });
const departments = [{ id: 'op' }, { id: 'adm' }];

test('exceção substitui todas as faixas semanais somente da data e setor selecionados', () => {
  const requirements = [rule, { ...rule, id: 'afternoon', start: '14:00', end: '18:00' }, special, { ...rule, id: 'adm', department: 'adm' }];
  const result = coverageForDay(date, requirements, { schedules: [shift('1'), shift('2')] });
  assert.deepEqual(result.rules.map(item => item.id), ['special', 'adm']);
  assert.equal(result.rules[0].status, 'sufficient');
  assert.equal(coverageForDay('2026-11-03', requirements, {}).rules.filter(item => item.department === 'op').length, 2);
  assert.deepEqual(coverageForDay(date, requirements, {}, 'adm').rules.map(item => item.id), ['adm']);
});

test('domingos e feriados exigem decisão explícita; feriado não herda abertura semanal', () => {
  const sunday = coverageForDay('2026-11-01', [rule], {});
  assert.equal(sunday.status, 'unknown'); assert.equal(sunday.rules[0].configurationMissing, true);
  const events = [{ date, title: 'Feriado de Finados' }];
  assert.equal(coverageForDay(date, [rule], { events }).status, 'unknown');
  assert.equal(coverageForDay(date, [rule, special], { events, schedules: [shift('1'), shift('2')] }).status, 'sufficient');
  const weeklyClosed = { ...closed, date: '', weekdays: [0] };
  assert.equal(coverageForDay('2026-11-01', [rule, weeklyClosed], {}).status, 'closed');
  assert.equal(coverageForDay(date, [rule, closed], { events }).status, 'closed');
});

test('fechamento remove exigência, mas não oculta marcação de trabalho nem turno noturno anterior', () => {
  assert.equal(coverageForDay(date, [closed], {}).status, 'closed');
  for (const schedules of [[shift('1')], [shift('1', { date: '2026-11-01', shiftStart: '22:00', shiftEnd: '06:00' })]]) {
    const result = coverageForDay(date, [closed], { schedules });
    assert.equal(result.status, 'unknown'); assert.equal(result.rules[0].closedConflict, true);
    assert.equal(teamCoverageSummary(result).actionable, true);
  }
  assert.equal(teamCoverageSummary(coverageForDay(date, [closed], {})).code, 'Fech.');
});

test('valida datas civis reais e conflitos entre aberto e fechado, preservando regras antigas', () => {
  assert.equal(validateCoverageRequirements(normalizeCoverageRequirements([rule]), departments), '');
  assert.equal(validateCoverageRequirements(normalizeCoverageRequirements([rule, closed]), departments), '');
  assert.match(validateCoverageRequirements(normalizeCoverageRequirements([special, closed]), departments), /fechado/);
  assert.match(validateCoverageRequirements(normalizeCoverageRequirements([{ ...special, date: '2026-02-30' }]), departments), /data válida/);
  assert.match(validateCoverageRequirements(normalizeCoverageRequirements([rule, { ...closed, date: '', weekdays: [1] }]), departments), /fechado/);
  assert.equal(normalizeCoverageRequirements([closed])[0].minimum, 0);
});

test('mesclagem autorizada preserva outros setores e recusa IDs duplicados ou setor fora do vínculo', () => {
  const scope = { allDepartments: false, departmentIds: ['op'] };
  const adminRule = { ...rule, id: 'adm-rule', department: 'adm' };
  const merged = mergeCoverageRequirements([rule, adminRule], [special], departments, scope);
  assert.deepEqual(merged.map(item => item.id), ['adm-rule', 'special']);
  assert.throws(() => mergeCoverageRequirements([adminRule], [adminRule], departments, scope), /apenas os setores/);
  assert.throws(() => mergeCoverageRequirements([adminRule], [{ ...special, id: 'adm-rule' }], departments, scope), /única/);
  assert.throws(() => mergeCoverageRequirements([], [special], departments, { allDepartments: false, departmentIds: [] }), /apenas os setores/);
});

const analysis = { unknown: 0, days: [{ date, rules: [{ ...special, unknown: 0, segments: [{ start: '08:00', end: '12:00', available: 1, missing: 1 }] }] }] };
const approval = changes => buildCoverageApproval({ analysis, actor: { id: 'admin', name: 'Elton', isAdmin: true }, reason: 'Equipe reduzida, com atendimento priorizado.', binding: 'current', expectedBinding: 'current', snapshotHash: 'hash', publicationId: 'pub', rulesVersion: 7, ...changes });
test('autorização registra responsável, motivo, versão e faixas exatas sem remover o déficit', () => {
  const audit = approval();
  assert.equal(audit.actorId, 'admin'); assert.equal(audit.rulesVersion, 7);
  assert.equal(audit.gaps[0].available, 1); assert.equal(audit.gaps[0].missing, 1);
  assert.deepEqual(audit.departmentIds, ['op']);
  assert.equal(analysis.days[0].rules[0].segments[0].missing, 1);
});
test('autorização recusa perfil comum, justificativa curta, revisão antiga e dados incompletos', () => {
  assert.throws(() => approval({ actor: { id: 'manager' } }), /administradores/);
  assert.throws(() => approval({ reason: 'ok' }), /justificativa/);
  assert.throws(() => approval({ binding: 'old' }), /simulação mudou/);
  assert.throws(() => approval({ analysis: { ...analysis, unknown: 1 } }), /horários incompletos/);
  assert.throws(() => approval({ analysis: { unknown: 0, days: [{ date, rules: [{ ...closed, configurationMissing: true, segments: [] }] }] } }), /funcionamento/);
});

const baseRules = { allowedWeekdays: [0,1,2,3,4,5,6], shiftStart: '08:00', shiftEnd: '12:00', breakStart: '', breakEnd: '', hoursPerWeek: 20, workDaysPerWeek: 5, restEveryDays: 7, holidaysCountAsRest: true, ruleGroups: [], coverageRequirements: [rule, closed] };
test('geração mantém setor fechado em folga e prévia usa a mesma exceção do calendário', () => {
  const rows = buildRuleSchedule({ dates: [date], users: [{ id: '1', name: 'Ana' }], rules: baseRules, holidays: [date], getDepartment: () => 'op' });
  assert.equal(rows[0].status, 'Folga'); assert.equal(rows[0].pinned, true);
  assert.equal(analyzeProposalCoverage(rows, [rule, closed], { events: [{ date, type: 'Feriado' }] }).days[0].status, 'closed');
});
test('feriado aberto permite redistribuir trabalho, sem liberar regras individuais fixas', () => {
  const dates = ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08'];
  const requirements = [{ ...special, minimum: 1 }, { ...closed, id: 'sunday', date: '2026-11-08' }];
  const rows = buildRuleSchedule({ dates, users: [{ id: '1', name: 'Ana' }], rules: { ...baseRules, coverageRequirements: requirements }, holidays: [date], getDepartment: () => 'op' });
  assert.equal(rows[0].holidayWorkingDay, true);
  const optimized = optimizeScheduleCoverage(rows, requirements, { holidays: [date] });
  assert.equal(optimized.after.missingMinutes, 0);
  assert.equal(optimized.rows.find(row => row.date === date).status, 'Presencial');
  const locked = rows.map(row => row.date === date ? { ...row, locked: true } : row);
  assert.equal(optimizeScheduleCoverage(locked, requirements, { holidays: [date] }).rows[0].status, 'Folga');
});


test('edição manual não cria déficit; troca combinada preserva a cobertura', () => {
  const day = '2026-11-03';
  const source = { ...shift('1'), startDate: day, endDate: day, date: day, userName: 'Ana' };
  const target = { ...shift('2'), startDate: day, endDate: day, date: day, userName: 'Bia', status: 'Folga', shiftStart: '', shiftEnd: '' };
  const context = { history: [source, target], absences: [], rules: { coverageRequirements: [{ ...rule, minimum: 1 }] }, publicationId: 'pub', actor: { id: 'admin' }, now: 1 };
  assert.throws(() => planPublishedDayEdit(source, { status: 'Folga' }, day, context), /aumenta a falta de cobertura/);
  const swap = planPublishedScheduleSwap(source, day, target, day, context);
  assert.equal(swap.schedules.filter(item => item.status === 'Presencial').length, 1);
  assert.equal(swap.schedules.find(item => item.userId === '2').status, 'Presencial');
});

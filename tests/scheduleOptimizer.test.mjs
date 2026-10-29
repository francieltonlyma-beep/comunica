import test from 'node:test';
import assert from 'node:assert/strict';
import { balancePreparedScheduleProposal, analyzeProposalCoverage, buildCoverageFirstProposal, coverageShortfalls, optimizeScheduleCoverage, planSchedulePublication, prepareScheduleProposal, proposalScheduleRecords, scheduleSignature } from '../src/scheduleOptimizer.js';
import { isWorking, scheduleRuleIssues, shiftDate } from '../src/scheduleDayRules.js';
import { coverageForDay } from '../src/scheduleCoverage.js';

const start = '2026-11-02';
const rules = { workDaysPerWeek: 5, restEveryDays: 7, shiftStart: '08:00', shiftEnd: '17:00' };
const requirement = { id: 'need', department: 'op', start: '08:00', end: '12:00', minimum: 1, weekdays: [2], includeRemote: false };
const context = { employees: [{ id: 'u', name: 'Pessoa', depts: ['op'] }], history: [], absences: [] };
const week = () => Array.from({ length: 7 }, (_, index) => {
  const working = ![1, 6].includes(index);
  const date = shiftDate(start, index);
  return { key: 'u-' + date, userId: 'u', userName: 'Pessoa', dept: 'op', date, weekKey: start, status: working ? 'Presencial' : 'Folga',
    shiftStart: working ? '08:00' : '', shiftEnd: working ? '17:00' : '', breakStart: working ? '12:00' : '', breakEnd: working ? '13:00' : '',
    breakMinutes: working ? 60 : 0, extraHours: 0, restEveryDays: 7, workDaysPerWeek: 5, weekHoursTarget: 40 };
});
const hours = rows => rows.reduce((sum, row) => sum + (row.status === 'Presencial' ? 8 + Number(row.extraHours || 0) : 0), 0);

test('melhora cobertura com troca dentro da semana, sem mudar dias nem horas da pessoa', () => {
  const original = week();
  const result = optimizeScheduleCoverage(original, [requirement], context);
  assert.ok(result.swaps > 0);
  assert.equal(result.before.coveredPercent, 0);
  assert.equal(result.after.coveredPercent, 100);
  assert.equal(result.rows.filter(row => row.status === 'Presencial').length, 5);
  assert.equal(hours(result.rows), hours(original));
  assert.equal(original[1].status, 'Folga');
});

test('necessidade de domingo ativa o dia mesmo fora dos dias padrão', () => {
  const rows = week().map(row => ({ ...row, allowed: new Date(`${row.date}T12:00:00`).getDay() !== 0 }));
  const sundayNeed = { ...requirement, weekdays: [0] };
  const result = optimizeScheduleCoverage(rows, [sundayNeed], context);
  const sunday = result.rows.find(row => new Date(`${row.date}T12:00:00`).getDay() === 0);
  assert.equal(result.after.missingMinutes, 0);
  assert.equal(sunday.status, 'Presencial');
  assert.equal(result.rows.filter(row => row.status === 'Presencial').length, 5);
});

test('não cria falta em uma faixa que já estava coberta', () => {
  const rows = week().map(row => ({ ...row, locked: row.date !== start && row.date !== shiftDate(start, 1) }));
  const monday = { ...requirement, id: 'monday', weekdays: [1] };
  const heavierTuesday = { ...requirement, end: '17:00' };
  const result = optimizeScheduleCoverage(rows, [monday, heavierTuesday], context);
  assert.equal(result.swaps, 0);
  assert.equal(result.rows[0].status, 'Presencial');
});

test('respeita dias manuais, regras aplicadas e limite de dias consecutivos', () => {
  for (const pin of ['locked', 'manuallyAdjusted', 'pinned', 'ruleApplied']) {
    const rows = week().map(row => ({ ...row, [pin]: true }));
    const result = optimizeScheduleCoverage(rows, [requirement], context);
    assert.equal(result.swaps, 0);
    assert.deepEqual(result.rows, rows);
  }
  const rows = week().map((row, index) => ({ ...row, status: [0, 1, 3, 5].includes(index) ? 'Presencial' : 'Folga', shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', restEveryDays: 3, locked: ![2, 3].includes(index) }));
  const result = optimizeScheduleCoverage(rows, [{ ...requirement, weekdays: [3] }], context);
  assert.equal(result.swaps, 0);
});

test('preserva registros manuais, férias, ausências parciais e pins da prévia', () => {
  const rows = week();
  const prepared = prepareScheduleProposal(rows, {
    rules,
    history: [{ id: 'manual', userId: 'u', startDate: start, endDate: start, status: 'Folga' }],
    absences: [
      { userId: 'u', date: shiftDate(start, 1), reason: 'Férias' },
      { userId: 'u', date: shiftDate(start, 2), startTime: '09:00', endTime: '10:00', reason: 'Consulta' },
    ],
    draftPins: [{ ...rows[3], status: 'Folga', shiftStart: '', shiftEnd: '', manuallyAdjusted: true }],
  });
  assert.equal(prepared[0].preservedExisting, true);
  assert.equal(prepared[0].status, 'Folga');
  assert.equal(prepared[1].preservedAbsence, true);
  assert.equal(prepared[1].status, 'Férias');
  assert.equal(prepared[2].constraintLocked, true);
  assert.equal(prepared[3].locked, true);
  assert.equal(prepared[3].status, 'Folga');
});

test('ausência noturna do dia anterior fixa a jornada da madrugada seguinte', () => {
  const row = { ...week()[1], shiftStart: '00:00', shiftEnd: '06:00', breakStart: '', breakEnd: '', breakMinutes: 0 };
  const prepared = prepareScheduleProposal([row], { rules, absences: [{ userId: 'u', date: start, startTime: '22:00', endTime: '02:00', reason: 'Consulta' }] });
  assert.equal(prepared[0].constraintLocked, true);
  assert.match(prepared[0].ruleReason, /ausência parcial/);
});

test('sem necessidade ou com cobertura suficiente, não executa busca desnecessária', () => {
  assert.equal(optimizeScheduleCoverage(week(), [], context).evaluations, 0);
  assert.equal(optimizeScheduleCoverage(week(), [{ ...requirement, weekdays: [1] }], context).evaluations, 0);
  assert.equal(optimizeScheduleCoverage(week(), [requirement], context, { maxEvaluations: 0 }).limited, true);
});

test('outra pessoa não selecionada e seu intervalo entram na análise da prévia', () => {
  const history = [{ id: 'other', userId: 'other', dept: 'op', startDate: shiftDate(start, 1), endDate: shiftDate(start, 1), status: 'Presencial', shiftStart: '08:00', shiftEnd: '12:00', breakStart: '10:00', breakEnd: '11:00' }];
  const analysis = analyzeProposalCoverage(week(), [requirement], { ...context, history });
  assert.equal(analysis.missingMinutes, 60);
  assert.equal(analysis.coveredPercent, 75);
});

test('publicação parcial conserva datas externas e não exclui marcações manuais', () => {
  const rows = prepareScheduleProposal(week().slice(0, 3), { rules, history: [{ id: 'manual', userId: 'u', startDate: shiftDate(start, 1), endDate: shiftDate(start, 1), status: 'Folga' }] });
  const history = [
    { id: 'auto', userId: 'u', autoGenerated: true, startDate: '2026-11-01', endDate: '2026-11-30', status: 'Folga' },
    { id: 'manual', userId: 'u', startDate: shiftDate(start, 1), endDate: shiftDate(start, 1), status: 'Folga' },
    { id: 'other', userId: 'other', autoGenerated: true, startDate: start, endDate: start, status: 'Folga' },
  ];
  const segments = rows.filter(row => !row.preservedExisting).map((row, index) => ({ id: 'new-' + index, userId: row.userId, startDate: row.date, endDate: row.date, status: row.status }));
  const plan = planSchedulePublication(rows, history, segments, 'publication');
  assert.deepEqual(plan.deletedIds, ['auto']);
  assert.equal(plan.schedules.find(item => item.id.endsWith('left')).endDate, '2026-11-01');
  assert.equal(plan.schedules.find(item => item.id.endsWith('right')).startDate, '2026-11-05');
  assert.ok(!plan.records.some(record => ['manual', 'other'].includes(record.id)));
  const effective = proposalScheduleRecords(rows, history);
  assert.ok(effective.some(row => row.id === 'manual'));
});

test('recusa dias ausentes e novas marcações fixas', () => {
  assert.throws(() => planSchedulePublication([week()[0], week()[2]], [], [], 'p'), /todos os dias/);
  assert.throws(() => planSchedulePublication(week(), [{ id: 'new-manual', userId: 'u', startDate: start, endDate: start, status: 'Folga' }], [], 'p'), /fixa/);
});

test('publicação recusa datas e períodos consolidados incompatíveis', () => {
  const rows = week().slice(0, 2);
  assert.throws(() => planSchedulePublication([{ ...rows[0], date: '2026-02-31' }, rows[1]], [], [], 'bad-date'), /data inválida/);
  assert.throws(() => planSchedulePublication(rows, [], [{ id: 'bad-segment', userId: 'u', startDate: start, endDate: shiftDate(start, 3) }], 'bad-segment'), /períodos consolidados/);
});

test('assinatura detecta alterações e independe da ordem retornada pela nuvem', () => {
  const a = { id: 'a', status: 'Folga', locked: true }, b = { id: 'b', status: 'Presencial' };
  assert.equal(scheduleSignature([a, b]), scheduleSignature([b, { locked: true, status: 'Folga', id: 'a' }]));
  assert.notEqual(scheduleSignature([a, b]), scheduleSignature([{ ...a, locked: false }, b]));
});

test('regenerar com trabalho fixado em uma folga redistribui o descanso sem criar sexto dia', () => {
  const source = week();
  const pin = { ...source[1], status: 'Presencial', shiftStart: '09:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', manuallyAdjusted: true };
  const prepared = prepareScheduleProposal(source, { rules, draftPins: [pin] });
  assert.equal(prepared.filter(row => row.status === 'Presencial').length, 6);
  const balanced = balancePreparedScheduleProposal(prepared, source, [requirement], context);
  assert.equal(balanced.filter(row => row.status === 'Presencial').length, 5);
  assert.equal(balanced[1].shiftStart, '09:00');
  assert.equal(balanced[1].locked, true);
});

const monthlyCrew = (size, weeks = 4) => Array.from({ length: size }, (_, user) => Array.from({ length: weeks * 7 }, (_, day) => {
  const date = shiftDate(start, day), works = day % 7 < 5;
  return { key: `${user}-${date}`, userId: String(user), userName: `Pessoa ${user}`, dept: 'op', date,
    weekKey: shiftDate(start, Math.floor(day / 7) * 7), status: works ? 'Presencial' : 'Folga',
    shiftStart: works ? '08:00' : '', shiftEnd: works ? '17:00' : '', breakStart: works ? '12:00' : '', breakEnd: works ? '13:00' : '',
    extraHours: 0, workDaysPerWeek: 5, weekHoursTarget: 40, restEveryDays: 7, allowed: true };
})).flat();
const everyDayNeed = minimum => ({ ...requirement, minimum, weekdays: [0, 1, 2, 3, 4, 5, 6] });

test('mês com 100 pessoas atende mínimo de 70 todos os dias sem esgotar a busca nas primeiras semanas', () => {
  const input = monthlyCrew(100);
  const result = buildCoverageFirstProposal(input, [everyDayNeed(70)]);
  assert.ok(result.before.missingMinutes > 0);
  assert.equal(result.after.missingMinutes, 0);
  assert.equal(result.limited, false);
  const byPerson = new Map();
  for (const row of result.rows) byPerson.set(row.userId, [...(byPerson.get(row.userId) || []), row]);
  for (const personRows of byPerson.values()) {
    for (const weekKey of new Set(personRows.map(row => row.weekKey))) {
      const weekRows = personRows.filter(row => row.weekKey === weekKey);
      assert.equal(weekRows.filter(isWorking).length, 5);
      assert.equal(hours(weekRows), 40);
    }
    assert.deepEqual(scheduleRuleIssues(personRows).filter(issue => issue.blocking), []);
  }
  assert.equal(input.filter(row => row.date === shiftDate(start, 6) && isWorking(row)).length, 0);
});

test('orçamento pequeno alcança todas as semanas e nunca deixa um sexto dia de trabalho', () => {
  const input = monthlyCrew(4);
  const result = optimizeScheduleCoverage(input, [everyDayNeed(1)], {}, { maxEvaluations: 4 });
  assert.ok(result.evaluations <= 4);
  assert.equal(result.limited, true);
  for (const weekKey of new Set(input.map(row => row.weekKey))) {
    const beforeWeek = result.before.days.filter(day => day.date >= weekKey && day.date <= shiftDate(weekKey, 6));
    const afterWeek = result.after.days.filter(day => day.date >= weekKey && day.date <= shiftDate(weekKey, 6));
    const missing = days => days.reduce((sum, day) => sum + day.rules.flatMap(rule => rule.segments).reduce((total, segment) => total + segment.missing, 0), 0);
    assert.ok(missing(afterWeek) < missing(beforeWeek));
    for (const userId of ['0', '1', '2', '3']) assert.equal(result.rows.filter(row => row.weekKey === weekKey && row.userId === userId && isWorking(row)).length, 5);
  }
});

test('cobertura indexada equivale à análise completa com madrugada, ausências e pessoas fora da prévia', () => {
  const rows = monthlyCrew(2, 1);
  const needs = [{ ...everyDayNeed(2), start: '00:00', end: '04:00' }, { ...everyDayNeed(2), id: 'day', start: '08:00', end: '14:00' }];
  const history = [{ id: 'night', userId: 'outside', dept: 'op', startDate: shiftDate(start, -1), endDate: shiftDate(start, 6), status: 'Presencial', shiftStart: '22:00', shiftEnd: '04:00' }, { id: 'old-auto', userId: '0', dept: 'op', startDate: shiftDate(start, -2), endDate: shiftDate(start, 9), autoGenerated: true, status: 'Folga' }];
  const absences = [{ userId: 'outside', date: shiftDate(start, -1), startTime: '23:00', endTime: '02:00' }, { userId: '1', date: shiftDate(start, 2), startTime: '09:00', endTime: '10:00' }];
  const schedules = proposalScheduleRecords(rows, history);
  const analysis = analyzeProposalCoverage(rows, needs, { history, absences });
  for (const day of analysis.days) assert.deepEqual(day, { date: day.date, ...coverageForDay(day.date, needs, { schedules, absences }) });
});

test('correção não transfere pessoa de outro setor nem conta home office onde exige presencial', () => {
  const input = monthlyCrew(2, 1).map(row => row.userId === '1' ? { ...row, dept: 'other' } : isWorking(row) ? { ...row, status: 'Home Office' } : row);
  const result = optimizeScheduleCoverage(input, [everyDayNeed(1)]);
  assert.deepEqual(result.rows, input);
  assert.equal(result.swaps, 0);
  assert.ok(result.after.missingMinutes > 0);
});

test('pendências mostram a pior faixa, priorizam maior déficit relativo e distinguem folgas fixas', () => {
  const input = monthlyCrew(3, 1).map(row => row.date === shiftDate(start, 6) ? { ...row, locked: row.userId === '0' } : row);
  const analysis = analyzeProposalCoverage(input, [everyDayNeed(2)]);
  const items = coverageShortfalls(analysis, input);
  assert.equal(items.length, 2);
  assert.equal(items[0].available, 0);
  assert.equal(items[0].minimum, 2);
  assert.equal(items[0].missing, 2);
  assert.equal(items.find(item => item.date === shiftDate(start, 6)).fixedRest, 1);
  assert.equal(items.find(item => item.date === shiftDate(start, 6)).adjustableRest, 2);
  assert.deepEqual(coverageShortfalls({ days: [] }), []);
});



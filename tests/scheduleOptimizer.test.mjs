import test from 'node:test';
import assert from 'node:assert/strict';
import { balancePreparedScheduleProposal, analyzeProposalCoverage, optimizeScheduleCoverage, planSchedulePublication, prepareScheduleProposal, proposalScheduleRecords, scheduleSignature } from '../src/scheduleOptimizer.js';
import { shiftDate } from '../src/scheduleDayRules.js';

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

test('recusa dias ausentes, novas marcações fixas e publicações acima do limite atômico', () => {
  assert.throws(() => planSchedulePublication([week()[0], week()[2]], [], [], 'p'), /todos os dias/);
  assert.throws(() => planSchedulePublication(week(), [{ id: 'new-manual', userId: 'u', startDate: start, endDate: start, status: 'Folga' }], [], 'p'), /fixa/);
  const segments = Array.from({ length: 451 }, (_, index) => ({ id: 'segment-' + index }));
  assert.throws(() => planSchedulePublication(week(), [], segments, 'p'), /450/);
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

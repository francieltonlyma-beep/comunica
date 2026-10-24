import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { isProtectedProposalRow } from '../src/scheduleOptimizer.js';
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const extract = (name, next, context) => vm.runInNewContext('(' + app.split('const ' + name + ' = ')[1].split('const ' + next + ' = ')[0].trim().replace(/;$/, '') + ')', context);

function editorContext(rows) {
  const context = {
    rows: structuredClone(rows), isProtectedProposalRow,
    automaticScheduleRules: { shiftStart: '08:00', shiftEnd: '17:00', breakStart: '12:00', breakEnd: '13:00', workDaysPerWeek: 5 },
    automaticScheduleWeeklyHoursText: '40:00', triggerNotification() {},
  };
  context.setAutomaticScheduleProposal = update => { context.rows = update(context.rows); };
  for (const [name, next] of [['scheduleTimeToMinutes','scheduleMinutesToTime'], ['scheduleMinutesToTime','scheduleDurationToText'], ['scheduleDurationToText','scheduleTextToHours'], ['scheduleTextToHours','scheduleIntervalMinutes'], ['scheduleIntervalMinutes','scheduleTimeWithinShift'], ['updateAutomaticScheduleRow','changeAutomaticScheduleStatus'], ['changeAutomaticScheduleStatus','repeatAutomaticScheduleOvertime'], ['toggleAutomaticScheduleDayLock','generateAutomaticSchedule']]) context[name] = extract(name, next, context);
  return context;
}

test('trocar folga por trabalho calcula jornada padrão e fixa somente esse dia', () => {
  const context = editorContext([{ key: 'day', status: 'Folga' }, { key: 'next', status: 'Folga' }]);
  context.changeAutomaticScheduleStatus(context.rows[0], 'Presencial');
  const row = context.rows[0];
  assert.equal(row.shiftStart, '08:00'); assert.equal(row.shiftEnd, '17:00');
  assert.equal(row.breakMinutes, 60); assert.equal(row.locked, true); assert.equal(row.manuallyAdjusted, true);
  assert.equal(context.rows[1].locked, undefined);
  context.changeAutomaticScheduleStatus(row, 'Folga');
  assert.equal(context.rows[0].shiftStart, ''); assert.equal(context.rows[0].breakStart, '');
  assert.equal(context.rows[0].extraHours, 0);
});

test('editar horários não altera marcações ou ausências preservadas', () => {
  const rows = [{ key: 'manual', status: 'Presencial', shiftStart: '09:00', preservedExisting: true }, { key: 'absence', status: 'Férias', preservedAbsence: true }];
  const context = editorContext(rows);
  for (const row of context.rows) {
    context.updateAutomaticScheduleRow(row.key, { shiftStart: '07:00' });
    context.changeAutomaticScheduleStatus(row, 'Folga');
    context.toggleAutomaticScheduleDayLock(row.key);
  }
  assert.deepEqual(context.rows, rows);
});

test('liberar dia permite novas trocas, mas mantém regras e ausências parciais fixas', () => {
  const context = editorContext([{ key: 'manual', locked: true, manuallyAdjusted: true }, { key: 'rule', ruleApplied: true, locked: true }, { key: 'partial', constraintLocked: true, locked: true }]);
  for (const row of context.rows) context.toggleAutomaticScheduleDayLock(row.key);
  assert.equal(context.rows[0].locked, false); assert.equal(context.rows[0].manuallyAdjusted, false);
  assert.equal(context.rows[1].locked, true); assert.equal(context.rows[2].locked, true);
});

test('perfil sem configuração de regras não cria regra recorrente por este atalho', () => {
  const context = { canConfigureScheduleRules: false };
  assert.doesNotThrow(() => extract('createRecurringRuleFromDay', 'renderAutomaticScheduleRow', context)({}));
});

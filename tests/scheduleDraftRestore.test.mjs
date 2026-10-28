import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validateScheduleDraftScope } from '../src/scheduleDrafts.js';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const restore = context => vm.runInNewContext('(' + source.split('const restoreAutomaticScheduleDraft = ')[1].split('const toggleAutomaticScheduleDayLock = ')[0].trim().replace(/;$/, '') + ')', context);
const saved = { bulk: { userIds: ['u'], startDate: '2026-11-02', endDate: '2026-11-02', notes: 'Em edição' }, rows: [{ userId: 'u', dept: 'op', date: '2026-11-02', manuallyAdjusted: true, shiftStart: '07:00', shiftEnd: '12:00' }], holidayAssignments: { '2026-11-02': { u: { status: 'Presencial' } } }, weeklyHours: '40:00', inputHash: 'hash' };
function context() {
  const changes = {};
  const state = { validateScheduleDraftScope, scheduleScope: { employeeIds: ['u'], departmentIds: ['op'], allDepartments: false }, isManager: true, currentUser: { isAdmin: false }, effectiveAccessProfile: {}, activeCompany: { id: 'company' } };
  for (const name of ['AutomaticScheduleProblem', 'BulkSchedule', 'AutomaticScheduleHolidayDraft', 'AutomaticScheduleProposal', 'AutomaticScheduleProposalInput', 'AutomaticScheduleWeeklyHoursText', 'AutomaticSchedulePreviewDate', 'AutomaticScheduleOptimization', 'AutomaticScheduleRuleTab', 'BulkScheduleMode', 'AutomaticScheduleDraftRestore']) state[`set${name}`] = value => { changes[name] = typeof value === 'function' ? value({}) : value; };
  return { state, changes };
}

test('reabertura real restaura ajustes e feriados e exige conferir a origem antes de publicar', async () => {
  const { state, changes } = context();
  await restore(state)(saved);
  assert.deepEqual(changes.AutomaticScheduleProposal, saved.rows);
  assert.equal(changes.AutomaticScheduleHolidayDraft.companyId, 'company');
  assert.deepEqual(changes.AutomaticScheduleHolidayDraft.assignments, saved.holidayAssignments);
  assert.equal(changes.AutomaticScheduleProposalInput, 'draft-restored');
  assert.equal(changes.AutomaticScheduleDraftRestore.inputHash, 'hash');
  assert.equal(changes.AutomaticScheduleRuleTab, 'planning');
});

test('reabertura não altera estado quando há usuário fora do setor ou permissão de consulta', async () => {
  for (const inaccessible of [true, false]) {
    const { state, changes } = context();
    if (inaccessible) state.scheduleScope.employeeIds = [];
    else state.effectiveAccessProfile.canManageCalendar = false;
    await assert.rejects(restore(state)(saved));
    assert.equal(Object.keys(changes).length, 0);
  }
});

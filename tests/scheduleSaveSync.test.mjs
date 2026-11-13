import { scheduleOperationIssue } from '../src/scheduleOperationIssue.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planManualScheduleEdit } from '../src/scheduleManualEdit.js';
import { coverageChangeError, coverageChangesForDates } from '../src/scheduleCoverageChange.js';
import { shiftDate } from '../src/scheduleDayRules.js';

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const body = source.split('  const saveBulkSchedule = async (event) => {')[1].split('\n  };')[0];
const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const date = '2026-11-17';
function fixture({ syncBefore = true, success = true, pause, ready = true, requirements = [], events = [] } = {}) {
  const old = { id: 'old', userId: 'a', startDate: date, endDate: date, status: 'Folga' };
  let state = [old], writes = 0, closed = false, pending = false;
  let snapshot, issue;
  const ref = { current: false };
  const notifications = [];
  const context = {
    isManager: true, bulkScheduleSaveInFlight: ref, setIsSavingBulkSchedule: value => { pending = value; },
    bulkSchedule: { startDate: date, endDate: date, status: 'Presencial', shift: 'Integral', userIds: ['a'] },
    scheduleScope: { employees: [{ id: 'a', name: 'Ana' }] },
    bulkScheduleOccurrences: () => [{ startDate: date, endDate: date }], planManualScheduleEdit,
    automaticScheduleRules: { shiftStart: '08:00', shiftEnd: '17:00', version: 1 }, workSchedules: [old],
    currentUser: { name: 'Gestor' }, scheduleDepartmentForEmployee: () => 'Loja', getUserDepts: () => ['Loja'],
    schedulePlanningDataReady: () => ready, civilDateShift: (value, { days }) => shiftDate(value, days),
    scheduleScopedCoverageRequirements: requirements, calendarEvents: events, coverageRequirementsForDate: () => [],
    scheduleOperationIssue, setBulkScheduleOperationIssue: value => { issue = value; }, coverageChangesForDates, coverageChangeError, schedulePlanningContext: () => ({}),
    activeCompany: { id: 'company' }, absences: [],
    saveRelatedRecords: async records => {
      writes++;
      if (pause) await pause;
      if (!success) return false;
      const removed = new Set(records.filter(row => row.operation === 'delete').map(row => row.id));
      snapshot = [...records.filter(row => row.data).map(row => row.data), ...state.filter(row => !removed.has(row.id))];
      if (syncBefore) state = snapshot;
      return true;
    },
    setWorkSchedules: updater => { state = updater(state); },
    setShowBulkScheduleModal: value => { closed = !value; }, triggerNotification: (...args) => notifications.push(args),
  };
  const execute = new AsyncFunction('event', ...Object.keys(context), body);
  return { run: () => execute({ preventDefault() {} }, ...Object.values(context)), deliverSnapshot: () => { state = snapshot; },
    get issue() { return issue; }, get state() { return state; }, get writes() { return writes; }, get closed() { return closed; }, get pending() { return pending; }, ref, notifications };
}

for (const syncBefore of [true, false]) test(`manual save keeps one record when Firebase snapshot arrives ${syncBefore ? 'before' : 'after'} save confirmation`, async () => {
  const f = fixture({ syncBefore });
  await f.run();
  if (!syncBefore) f.deliverSnapshot();
  assert.equal(f.state.length, 1);
  assert.equal(new Set(f.state.map(row => row.id)).size, f.state.length);
  assert.equal(f.state[0].status, 'Presencial');
  assert.equal(f.closed, true);
  assert.equal(f.pending, false);
});

test('manual save blocks repeated submissions until the first finishes', async () => {
  let release;
  const pause = new Promise(resolve => { release = resolve; });
  const f = fixture({ pause });
  const first = f.run();
  assert.equal(f.pending, true);
  await f.run();
  assert.equal(f.writes, 1);
  release(); await first;
  assert.equal(f.state.length, 1);
  assert.equal(f.ref.current, false);
});

test('failed save keeps the original list and releases the submit guard for retry', async () => {
  const f = fixture({ success: false });
  await f.run();
  assert.equal(f.state[0].id, 'old');
  assert.equal(f.closed, false);
  assert.equal(f.pending, false);
  assert.equal(f.ref.current, false);
  await f.run();
  assert.equal(f.writes, 2);
});

test('a validation error releases the save guard without writing', async () => {
  const f = fixture({ ready: false });
  await f.run();
  assert.equal(f.writes, 0);
  assert.equal(f.ref.current, false);
  assert.equal(f.pending, false);
  assert.equal(f.closed, false);
});

test('a holiday block opens the exact configuration, preserves the form and permits retry after opening the date', async () => {
  const requirements = [{ id: 'weekly', department: 'Loja', weekdays: [2], start: '08:00', end: '17:00', minimum: 1 }];
  const f = fixture({ requirements, events: [{ date, type: 'Feriado' }] });
  await f.run();
  assert.deepEqual(f.issue, { companyId: 'company', date, department: 'Loja', closed: false });
  assert.equal(f.writes, 0); assert.equal(f.closed, false); assert.equal(f.state[0].id, 'old');
  assert.equal(f.ref.current, false); assert.equal(f.pending, false);
  requirements.push({ ...requirements[0], id: 'date', date, weekdays: [] });
  await f.run();
  assert.equal(f.writes, 1); assert.equal(f.closed, true); assert.equal(f.state[0].status, 'Presencial');
});

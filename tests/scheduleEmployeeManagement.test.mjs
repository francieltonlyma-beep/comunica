import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeMonthSummary } from '../src/scheduleEmployeeManagement.js';
const cell = (schedules = [], absences = []) => ({ date: '2026-11-02', schedules, absences });
const shift = { status: 'Presencial', shiftStart: '22:00', shiftEnd: '07:00', breakStart: '02:00', breakEnd: '03:00', extraHours: 1 };
test('overnight hours deduct break and do not double count extra', () => {
 const result = employeeMonthSummary([cell([shift]), cell([{ status: 'Folga' }]), cell()]);
 assert.equal(result.hours, 8); assert.equal(result.extra, 1); assert.equal(result.work, 1); assert.equal(result.off, 1); assert.equal(result.empty, 1);
});
test('overlapping and incomplete assignments require review, never inflate totals', () => {
 const result = employeeMonthSummary([cell([shift, shift]), cell([{ status: 'Home Office' }])]);
 assert.equal(result.hours, 0); assert.ok(result.days.every(day => day.review));
});
test('absence is shown without silently changing published planned hours', () => {
 const result = employeeMonthSummary([cell([shift], [{ reason: 'Consulta', startTime: '23:00', endTime: '23:30' }])]);
 assert.equal(result.hours, 8); assert.equal(result.absence, 1);
});

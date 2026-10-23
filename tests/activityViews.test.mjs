import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { activityCalendarMonth, currentActivityCalendarMonth, groupActivityRowsByStatus, shiftActivityCalendarMonth } from '../src/activityViews.js';

const row = (id, status, dueDate) => ({ id, status, activity: { dueDate } });

test('activity Kanban groups the same filtered rows by visible status', () => {
  const grouped = groupActivityRowsByStatus([
    row('a', 'pending', '2026-10-05'),
    row('b', 'in_progress', '2026-10-06'),
    row('c', 'overdue', '2026-10-01'),
    row('d', 'resolved', '2026-10-02'),
  ]);
  assert.deepEqual(Object.keys(grouped), ['pending', 'in_progress', 'overdue', 'resolved']);
  assert.equal(grouped.overdue[0].id, 'c');
});

test('activity calendar starts on Monday and groups activities by due date', () => {
  const cells = activityCalendarMonth('2026-10', [
    row('a', 'pending', '2026-10-05'),
    row('b', 'in_progress', '2026-10-05'),
    row('outside', 'pending', '2026-11-01'),
  ]);
  const octoberFirst = cells.find(cell => cell?.day === 1);
  const octoberFifth = cells.find(cell => cell?.day === 5);
  assert.equal(cells.indexOf(octoberFirst), 3);
  assert.deepEqual(octoberFifth.activities.map(item => item.id), ['a', 'b']);
  assert.equal(cells.length % 7, 0);
});

test('activity calendar navigation crosses years', () => {
  assert.equal(shiftActivityCalendarMonth('2026-12', 1), '2027-01');
  assert.equal(shiftActivityCalendarMonth('2026-01', -1), '2025-12');
  assert.equal(currentActivityCalendarMonth(new Date(2026, 9, 23)), '2026-10');
});

test('service center exposes list, Kanban and calendar activity views', () => {
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /Visualização das atividades/);
  assert.match(app, /label:'Kanban'/);
  assert.match(app, /label:'Calendário'/);
  assert.match(app, /Quadro Kanban de atividades/);
  assert.match(app, /Calendário de atividades/);
});

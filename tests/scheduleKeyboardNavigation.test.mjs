import test from 'node:test';
import assert from 'node:assert/strict';
import { teamMonthKeyboardTarget } from '../src/scheduleKeyboardNavigation.js';

test('setas percorrem datas na horizontal e funcionários na vertical', () => {
  assert.deepEqual(teamMonthKeyboardTarget('ArrowRight', 4, 12, 30, 31), { row: 4, day: 13 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowLeft', 4, 12, 30, 31), { row: 4, day: 11 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowDown', 4, 12, 30, 31), { row: 5, day: 12 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowUp', 4, 12, 30, 31), { row: 3, day: 12 });
});

test('seleção para nos limites sem pular para outro mês ou funcionário', () => {
  assert.deepEqual(teamMonthKeyboardTarget('ArrowLeft', 0, 0, 30, 28), { row: 0, day: 0 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowUp', 0, 0, 30, 28), { row: 0, day: 0 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowRight', 29, 27, 30, 28), { row: 29, day: 27 });
  assert.deepEqual(teamMonthKeyboardTarget('ArrowDown', 29, 27, 30, 28), { row: 29, day: 27 });
});

test('teclas fora da navegação e grade vazia não mudam seleção', () => {
  for (const key of ['Tab', 'Enter', 'Escape', 'a']) assert.equal(teamMonthKeyboardTarget(key, 0, 0, 30, 31), null);
  assert.equal(teamMonthKeyboardTarget('ArrowRight', 0, 0, 0, 31), null);
  assert.equal(teamMonthKeyboardTarget('ArrowRight', 0, 0, 30, 0), null);
});

test('navegação alcança linhas além do bloco inicial e meses de 28, 29, 30 ou 31 dias', () => {
  assert.deepEqual(teamMonthKeyboardTarget('ArrowDown', 11, 12, 85, 30), { row: 12, day: 12 });
  for (const days of [28,29,30,31]) assert.deepEqual(teamMonthKeyboardTarget('ArrowRight', 10, days-2, 85, days), { row: 10, day: days-1 });
});

// Exercise the component's actual key handler, including the next block of rows.
const { readFileSync } = await import('node:fs');
const component = readFileSync(new URL('../src/ScheduleTeamMonth.jsx', import.meta.url), 'utf8');
const handlerBody = component.split('  const moveSelection = (event, rowIndex, dayIndex) => {')[1].split('\n  };')[0];
function runHandler(key, rowIndex, dayIndex, modifiers = {}) {
  const rows = Array.from({ length: 30 }, (_, row) => ({ userId: String(row), cells: Array.from({ length: 30 }, (_, day) => ({ date: `day-${day}` })) }));
  const seen = { prevented: false, focus: false, scroll: false };
  const handler = new Function('event', 'rowIndex', 'dayIndex', 'teamMonthKeyboardTarget', 'rows', 'days', 'visibleRows', 'visibleRowCount', 'filterKey', 'setRowPagination', 'selectCell', 'requestAnimationFrame', 'scrollRef', handlerBody);
  handler({ key, preventDefault: () => { seen.prevented = true; }, ...modifiers }, rowIndex, dayIndex, teamMonthKeyboardTarget, rows, Array(30), rows.slice(0, 12), 12, 'filter',
    value => { seen.pagination = value; }, (cell, person, keyboard) => { seen.selected = { date: cell.date, userId: person.userId, keyboard }; }, callback => callback(),
    { current: { querySelector: selector => { seen.selector = selector; return { focus: () => { seen.focus = true; }, scrollIntoView: () => { seen.scroll = true; } }; } } });
  return seen;
}

test('o handler mantém o foco na célula e abre o bloco seguinte ao descer além da 12ª pessoa', () => {
  const seen = runHandler('ArrowDown', 11, 12);
  assert.equal(seen.prevented, true);
  assert.deepEqual(seen.selected, { date: 'day-12', userId: '12', keyboard: true });
  assert.deepEqual(seen.pagination, { key: 'filter', count: 24 });
  assert.equal(seen.selector, '[data-team-row="12"][data-team-day="12"]');
  assert.equal(seen.focus, true); assert.equal(seen.scroll, true);
});

test('o handler não interfere no Tab nem nos atalhos do navegador', () => {
  for (const [key, modifiers] of [['Tab', {}], ['ArrowLeft', { altKey: true }], ['ArrowRight', { ctrlKey: true }], ['ArrowDown', { metaKey: true }]]) {
    const seen = runHandler(key, 2, 3, modifiers);
    assert.equal(seen.prevented, false); assert.equal(seen.selected, undefined);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { completeMonths, salaryPosition, timelyDeliveries } from '../src/careerReview.js';

test('tenure uses full months and the end of shorter months', () => {
  assert.equal(completeMonths('2026-01-31', '2026-02-28'), 1);
  assert.equal(completeMonths('2025-11-27', '2026-11-26'), 11);
  assert.equal(completeMonths('', '2026-11-26'), null);
  assert.equal(completeMonths('2026-12-01', '2026-11-26'), null);
});

test('delivery score uses only attributable conclusions within the period, on the local date', () => {
  const delivery = { status: 'resolved', assigneeIds: ['ana'], dueDate: '2026-11-20' };
  assert.deepEqual(timelyDeliveries([
    { ...delivery, resolvedAt: '2026-11-21T01:00:00Z' },
    { ...delivery, resolvedAt: '2026-11-21T04:00:00Z' },
    { ...delivery, resolvedAt: '2026-08-28T12:00:00Z' },
    { ...delivery, assigneeIds: ['joao'], resolvedAt: '2026-11-20T12:00:00Z' },
    { ...delivery, dueDate: '', resolvedAt: '2026-11-20T12:00:00Z' },
  ], 'ana', '2026-11-26'), { total: 2, onTime: 1 });
  assert.equal(timelyDeliveries([], 'ana', '2026-11-26'), null);
});

test('a salary shared by multiple bands does not imply an exact band', () => {
  const plan = { base: 2000, minimum: 0, cct: 0, bandRate: 10, levelRate: 50 };
  assert.equal(salaryPosition({ amount: 2200 }, plan), 'I · B');
  assert.equal(salaryPosition({ amount: 2250 }, plan), 'Entre faixas');
  assert.equal(salaryPosition({ amount: 2000 }, { ...plan, bandRate: 0 }), 'Valor compartilhado por várias faixas');
  assert.equal(salaryPosition({ amount: 1999 }, plan), 'Abaixo da matriz');
});

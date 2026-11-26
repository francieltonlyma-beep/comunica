import assert from 'node:assert/strict';
import test from 'node:test';
import { automaticPunchType } from '../functions/src/timePunch.ts';

const now = new Date('2026-11-26T15:00:00-03:00');
const mark = (type, at = '2026-11-26T08:00:00-03:00') => ({ type, at: new Date(at) });
const shift = { date: '2026-11-26', status: 'Presencial', shiftStart: '08:00', shiftEnd: '17:00' };

test('advances through a shift with a break and resets after the exit', () => {
  const types = ['entry', 'breakStart', 'breakEnd', 'exit', 'entry'];
  const marks = [];
  for (const type of types) {
    assert.equal(automaticPunchType(now, marks, []), type);
    marks.push(mark(type));
  }
});

test('uses an approved adjustment in sequence and skips the break on a shift without one', () => {
  assert.equal(automaticPunchType(now, [mark('entry'), mark(undefined)], []), 'breakEnd');
  assert.equal(automaticPunchType(now, [mark('entry')], [shift]), 'exit');
  assert.equal(automaticPunchType(now, [mark('entry')], [{ ...shift, breakStart: '12:00', breakEnd: '13:00' }]), 'breakStart');
});

test('continues a published overnight shift and resets when the next shift begins', () => {
  const overnight = { ...shift, date: '2026-11-25', shiftStart: '22:00', shiftEnd: '06:00' };
  const marks = [mark('entry', '2026-11-25T22:00:00-03:00')];
  assert.equal(automaticPunchType(new Date('2026-11-26T05:00:00-03:00'), marks, [overnight]), 'exit');
  assert.equal(automaticPunchType(new Date('2026-11-26T07:00:00-03:00'), marks, [overnight, shift]), 'exit');
  assert.equal(automaticPunchType(now, marks, [overnight, shift]), 'entry');
  assert.equal(automaticPunchType(now, marks, []), 'entry');
});

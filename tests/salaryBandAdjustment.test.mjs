import assert from 'node:assert/strict';
import test from 'node:test';
import { adjustSalaryBand, salaryBands } from '../src/careerReview.js';

const plan = { cct: '1600', minimum: '1500', base: '1800', bandRate: '10', levelRate: '20', overrides: ['', '', '2250', '', '', '', '', '', ''] };

test('a single adjustment preserves the remaining bands and the base', () => {
  const next = adjustSalaryBand(plan, 1, 2000, 'single');
  assert.equal(next.base, plan.base);
  assert.deepEqual(salaryBands(next).map(band => band.value),
    salaryBands(plan).map((band, index) => index === 1 ? 2000 : band.value));
});

test('progression uses the selected band as the anchor and replaces previous overrides', () => {
  const next = adjustSalaryBand(plan, 4, 2640, 'progression');
  assert.equal(next.base, '2000');
  assert.equal(salaryBands(next)[4].value, 2640);
  assert.equal(salaryBands(next)[2].value, 2420);
  assert.equal(salaryBands(next)[8].value, 3484.8);
  assert.ok(next.overrides.every(value => value === ''));
});

test('progression rejects a base below the configured floor', () => {
  assert.equal(adjustSalaryBand(plan, 4, 1800, 'progression'), null);
  assert.equal(adjustSalaryBand(plan, 1, 1700, 'single'), null);
});

test('a single adjustment at the formula value clears that manual override', () => {
  const next = adjustSalaryBand(plan, 2, salaryBands(plan)[2].calculated, 'single');
  assert.equal(next.overrides[2], '');
});

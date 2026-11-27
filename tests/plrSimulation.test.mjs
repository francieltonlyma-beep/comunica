import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePlr } from '../src/plrSimulation.js';

const example = { weights: ['50', '30', '20'], companyScore: '90', sectorScore: '100', target: '100', amount: '1000', onTime: 8, evaluated: 10 };

test('PLR combines company, sector and individual contributions', () => {
  const result = calculatePlr(example);
  assert.deepEqual(result.contributions, [45, 30, 16]);
  assert.equal(result.total, 910);
});

test('individual attainment is measured against the role target and capped at 100%', () => {
  assert.equal(calculatePlr({ ...example, target: '80' }).total, 950);
  assert.equal(calculatePlr({ ...example, target: '60' }).total, 950);
});

test('missing individual evidence blocks the preview only when it has weight', () => {
  const noEvidence = { ...example, onTime: 0, evaluated: 0 };
  assert.match(calculatePlr(noEvidence).error, /Sem conclusões/);
  assert.equal(calculatePlr({ ...noEvidence, weights: ['100', '0', '0'], sectorScore: '', target: '' }).total, 900);
});

test('incomplete and invalid values cannot produce a payout preview', () => {
  assert.match(calculatePlr({ ...example, weights: ['50', '30', '10'] }).error, /100%/);
  assert.match(calculatePlr({ ...example, companyScore: '' }).error, /atingimento/);
  assert.match(calculatePlr({ ...example, amount: '-100' }).error, /valor-alvo/);
  assert.equal(calculatePlr({ ...example, companyScore: '0' }).total, 460);
});

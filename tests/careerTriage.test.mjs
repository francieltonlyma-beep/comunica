import test from 'node:test';
import assert from 'node:assert/strict';
import {careerFitScore, matchesCareerStage} from '../src/careerTriage.js';

test('a real zero contributes to candidate fit and missing scores do not', () => {
  assert.deepEqual([0, '0', 57, '20.5', null, undefined, '', ' ', false, -1, 101, NaN].map(careerFitScore),
    [0, 0, 57, 20.5, null, null, null, null, null, null, null, null]);
});

test('each funnel stage opens its own candidates, including rejected and closed', () => {
  assert.equal(matchesCareerStage('', 'received', 'all'), true);
  assert.equal(matchesCareerStage('interview', 'received', 'all'), false);
  assert.equal(matchesCareerStage('closed', 'closed', 'all'), true);
  assert.equal(matchesCareerStage('rejected', 'rejected', 'all'), true);
  assert.equal(matchesCareerStage('rejected', 'all', 'scored'), true);
  assert.equal(matchesCareerStage('rejected', 'all', 'all'), false);
});

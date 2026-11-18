import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeSurvey } from '../src/surveyAnalysis.js';

test('weights each scale answer equally and excludes multiple choice answers', () => {
  const summary = summarizeSurvey({
    respondents: 5,
    completed: 4,
    topics: [
      { title: 'Liderança', average: 5, questions: [
        { type: 'scale', options: [0, 0, 0, 0, 4].map(count => ({ count })) },
      ] },
      { title: 'Comunicação', average: 1, questions: [
        { type: 'scale', options: [1, 0, 0, 0, 0].map(count => ({ count })) },
      ] },
      { title: 'Preferências', average: null, questions: [
        { type: 'single', options: [{ count: 5 }] },
      ] },
    ],
  });
  assert.deepEqual(summary.distribution, [1, 0, 0, 0, 4]);
  assert.equal(summary.average, 4.2);
  assert.equal(summary.favorable, 0.8);
  assert.equal(summary.completion, 0.8);
  assert.equal(summary.strengths[0].title, 'Liderança');
  assert.equal(summary.attention[0].title, 'Comunicação');
});

test('leaves indicators unavailable when their denominator is zero', () => {
  const { average, favorable, completion } = summarizeSurvey({ respondents: 0, completed: 0, topics: [] });
  assert.deepEqual([average, favorable, completion], [null, null, null]);
});
